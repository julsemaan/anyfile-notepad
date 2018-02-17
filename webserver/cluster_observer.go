package main

import (
	"encoding/json"
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

func (co *ClusterObserver) hostURL(host string) *url.URL {
	u, err := url.Parse(host + "/events")
	if err != nil {
		fmt.Println("ERROR while parsing cluster URL", u, err)
	}
	return u
}

func (co *ClusterObserver) Start() {
	for _, host := range co.Hosts {
		go func(host string) {
			go func() {
				u := co.hostURL(host)
				reloadClient := glpclient.NewClient(u, "reload")
				reloadClient.Start()

				for {
					<-reloadClient.EventsChan
					fmt.Println("Received reload signal from host", host)
					subscriptions.Reload()
				}
			}()

			go func() {
				u := co.hostURL(host)
				sessionsClient := glpclient.NewClient(u, "sessions")
				sessionsClient.Start()

				for {
					sessionJSON := <-sessionsClient.EventsChan
					session := &PlusPlusSessionSync{}
					err := json.Unmarshal(sessionJSON, session)
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
