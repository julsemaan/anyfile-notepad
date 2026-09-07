module github.com/julsemaan/anyfile-notepad/api

go 1.26.0

require (
	github.com/julsemaan/rest-layer-file v0.0.0-20230518012330-1c28ed9eb6a7
	github.com/patrickmn/go-cache v2.1.0+incompatible
	github.com/prometheus/client_golang v1.24.1
	// ponytail: newer REST Layer needs a rest-layer-file storage API migration.
	github.com/rs/rest-layer v0.0.0-20160505213648-cb84bc79b5b8
)

require (
	github.com/beorn7/perks v1.0.1 // indirect
	github.com/cespare/xxhash/v2 v2.3.0 // indirect
	github.com/munnerz/goautoneg v0.0.0-20191010083416-a7dc8b61c822 // indirect
	github.com/prometheus/client_model v0.6.3 // indirect
	github.com/prometheus/common v0.71.0 // indirect
	github.com/prometheus/procfs v0.22.0 // indirect
	github.com/rs/cors v1.11.1 // indirect
	// Match REST Layer's test API; latest mem would make tidy upgrade REST Layer.
	github.com/rs/rest-layer-mem v0.0.0-20160410020354-09a02b117863 // indirect
	github.com/rs/xid v1.6.0 // indirect
	golang.org/x/crypto v0.56.0 // indirect
	golang.org/x/net v0.58.0 // indirect
	golang.org/x/sys v0.47.0 // indirect
	google.golang.org/protobuf v1.36.12 // indirect
)
