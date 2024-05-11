FROM golang:1.22-bullseye AS build

WORKDIR /src/webserver

COPY go.mod .
COPY go.sum .
RUN go mod download

COPY . .
RUN --mount=type=cache,target=/root/.cache/go-build make

FROM alpine:3 as bin

COPY --from=build /src/webserver/webserver /

ENTRYPOINT /webserver
