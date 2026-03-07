package config

import (
	"fmt"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	Port                     string
	MongoDBURI               string
	MongoDBDatabase          string
	RedisURL                 string
	NATSURL                  string
	JWTSecret                string
	FrontendURL              string
	Environment              string
	ActiveVisitorTimeoutMins int
	RealtimeStatsWindowMins  int
}

func Load() (*Config, error) {
	_ = godotenv.Load()

	return &Config{
		Port:                     getEnv("PORT", "8080"),
		MongoDBURI:               getEnv("MONGODB_URI", "mongodb://localhost:27017"),
		MongoDBDatabase:          getEnv("MONGODB_DATABASE", "herodotus"),
		RedisURL:                 getEnv("REDIS_URL", "redis://localhost:6379"),
		NATSURL:                  getEnv("NATS_URL", "nats://localhost:4222"),
		JWTSecret:                getEnv("JWT_SECRET", "change-me-in-production"),
		FrontendURL:              getEnv("FRONTEND_URL", "http://localhost:3000"),
		Environment:              getEnv("ENVIRONMENT", "development"),
		ActiveVisitorTimeoutMins: getEnvInt("ACTIVE_VISITOR_TIMEOUT_MINS", 5),
		RealtimeStatsWindowMins:  getEnvInt("REALTIME_STATS_WINDOW_MINS", 60),
	}, nil
}

func getEnvInt(key string, defaultValue int) int {
	if value := os.Getenv(key); value != "" {
		var result int
		fmt.Sscanf(value, "%d", &result)
		return result
	}
	return defaultValue
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
