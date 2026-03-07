package service

import (
	"context"
	"fmt"
	"time"

	"github.com/nesohq/backend/internal/domain"
	"github.com/nesohq/backend/internal/infrastructure/cache"
	"github.com/nesohq/backend/internal/infrastructure/queue"
	"github.com/nesohq/backend/internal/repository"
	"github.com/nesohq/backend/internal/utils"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type TrackingService struct {
	eventRepo *repository.EventRepository
	cache     *cache.RedisCache
	queue     *queue.NATSQueue
}

func NewTrackingService(
	eventRepo *repository.EventRepository,
	cache *cache.RedisCache,
	queue *queue.NATSQueue,
) *TrackingService {
	return &TrackingService{
		eventRepo: eventRepo,
		cache:     cache,
		queue:     queue,
	}
}

func (s *TrackingService) Track(ctx context.Context, domainID primitive.ObjectID, req *domain.TrackRequest, ip, userAgent string) error {
	// Parse user agent
	uaInfo := utils.ParseUserAgent(userAgent)

	// Create event
	event := &domain.Event{
		DomainID:  domainID,
		Path:      req.Path,
		Referrer:  req.Referrer,
		UserAgent: userAgent,
		IPHash:    utils.HashIP(ip),
		Browser:   uaInfo.Browser,
		Device:    uaInfo.Device,
		Country:   "Unknown", // TODO: Add GeoIP
		VisitorID: req.VisitorID,
	}

	// Publish to queue for async processing
	if err := s.queue.Publish("events", event); err != nil {
		return err
	}

	// Mark visitor as active using Sorted Set
	activeVisitorsKey := fmt.Sprintf("active_visitors:%s", domainID.Hex())
	now := float64(time.Now().Unix())
	if err := s.cache.ZAdd(ctx, activeVisitorsKey, req.VisitorID, now); err != nil {
		return err
	}

	// Publish real-time update
	s.cache.Publish(ctx, fmt.Sprintf("realtime:%s", domainID.Hex()), event)

	return nil
}

func (s *TrackingService) GetRealtimeStats(ctx context.Context, domainID primitive.ObjectID) (*domain.RealtimeStats, error) {
	// Get active visitors count from Sorted Set
	activeVisitorsKey := fmt.Sprintf("active_visitors:%s", domainID.Hex())

	// Remove visitors inactive for more than 5 minutes
	fiveMinutesAgo := fmt.Sprintf("%d", time.Now().Add(-5*time.Minute).Unix())
	s.cache.ZRemRangeByScore(ctx, activeVisitorsKey, "-inf", fiveMinutesAgo)

	// Count remaining active visitors
	count, _ := s.cache.ZCard(ctx, activeVisitorsKey)
	activeVisitors := int(count)

	// Get aggregated stats from DB (last 60 minutes)
	since := time.Now().Add(-60 * time.Minute)
	stats, err := s.eventRepo.GetAggregatedStats(ctx, domainID, since)
	if err != nil {
		return nil, err
	}

	stats.ActiveVisitors = activeVisitors

	// Ensure all 60 minutes are present (fill gaps)
	hitsMap := make(map[string]int)
	for _, h := range stats.HitsPerMinute {
		hitsMap[h.Minute] = h.Hits
	}

	now := time.Now().UTC()
	fullHits := []domain.HitsPerMinute{}
	for i := 59; i >= 0; i-- {
		minuteTime := now.Add(-time.Duration(i) * time.Minute)
		minuteKey := minuteTime.Format("15:04")
		fullHits = append(fullHits, domain.HitsPerMinute{
			Minute: minuteKey,
			Hits:   hitsMap[minuteKey],
		})
	}
	stats.HitsPerMinute = fullHits

	return stats, nil
}

func (s *TrackingService) GetOverviewStats(ctx context.Context, domainID primitive.ObjectID) (*domain.OverviewStats, error) {
	totalHits, err := s.eventRepo.CountTotal(ctx, domainID)
	if err != nil {
		return nil, err
	}

	since := time.Now().Add(-24 * time.Hour)
	uniqueVisitors, err := s.eventRepo.CountUnique(ctx, domainID, since)
	if err != nil {
		return nil, err
	}

	return &domain.OverviewStats{
		TotalHits:      totalHits,
		UniqueVisitors: uniqueVisitors,
		AvgSessionTime: 0, // TODO: Calculate
		BounceRate:     0, // TODO: Calculate
	}, nil
}

func (s *TrackingService) GetUnifiedStats(ctx context.Context, domainID primitive.ObjectID) (map[string]interface{}, error) {
	realtime, err := s.GetRealtimeStats(ctx, domainID)
	if err != nil {
		return nil, err
	}

	overview, err := s.GetOverviewStats(ctx, domainID)
	if err != nil {
		return nil, err
	}

	return map[string]interface{}{
		"realtime": realtime,
		"overview": overview,
	}, nil
}
