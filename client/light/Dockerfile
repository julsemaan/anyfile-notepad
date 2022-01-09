FROM ghcr.io/julsemaan/anyfile-notepad/client-full:latest AS full

FROM alpine as light

COPY --from=full /src/client/output /src/client/output

