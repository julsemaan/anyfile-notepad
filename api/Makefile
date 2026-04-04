
.PHONY: api
api:
	@if [ -d ./cmd/api ]; then \
		CGO_ENABLED=0 go build -v -o api ./cmd/api; \
	elif [ -d ./api/cmd/api ]; then \
		CGO_ENABLED=0 go build -v -o api ./api/cmd/api; \
	else \
		echo "cannot find api main package (expected ./cmd/api or ./api/cmd/api)"; \
		exit 1; \
	fi
