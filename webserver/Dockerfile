FROM golang:1.16-alpine AS build

WORKDIR /src/webserver

COPY go.mod .
COPY go.sum .
RUN go mod download

COPY . .
RUN go build -o /out/webserver

FROM alpine as bin

COPY --from=build /out/webserver /

ENTRYPOINT /webserver
