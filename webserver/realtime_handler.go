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
			msg := "Failed to publish event: " + err.Error()
			ErrPrint(msg)
			c.JSON(http.StatusInternalServerError, gin.H{"message": msg})
		} else {
			c.JSON(http.StatusOK, gin.H{"message": "ok"})
		}
	} else {
		msg := "Failed to decode JSON body: " + err.Error()
		InfoPrint(msg)
		c.JSON(http.StatusOK, gin.H{"message": msg})
	}
}
