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
	eventRepo                *repository.EventRepository
	cache                    *cache.RedisCache
	queue                    *queue.NATSQueue
	activeVisitorTimeoutMins int
	realtimeStatsWindowMins  int
}

func NewTrackingService(
	eventRepo *repository.EventRepository,
	cache *cache.RedisCache,
	queue *queue.NATSQueue,
	timeoutMins int,
	statsWindowMins int,
) *TrackingService {
	return &TrackingService{
		eventRepo:                eventRepo,
		cache:                    cache,
		queue:                    queue,
		activeVisitorTimeoutMins: timeoutMins,
		realtimeStatsWindowMins:  statsWindowMins,
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
		Country:   utils.GetCountryFromIP(ip),
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

	// Set 24h expiration on the active visitors key to ensure it's cleaned up even if not checked
	_ = s.cache.Expire(ctx, activeVisitorsKey, 24*time.Hour)

	// Publish real-time update
	s.cache.Publish(ctx, fmt.Sprintf("realtime:%s", domainID.Hex()), event)

	return nil
}

func (s *TrackingService) GetRealtimeStats(ctx context.Context, domainID primitive.ObjectID, period string) (*domain.RealtimeStats, error) {
	// Get active visitors count from Sorted Set
	activeVisitorsKey := fmt.Sprintf("active_visitors:%s", domainID.Hex())

	// Remove visitors inactive for more than X minutes
	fiveMinutesAgo := fmt.Sprintf("%d", time.Now().UTC().Add(-time.Duration(s.activeVisitorTimeoutMins)*time.Minute).Unix())
	s.cache.ZRemRangeByScore(ctx, activeVisitorsKey, "-inf", fiveMinutesAgo)

	// Count remaining active visitors
	count, _ := s.cache.ZCard(ctx, activeVisitorsKey)
	activeVisitors := int(count)

	// Get aggregated stats from DB based on period
	var since time.Time
	switch period {
	case "24h":
		since = time.Now().UTC().Add(-24 * time.Hour)
	case "7d":
		since = time.Now().UTC().Add(-7 * 24 * time.Hour)
	case "30d":
		since = time.Now().UTC().Add(-30 * 24 * time.Hour)
	default:
		since = time.Now().UTC().Add(-time.Duration(s.realtimeStatsWindowMins) * time.Minute)
	}

	stats, err := s.eventRepo.GetAggregatedStats(ctx, domainID, since, period)
	if err != nil {
		return nil, err
	}

	stats.ActiveVisitors = activeVisitors

	// Fill gaps based on period
	hitsMap := make(map[string]int)
	for _, h := range stats.HitsPerMinute {
		hitsMap[h.Minute] = h.Hits
	}

	var fullHits []domain.HitsPerMinute
	now := time.Now().UTC()

	var numSteps int
	var step time.Duration
	var format string

	switch period {
	case "24h":
		numSteps = 24
		step = time.Hour
		format = "2006-01-02 15:00"
	case "7d":
		numSteps = 7
		step = 24 * time.Hour
		format = "2006-01-02"
	case "30d":
		numSteps = 30
		step = 24 * time.Hour
		format = "2006-01-02"
	default: // 60m
		numSteps = 60
		step = time.Minute
		format = "15:04"
	}

	for i := numSteps - 1; i >= 0; i-- {
		t := now.Add(-time.Duration(i) * step)
		key := t.Format(format)
		fullHits = append(fullHits, domain.HitsPerMinute{
			Minute: key,
			Hits:   hitsMap[key],
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

func (s *TrackingService) GetUnifiedStats(ctx context.Context, domainID primitive.ObjectID, period string) (map[string]interface{}, error) {
	realtime, err := s.GetRealtimeStats(ctx, domainID, period)
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
