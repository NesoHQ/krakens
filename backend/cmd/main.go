package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gin-gonic/gin"

	"github.com/nesohq/backend/internal/config"
	"github.com/nesohq/backend/internal/domain"
	"github.com/nesohq/backend/internal/handler"
	"github.com/nesohq/backend/internal/infrastructure/cache"
	"github.com/nesohq/backend/internal/infrastructure/db"
	"github.com/nesohq/backend/internal/infrastructure/queue"
	"github.com/nesohq/backend/internal/middleware"
	"github.com/nesohq/backend/internal/repository"
	"github.com/nesohq/backend/internal/service"
)

func main() {
	// Root context
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	// Load config
	cfg, err := config.Load()
	if err != nil {
		log.Fatal("failed to load config:", err)
	}

	// MongoDB
	mongodb, err := db.NewMongoDB(cfg.MongoDBURI, cfg.MongoDBDatabase)
	if err != nil {
		log.Fatal("failed to connect to MongoDB:", err)
	}
	defer mongodb.Close()

	indexCtx, cancelIndex := context.WithTimeout(ctx, 10*time.Second)
	defer cancelIndex()

	if err := mongodb.EnsureIndexes(indexCtx); err != nil {
		log.Printf("warning: failed to ensure indexes: %v", err)
	}

	// Redis
	redisCache, err := cache.NewRedisCache(cfg.RedisURL)
	if err != nil {
		log.Fatal("failed to connect to Redis:", err)
	}
	defer redisCache.Close()

	// NATS
	natsQueue, err := queue.NewNATSQueue(cfg.NATSURL)
	if err != nil {
		log.Fatal("failed to connect to NATS:", err)
	}
	defer natsQueue.Close()

	// Repositories
	userRepo := repository.NewUserRepository(mongodb.Database)
	domainRepo := repository.NewDomainRepository(mongodb.Database)
	apiKeyRepo := repository.NewAPIKeyRepository(mongodb.Database)
	eventRepo := repository.NewEventRepository(mongodb.Database)

	// Services
	authService := service.NewAuthService(userRepo, cfg.JWTSecret)
	domainService := service.NewDomainService(domainRepo)
	apiKeyService := service.NewAPIKeyService(apiKeyRepo)
	trackingService := service.NewTrackingService(
		eventRepo,
		redisCache,
		natsQueue,
		cfg.ActiveVisitorTimeoutMins,
		cfg.RealtimeStatsWindowMins,
	)

	// Handlers
	authHandler := handler.NewAuthHandler(authService)
	domainHandler := handler.NewDomainHandler(domainService)
	apiKeyHandler := handler.NewAPIKeyHandler(apiKeyService)
	trackingHandler := handler.NewTrackingHandler(trackingService, apiKeyService)

	// Start background worker
	go startEventWorker(ctx, natsQueue, eventRepo)

	// Router
	router := gin.New()
	router.Use(gin.Logger())
	router.Use(gin.Recovery())

	router.Use(gin.LoggerWithConfig(gin.LoggerConfig{
		SkipPaths: []string{"/health"},
	}))

	// Global middlewares
	router.Use(middleware.CORSMiddleware(cfg.FrontendURL))

	// Tracking endpoint (custom permissive CORS)
	router.POST("/api/track",
		middleware.TrackingCORSMiddleware(),
		trackingHandler.Track,
	)

	// Public routes
	public := router.Group("/api")
	{
		public.POST("/auth/register", authHandler.Register)
		public.POST("/auth/login", authHandler.Login)
	}

	// Protected routes
	protected := router.Group("/api")
	protected.Use(middleware.AuthMiddleware(cfg.JWTSecret))
	{
		// Domains
		protected.GET("/domains", domainHandler.List)
		protected.POST("/domains", domainHandler.Create)
		protected.GET("/domains/:id", domainHandler.GetByID)
		protected.PUT("/domains/:id", domainHandler.Update)
		protected.POST("/domains/:id/verify", domainHandler.Verify)
		protected.DELETE("/domains/:id", domainHandler.Delete)

		// API Keys
		protected.GET("/api-keys", apiKeyHandler.List)
		protected.POST("/api-keys", apiKeyHandler.Create)
		protected.DELETE("/api-keys/:id", apiKeyHandler.Revoke)

		// Stats
		protected.GET("/stats/realtime", trackingHandler.GetRealtimeStats)
		protected.GET("/stats/overview", trackingHandler.GetOverviewStats)
		protected.GET("/stats/unified", trackingHandler.GetUnifiedStats)
	}

	// Health endpoint
	router.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status": "ok",
		})
	})

	// HTTP Server
	addr := fmt.Sprintf(":%s", cfg.Port)

	srv := &http.Server{
		Addr:         addr,
		Handler:      router,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 10 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	// Start server
	go func() {
		log.Printf("server starting on %s", addr)

		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatal("failed to start server:", err)
		}
	}()

	// Graceful shutdown
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)

	<-quit
	log.Println("shutting down server...")

	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer shutdownCancel()

	if err := srv.Shutdown(shutdownCtx); err != nil {
		log.Fatal("server forced to shutdown:", err)
	}

	cancel()

	log.Println("server exited properly")
}

func startEventWorker(
	ctx context.Context,
	natsQueue *queue.NATSQueue,
	eventRepo *repository.EventRepository,
) {

	log.Println("starting event worker...")

	_, err := natsQueue.Subscribe("events", func(data []byte) {

		var event domain.Event

		if err := json.Unmarshal(data, &event); err != nil {
			log.Printf("failed to unmarshal event: %v", err)
			return
		}

		saveCtx, cancel := context.WithTimeout(ctx, 5*time.Second)
		defer cancel()

		if err := eventRepo.Create(saveCtx, &event); err != nil {
			log.Printf("failed to save event: %v", err)
		}

	})

	if err != nil {
		log.Fatal("failed to subscribe to events:", err)
	}

	<-ctx.Done()

	log.Println("event worker shutting down")
}
