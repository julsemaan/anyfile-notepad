package main

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func publishRealtimeEvent(c *gin.Context) {
	category := c.Param("category")

	var event map[string]interface{}
	if err := c.BindJSON(&event); err == nil {
		err := realtimeManager.Publish(category, event)
		if err != nil {
			msg := "ERROR: Failed to publish event: " + err.Error()
			c.JSON(http.StatusInternalServerError, gin.H{"message": msg})
		} else {
			c.JSON(http.StatusOK, gin.H{"message": "ok"})
		}
	} else {
		msg := "ERROR: Failed to decode JSON body: " + err.Error()
		c.JSON(http.StatusOK, gin.H{"message": msg})
	}
}
