FROM node:16-buster AS build

WORKDIR /src/client

RUN apt-get update -yqq
RUN apt-get install -yqq perl gcc curl make
RUN cpan Template Getopt::Long JSON File::Slurp Tie::IxHash

COPY package.json .
COPY bower.json .

RUN npm install
RUN ./node_modules/.bin/bower install

COPY . .

ENV AFN_BUILD_DIR "/src/client/output"
RUN ./afn-app.sh

