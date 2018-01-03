package main

import (
	"fmt"
	"net/url"

	"github.com/julsemaan/golongpoll-client"
)

type ClusterObserver struct {
	Hosts []string
}

func NewClusterObserver(hosts []string) *ClusterObserver {
	return &ClusterObserver{Hosts: hosts}
}

func (co *ClusterObserver) Start() {
	for _, host := range co.Hosts {
		go func(host string) {
			u, err := url.Parse(host + "/events")
			if err != nil {
				fmt.Println("ERROR while parsing cluster URL", u, err)
			}

			client := glpclient.NewClient(u, "reload")
			client.Start()

			for {
				<-client.EventsChan
				subscriptions.Reload()
			}
		}(host)
	}
}
