module github.com/julsemaan/anyfile-notepad/api

go 1.12

require (
	github.com/davecgh/go-spew v1.1.1 // indirect
	github.com/julsemaan/anyfile-notepad/utils v0.0.0
	github.com/julsemaan/rest-layer-file v0.0.0-20160721013623-3fd936157a3b
	github.com/patrickmn/go-cache v2.1.0+incompatible // indirect
	github.com/rs/rest-layer v0.0.0-20160924170201-5f71d116613a
	github.com/rs/xid v0.0.0-20160315140658-057f3c928c20
	golang.org/x/crypto v0.0.0-20171106163040-687d4b818545
	golang.org/x/net v0.0.0-20171102191033-01c190206fbd
	gopkg.in/alexcesaro/statsd.v2 v2.0.0
)

replace github.com/julsemaan/anyfile-notepad/utils => ../utils
