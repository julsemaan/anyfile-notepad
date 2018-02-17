package main

import (
	"encoding/json"
	"os"
	"sync"
	"time"
)

const PLUS_PLUS_SESSION_VALIDITY = 24 * time.Hour

type PlusPlusSessionSync struct {
	ID  string
	PPS *PlusPlusSession
}

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

func (pps *PlusPlusSessions) RestoreFromFile(path string) error {
	pps.sem.Lock()
	defer pps.sem.Unlock()

	f, err := os.Open(path)
	if err != nil {
		return err
	}

	dec := json.NewDecoder(f)
	err = dec.Decode(&pps.data)
	f.Close()

	return err
}

func (pps *PlusPlusSessions) SaveToFile(path string) error {
	pps.sem.Lock()
	defer pps.sem.Unlock()

	tmp, err := os.Create(path + "-tmp")
	if err != nil {
		return err
	}

	enc := json.NewEncoder(tmp)
	err = enc.Encode(pps.data)
	tmp.Close()

	if err != nil {
		return err
	}

	err = os.Rename(tmp.Name(), path)

	return err
}
