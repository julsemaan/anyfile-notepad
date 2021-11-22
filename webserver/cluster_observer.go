package main

import (
	"encoding/json"
	"fmt"
	"net/url"
	"os"

	"github.com/jcuga/golongpoll/go-client/glpclient"
)

type ClusterObserver struct {
	Hosts []string
}

func NewClusterObserver(hosts []string) *ClusterObserver {
	return &ClusterObserver{Hosts: hosts}
}

func (co *ClusterObserver) hostURL(host string) *url.URL {
	u, err := url.Parse(host + "/events")
	if err != nil {
		fmt.Println("ERROR while parsing cluster URL", u, err)
	}
	return u
}

func (co *ClusterObserver) glpclient(host, category string) *glpclient.Client {
	u := co.hostURL(host)
	c := glpclient.NewClient(u, category)
	if username := os.Getenv("CLUSTER_OBSERVER_USERNAME"); username != "" {
		c.BasicAuthUsername = username
	}
	if password := os.Getenv("CLUSTER_OBSERVER_PASSWORD"); password != "" {
		c.BasicAuthPassword = password
	}
	return c
}

func (co *ClusterObserver) Start() {
	for _, host := range co.Hosts {
		go func(host string) {
			go func() {
				reloadClient := co.glpclient(host, "reload")
				reloadClient.Start()

				for {
					<-reloadClient.EventsChan
					fmt.Println("Received reload signal from host", host)
					subscriptions.Reload()
				}
			}()

			go func() {
				sessionsClient := co.glpclient(host, "sessions")
				sessionsClient.Start()

				for {
					sessionEvent := <-sessionsClient.EventsChan
					session := &PlusPlusSessionSync{}
					err := json.Unmarshal(sessionEvent.Data, session)
					if err != nil {
						fmt.Println("ERROR: Failed to decode the session received from a peer", err)
						continue
					}
					plusPlusSessions.Set(session.ID, session.PPS)
				}
			}()
		}(host)
	}
}
