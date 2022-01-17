ARG SRC_IMAGE

FROM $SRC_IMAGE AS full

FROM alpine as light

COPY --from=full /src/client/output /src/client/output

