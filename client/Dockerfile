FROM ghcr.io/julsemaan/anyfile-notepad/client-base:latest

WORKDIR /src/client

COPY package.json .
COPY bower.json .

RUN npm install
RUN ./node_modules/.bin/bower install

# Keep a copy of the dependencies
RUN cp -a node_modules/ /src/
RUN cp -a bower_components/ /src/

COPY . .

ARG AFN_BUILD_ID
ENV APP_COMMIT_ID $AFN_BUILD_ID

ENV AFN_BUILD_DIR "/src/client/output"
RUN ./afn-app.sh

ENTRYPOINT /src/client/afn-app.sh webdev

