FROM docker.pkg.github.com/julsemaan/anyfile-notepad/client-base:latest AS full

FROM alpine as light

COPY --from=full /src/client/output /src/client/output

