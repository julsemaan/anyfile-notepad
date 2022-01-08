FROM docker.pkg.github.com/julsemaan/anyfile-notepad/client-base:latest AS full

FROM alpine as light

COPY --from=build /src/client/output /src/client/output

