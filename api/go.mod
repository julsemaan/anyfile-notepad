module github.com/julsemaan/anyfile-notepad/api

go 1.26

require (
	github.com/julsemaan/anyfile-notepad/utils v0.0.0-20230202010526-481b7f9b59a2
	github.com/julsemaan/rest-layer-file v0.0.0-20230518012330-1c28ed9eb6a7
	github.com/patrickmn/go-cache v2.1.0+incompatible
	github.com/rs/rest-layer v0.0.0-20160505213648-cb84bc79b5b8
	gopkg.in/alexcesaro/statsd.v2 v2.0.0
)

require (
	github.com/rs/cors v1.9.0 // indirect
	github.com/rs/xid v1.5.0 // indirect
	github.com/stretchr/testify v1.8.2 // indirect
	golang.org/x/crypto v0.0.0-20210921155107-089bfa567519 // indirect
	golang.org/x/net v0.10.0 // indirect
)

// Uncomment this to use local directory for utils
// replace github.com/julsemaan/anyfile-notepad/utils => ../utils
