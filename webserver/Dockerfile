FROM golang:1.16-bullseye AS build

WORKDIR /src/webserver

COPY go.mod .
COPY go.sum .
RUN go mod download

COPY . .
RUN go build -o /out/webserver

FROM debian:bullseye as bin

RUN apt update && apt install ca-certificates -yqq

COPY --from=build /out/webserver /

ENTRYPOINT /webserver
