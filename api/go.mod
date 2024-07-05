module github.com/julsemaan/anyfile-notepad/api

go 1.12

require (
	github.com/julsemaan/anyfile-notepad/utils v0.0.0-20230202010526-481b7f9b59a2
	github.com/julsemaan/rest-layer-file v0.0.0-20230518012330-1c28ed9eb6a7
	github.com/patrickmn/go-cache v2.1.0+incompatible
	github.com/rs/cors v1.11.0 // indirect
	github.com/rs/rest-layer v0.2.0
	gopkg.in/alexcesaro/statsd.v2 v2.0.0
)

// Uncomment this to use local directory for utils
// replace github.com/julsemaan/anyfile-notepad/utils => ../utils
