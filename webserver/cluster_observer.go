package main

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"time"
)

type PollResponse struct {
	Events    []PollEvent `json:"events"`
	Timestamp int64       `json:"timestamp"`
}

// Taken from https://github.com/jcuga/golongpoll/blob/master/events.go
type PollEvent struct {
	// Timestamp is milliseconds since epoch to match javascrits Date.getTime()
	Timestamp int64  `json:"timestamp"`
	Category  string `json:"category"`
	// NOTE: Data can be anything that is able to passed to json.Marshal()
	Data interface{} `json:"data"`
}

type ClusterObserver struct {
	Hosts []string
}

func NewClusterObserver(hosts []string) *ClusterObserver {
	return &ClusterObserver{Hosts: hosts}
}

func (co *ClusterObserver) Start() {
	for _, host := range co.Hosts {
		fmt.Println("Now observing changes on", host)
		go func() {
			host := host
			since := time.Now().Unix() * 1000
			for {
				pr := co.fetchEvents(host, since)
				if len(pr.Events) > 0 {
					fmt.Println("Got", len(pr.Events), "events")
					for _, event := range pr.Events {
						since = event.Timestamp
						subscriptions.Reload()
					}
				} else {
					// Only push timestamp forward if its greater than the last we checked
					if pr.Timestamp > since {
						since = pr.Timestamp
					}
				}
			}
		}()
	}
}

func (co ClusterObserver) fetchEvents(host string, since int64) PollResponse {
	fmt.Println("Checking for changes events since", since)
	resp, err := http.Get(host + "/events?" + url.Values{
		"category":   {"reload"},
		"since_time": {fmt.Sprintf("%d", since)},
		"timeout":    {"30"},
	}.Encode())
	if err != nil {
		fmt.Println("Error while connecting to", host, "to observe changes", err)
		// Wait 30 seconds before retrying
		time.Sleep(30 * time.Second)
	}

	decoder := json.NewDecoder(resp.Body)
	defer resp.Body.Close()

	var pr PollResponse
	decoder.Decode(&pr)
	if err != nil {
		fmt.Println("Error while decoding poll response", err)
	}

	return pr
}
