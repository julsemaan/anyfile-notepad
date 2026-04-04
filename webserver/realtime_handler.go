package main

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

var publishRealtime = func(category string, event map[string]interface{}) error {
	return realtimeManager.Publish(category, event)
}

func publishRealtimeEvent(c *gin.Context) {
	category := c.Param("category")

	var event map[string]interface{}
	if err := c.BindJSON(&event); err == nil {
		err := publishRealtime(category, event)
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
