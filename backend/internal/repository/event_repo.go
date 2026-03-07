package repository

import (
	"context"
	"time"

	"github.com/nesohq/backend/internal/domain"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type EventRepository struct {
	collection *mongo.Collection
}

func NewEventRepository(db *mongo.Database) *EventRepository {
	return &EventRepository{
		collection: db.Collection("events"),
	}
}

func (r *EventRepository) Create(ctx context.Context, event *domain.Event) error {
	event.Timestamp = time.Now()
	_, err := r.collection.InsertOne(ctx, event)
	return err
}

func (r *EventRepository) GetRecentEvents(ctx context.Context, domainID primitive.ObjectID, minutes int) ([]*domain.Event, error) {
	since := time.Now().Add(-time.Duration(minutes) * time.Minute)

	cursor, err := r.collection.Find(
		ctx,
		bson.M{
			"domain_id": domainID,
			"timestamp": bson.M{"$gte": since},
		},
		options.Find().SetSort(bson.D{{Key: "timestamp", Value: -1}}),
	)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var events []*domain.Event
	if err := cursor.All(ctx, &events); err != nil {
		return nil, err
	}
	return events, nil
}

func (r *EventRepository) CountTotal(ctx context.Context, domainID primitive.ObjectID) (int64, error) {
	return r.collection.CountDocuments(ctx, bson.M{"domain_id": domainID})
}

func (r *EventRepository) CountUnique(ctx context.Context, domainID primitive.ObjectID, since time.Time) (int64, error) {
	pipeline := mongo.Pipeline{
		{{Key: "$match", Value: bson.M{
			"domain_id": domainID,
			"timestamp": bson.M{"$gte": since},
		}}},
		{{Key: "$group", Value: bson.M{
			"_id": "$visitor_id",
		}}},
		{{Key: "$count", Value: "total"}},
	}

	cursor, err := r.collection.Aggregate(ctx, pipeline)
	if err != nil {
		return 0, err
	}
	defer cursor.Close(ctx)

	var result []bson.M
	if err := cursor.All(ctx, &result); err != nil {
		return 0, err
	}

	if len(result) > 0 {
		return int64(result[0]["total"].(int32)), nil
	}
	return 0, nil
}

func (r *EventRepository) GetAggregatedStats(ctx context.Context, domainID primitive.ObjectID, since time.Time, period string) (*domain.RealtimeStats, error) {
	dateFormat := "%H:%M"
	chartSince := since

	switch period {
	case "24h":
		dateFormat = "%Y-%m-%d %H:00"
	case "7d", "30d":
		dateFormat = "%Y-%m-%d"
	default: // 60m
		// For Live view, we always want 60 minutes of chart data
		// even if the categories window (since) is smaller
		chartSince = time.Now().UTC().Add(-60 * time.Minute)
	}

	pipeline := mongo.Pipeline{
		bson.D{{Key: "$match", Value: bson.M{
			"domain_id": domainID,
			"timestamp": bson.M{"$gte": chartSince}, // Match everything needed for the chart
		}}},
		bson.D{{Key: "$facet", Value: bson.M{
			"top_pages": []bson.D{
				{{Key: "$match", Value: bson.M{"timestamp": bson.M{"$gte": since}}}},
				{{Key: "$group", Value: bson.M{"_id": "$path", "hits": bson.M{"$sum": 1}}}},
				{{Key: "$sort", Value: bson.M{"hits": -1}}},
				{{Key: "$limit", Value: 10}},
			},
			"top_referrers": []bson.D{
				{{Key: "$match", Value: bson.M{"timestamp": bson.M{"$gte": since}}}},
				{{Key: "$group", Value: bson.M{"_id": "$referrer", "hits": bson.M{"$sum": 1}}}},
				{{Key: "$sort", Value: bson.M{"hits": -1}}},
				{{Key: "$limit", Value: 10}},
			},
			"browsers": []bson.D{
				{{Key: "$match", Value: bson.M{"timestamp": bson.M{"$gte": since}}}},
				{{Key: "$group", Value: bson.M{"_id": bson.M{"browser": "$browser", "visitor_id": "$visitor_id"}}}},
				{{Key: "$group", Value: bson.M{"_id": "$_id.browser", "hits": bson.M{"$sum": 1}}}},
			},
			"devices": []bson.D{
				{{Key: "$match", Value: bson.M{"timestamp": bson.M{"$gte": since}}}},
				{{Key: "$group", Value: bson.M{"_id": bson.M{"device": "$device", "visitor_id": "$visitor_id"}}}},
				{{Key: "$group", Value: bson.M{"_id": "$_id.device", "hits": bson.M{"$sum": 1}}}},
			},
			"countries": []bson.D{
				{{Key: "$match", Value: bson.M{"timestamp": bson.M{"$gte": since}}}},
				{{Key: "$group", Value: bson.M{"_id": bson.M{"country": "$country", "visitor_id": "$visitor_id"}}}},
				{{Key: "$group", Value: bson.M{"_id": "$_id.country", "hits": bson.M{"$sum": 1}}}},
			},
			"hits_per_minute": []bson.D{
				{{Key: "$group", Value: bson.M{
					"_id": bson.M{
						"$dateToString": bson.M{"format": dateFormat, "date": "$timestamp"},
					},
					"hits": bson.M{"$sum": 1},
				}}},
				{{Key: "$sort", Value: bson.M{"_id": 1}}},
			},
		}}},
	}

	cursor, err := r.collection.Aggregate(ctx, pipeline)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var results []bson.M
	if err := cursor.All(ctx, &results); err != nil {
		return nil, err
	}

	if len(results) == 0 {
		return &domain.RealtimeStats{}, nil
	}

	facet := results[0]
	stats := &domain.RealtimeStats{
		Countries: make(map[string]int),
		Devices:   make(map[string]int),
		Browsers:  make(map[string]int),
	}

	// Parse Top Pages
	if topPages, ok := facet["top_pages"].(primitive.A); ok {
		for _, item := range topPages {
			m := item.(bson.M)
			stats.TopPages = append(stats.TopPages, domain.PageStats{
				Path: m["_id"].(string),
				Hits: int(m["hits"].(int32)),
			})
		}
	}

	// Parse Top Referrers
	if topRefs, ok := facet["top_referrers"].(primitive.A); ok {
		for _, item := range topRefs {
			m := item.(bson.M)
			stats.TopReferrers = append(stats.TopReferrers, domain.ReferrerStats{
				Referrer: m["_id"].(string),
				Hits:     int(m["hits"].(int32)),
			})
		}
	}

	// Parse Browsers, Devices, Countries
	parseMap := func(data interface{}, target map[string]int) {
		if items, ok := data.(primitive.A); ok {
			for _, item := range items {
				m := item.(bson.M)
				if id, ok := m["_id"].(string); ok {
					target[id] = int(m["hits"].(int32))
				}
			}
		}
	}
	parseMap(facet["browsers"], stats.Browsers)
	parseMap(facet["devices"], stats.Devices)
	parseMap(facet["countries"], stats.Countries)

	// Parse Hits Per Minute
	if hpm, ok := facet["hits_per_minute"].(primitive.A); ok {
		for _, item := range hpm {
			m := item.(bson.M)
			stats.HitsPerMinute = append(stats.HitsPerMinute, domain.HitsPerMinute{
				Minute: m["_id"].(string),
				Hits:   int(m["hits"].(int32)),
			})
		}
	}

	return stats, nil
}
