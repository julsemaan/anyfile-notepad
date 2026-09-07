FROM golang:1.26.7-bookworm AS build

WORKDIR /src/api

COPY go.mod .
COPY go.sum .
RUN go mod download

COPY . .
RUN --mount=type=cache,target=/root/.cache/go-build make

FROM build AS dev

RUN apt-get update \
    && apt-get install -y --no-install-recommends inotify-tools \
    && rm -rf /var/lib/apt/lists/*

FROM alpine:3 as bin

COPY --from=build /src/api/api /

ENTRYPOINT /api
