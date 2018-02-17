package main

import (
	"sync"
	"time"
)

const PLUS_PLUS_SESSION_VALIDITY = 24 * time.Hour

type PlusPlusSession struct {
	GoogleUserId string
	ValidUntil   time.Time
}

func NewPlusPlusSession(userId string) *PlusPlusSession {
	return &PlusPlusSession{
		GoogleUserId: userId,
		ValidUntil:   time.Now().Add(PLUS_PLUS_SESSION_VALIDITY),
	}
}

type PlusPlusSessions struct {
	sem  *sync.RWMutex
	data map[string]*PlusPlusSession
}

func NewPlusPlusSessions() *PlusPlusSessions {
	return &PlusPlusSessions{
		sem:  &sync.RWMutex{},
		data: make(map[string]*PlusPlusSession),
	}
}

func (pps *PlusPlusSessions) Set(id string, s *PlusPlusSession) {
	pps.sem.Lock()
	defer pps.sem.Unlock()
	pps.data[id] = s
}

func (pps *PlusPlusSessions) Get(id string) *PlusPlusSession {
	pps.sem.RLock()
	defer pps.sem.RUnlock()
	return pps.data[id]
}
