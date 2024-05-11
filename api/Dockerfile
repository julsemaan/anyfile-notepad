FROM golang:1.16-bullseye AS build

WORKDIR /src/api

COPY go.mod .
COPY go.sum .
RUN go mod download

COPY . .
RUN --mount=type=cache,target=/root/.cache/go-build make

FROM alpine:3 as bin

COPY --from=build /src/api/api /

ENTRYPOINT /api

