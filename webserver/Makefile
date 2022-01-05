
ghcr.io/julsemaan/anyfile-notepad/client/builder:
	docker run -v `pwd`/../docker4dev/config.json:/kaniko/.docker/config.json:ro -v `pwd`:/workspace gcr.io/kaniko-project/executor:latest --cache=true --dockerfile Dockerfile --destination "ghcr.io/julsemaan/anyfile-notepad/webserver:latest" --context dir:///workspace/

.PHONY: webserver
webserver:
	go build
