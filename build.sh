#!/bin/bash

function sed_hrefs {
  echo $1
  echo $2
  while read -r -d $'\0'; do
    to_replace=$(echo "$1" | cut -c 3-)
    replace_by=$(echo "$2" | cut -c 3-)
    mv $REPLY $REPLY'.old'
    sed -e "s@href=[\"]$to_replace[\"]@href=\"$replace_by\"@g" $REPLY'.old' > $REPLY
    rm -f $REPLY'.old'
  done < <(find . -type f -name "*.html" -print0)
}

ROOT=$(pwd)
BUILDDIR=$(pwd)"/build"

PROTO=http
HOST=localhost:3001
APP=$PROTO://$HOST

APP_DOWNLOAD_DIR=$BUILDDIR"/"$HOST

echo $ROOT
echo $APP_DOWNLOAD_DIR

mkdir -p $BUILDDIR
cd build

# Download the app and website around it
wget -mk $APP/app

cd $HOST

# We rename files without extension to html and fix the links
while read -r -d $'\0'; do
  mv $REPLY $REPLY'.html'

  # No need to do it for /app
  if [ "$REPLY" != "./app" ]; then
    sed_hrefs $REPLY $REPLY'.html'
  fi
done < <(find . -type f ! -name "*.*" -print0)

# Download the necessary resources from the API
wget $APP/mime_types.json
wget $APP/extensions.json
wget $APP/syntaxes.json

# Download other resources
wget $APP/favicon.ico
wget $APP/logo.png
wget $APP/Dropbox.png
wget $APP/GoogleDrive.png

# Google webmaster checkup
wget $APP/googlef0ce5fbdc9b3a89f.html

# Delete the admin section as it's useless
rm -fr admin

cd $ROOT

# Get ace.js and the fonts
cp -fr $ROOT/public/ace.js $APP_DOWNLOAD_DIR
cp -fr $ROOT/public/fonts $APP_DOWNLOAD_DIR

# copy to dist
cp -fr $APP_DOWNLOAD_DIR $ROOT/dist

tar cvf afn.tgz dist/

