module github.com/julsemaan/anyfile-notepad/webserver

go 1.12

require (
	github.com/cevaris/ordered_map v0.0.0-20190319150403-3adeae072e73 // indirect
	github.com/davecgh/go-spew v1.1.1
	github.com/gin-gonic/gin v1.7.7
	github.com/inverse-inc/packetfence v0.0.0-20190923130955-9b9996e89548
	github.com/jcuga/golongpoll v1.1.1-0.20180711123949-939e3befd837
	github.com/julsemaan/anyfile-notepad/utils v0.0.0-20220108003425-10f9a11f94a4
	github.com/nu7hatch/gouuid v0.0.0-20131221200532-179d4d0c4d8d // indirect
	github.com/stretchr/testify v1.7.0 // indirect
	github.com/stripe/stripe-go v28.6.1+incompatible
	golang.org/x/sys v0.0.0-20210420072515-93ed5bcd2bfe // indirect
	gopkg.in/check.v1 v1.0.0-20201130134442-10cb98267c6c // indirect
)

// Uncomment this to use local directory for utils
// replace github.com/julsemaan/anyfile-notepad/utils => ../utils
