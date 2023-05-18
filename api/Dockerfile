FROM golang:1.16-bullseye AS build

WORKDIR /src/api

COPY go.mod .
COPY go.sum .
RUN go mod download

COPY . .
RUN go build -o /out/api

FROM debian:bullseye as bin

RUN apt update && apt install ca-certificates -yqq

COPY --from=build /out/api /

ENTRYPOINT /api

