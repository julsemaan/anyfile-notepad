FROM node:24.20.0-bookworm@sha256:be23f54a88d34e8824c741b19b91064094f92c1c97b194144bfc8b50d67258e2

RUN npm install --global npm@11.19.0

RUN apt-get update -yqq
RUN apt-get install -yqq perl gcc curl make inotify-tools
RUN cpan Template Getopt::Long JSON File::Slurp Tie::IxHash


