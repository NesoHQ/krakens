package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
)

func TestTrackingCORSMiddleware(t *testing.T) {
	gin.SetMode(gin.TestMode)

	t.Run("Origin header present", func(t *testing.T) {
		router := gin.New()
		router.Use(TrackingCORSMiddleware())
		router.POST("/api/track", func(c *gin.Context) {
			c.Status(http.StatusOK)
		})

		w := httptest.NewRecorder()
		req, _ := http.NewRequest("POST", "/api/track", nil)
		req.Header.Set("Origin", "https://example.com")
		router.ServeHTTP(w, req)

		if w.Header().Get("Access-Control-Allow-Origin") != "https://example.com" {
			t.Errorf("expected Access-Control-Allow-Origin to be https://example.com, got %s", w.Header().Get("Access-Control-Allow-Origin"))
		}
		if w.Header().Get("Access-Control-Allow-Credentials") != "true" {
			t.Errorf("expected Access-Control-Allow-Credentials to be true, got %s", w.Header().Get("Access-Control-Allow-Credentials"))
		}
	})

	t.Run("Origin header missing", func(t *testing.T) {
		router := gin.New()
		router.Use(TrackingCORSMiddleware())
		router.POST("/api/track", func(c *gin.Context) {
			c.Status(http.StatusOK)
		})

		w := httptest.NewRecorder()
		req, _ := http.NewRequest("POST", "/api/track", nil)
		router.ServeHTTP(w, req)

		// This is the problematic case: Origin is * while Credentials is true
		if w.Header().Get("Access-Control-Allow-Origin") == "*" && w.Header().Get("Access-Control-Allow-Credentials") == "true" {
			t.Log("reproduced: Origin is * while Credentials is true, which causes browser errors")
		}
	})

	t.Run("Vary header missing", func(t *testing.T) {
		router := gin.New()
		router.Use(TrackingCORSMiddleware())
		router.POST("/api/track", func(c *gin.Context) {
			c.Status(http.StatusOK)
		})

		w := httptest.NewRecorder()
		req, _ := http.NewRequest("POST", "/api/track", nil)
		req.Header.Set("Origin", "https://example.com")
		router.ServeHTTP(w, req)

		if w.Header().Get("Vary") != "Origin" {
			t.Log("reproduced: Vary: Origin header is missing")
		}
	})
}
