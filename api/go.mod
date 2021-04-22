module github.com/julsemaan/anyfile-notepad/api

go 1.12

require (
	github.com/davecgh/go-spew v1.1.1
	github.com/julsemaan/anyfile-notepad/utils v0.0.0
	github.com/julsemaan/rest-layer-file v0.0.0-20160721013623-3fd936157a3b
	github.com/rs/cors v1.7.0 // indirect
	github.com/rs/rest-layer v0.2.0
	github.com/stretchr/testify v1.7.0 // indirect
	golang.org/x/net v0.0.0-20171102191033-01c190206fbd // indirect
	gopkg.in/alexcesaro/statsd.v2 v2.0.0
)

replace github.com/julsemaan/anyfile-notepad/utils => ../utils
