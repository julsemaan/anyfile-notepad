package stats

import (
	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promauto"
)

var statsHitsCounter = promauto.NewCounter(prometheus.CounterOpts{
	Name: "afn_stats_hits_total",
	Help: "Number of accepted stats payloads.",
})

var statsIncrementCounter = promauto.NewCounterVec(
	prometheus.CounterOpts{
		Name: "afn_stats_increment_total",
		Help: "Number of accepted increment stats by key.",
	},
	[]string{"key"},
)

type PrometheusMetrics struct{}

func NewPrometheusMetrics() *PrometheusMetrics {
	return &PrometheusMetrics{}
}

func (m *PrometheusMetrics) IncrementStatsHits() {
	statsHitsCounter.Inc()
}

func (m *PrometheusMetrics) IncrementKey(key string) {
	statsIncrementCounter.WithLabelValues(key).Inc()
}
