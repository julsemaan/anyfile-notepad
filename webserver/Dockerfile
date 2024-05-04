FROM golang:1.22-bullseye AS build

WORKDIR /src/webserver

COPY go.mod .
COPY go.sum .
RUN go mod download

COPY . .
RUN --mount=type=cache,target=/root/.cache/go-build go build -v -o /out/webserver

FROM debian:bullseye as bin

RUN apt update && apt install ca-certificates -yqq

COPY --from=build /out/webserver /

ENTRYPOINT /webserver
