package utils

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"
)

type GeoIPResponse struct {
	Status  string `json:"status"`
	Country string `json:"country"`
	Message string `json:"message"`
}

var geoCache = make(map[string]string)
var httpClient = &http.Client{
	Timeout: 2 * time.Second,
}

func GetCountryFromIP(ip string) string {
	if ip == "127.0.0.1" || ip == "::1" || ip == "" {
		return "Local"
	}

	// Check cache
	if country, ok := geoCache[ip]; ok {
		return country
	}

	// Call ip-api.com (free tier, JSON)
	url := fmt.Sprintf("http://ip-api.com/json/%s?fields=status,country,message", ip)
	resp, err := httpClient.Get(url)
	if err != nil {
		fmt.Printf("GeoIP Error: %v\n", err)
		return "Unknown"
	}
	defer resp.Body.Close()

	var geo GeoIPResponse
	if err := json.NewDecoder(resp.Body).Decode(&geo); err != nil {
		fmt.Printf("GeoIP Decode Error: %v\n", err)
		return "Unknown"
	}

	if geo.Status != "success" {
		fmt.Printf("GeoIP Status Error: %s (%s)\n", geo.Status, geo.Message)
		// Don't cache errors
		return "Unknown"
	}

	// Simple cache management (optional: limit size in production)
	if len(geoCache) < 1000 {
		geoCache[ip] = geo.Country
	}

	return geo.Country
}
