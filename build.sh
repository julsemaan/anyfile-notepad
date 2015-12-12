#!/bin/bash

rm -fr build
rm -fr dist
mkdir -p build
cd build

PROTO=http
HOST=localhost:3000
APP=$PROTO://$HOST
BRANCH=master

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

rm -fr $HOST

# Get repo for future usage
#git clone ssh://git@bitbucket.org/julsemaan/anyfile-notepad.git
#cd anyfile-notepad
#git checkout $BRANCH
#cd ..

# Download the app and website around it
wget -mk $APP/app

cd $HOST

# We rename files without extension to html and fix the links
while read -r -d $'\0'; do
  mv $REPLY $REPLY'.html'
  sed_hrefs $REPLY $REPLY'.html'
done < <(find . -type f ! -name "*.*" -print0)

# Download the necessary resources from the API
wget $APP/mime_types.json
wget $APP/extensions.json
wget $APP/syntaxes.json

# Download other resources
wget $APP/favicon.ico

# Google webmaster checkup
wget $APP/googlef0ce5fbdc9b3a89f.html

# Delete the admin section as it's useless
rm -fr admin

# Get ace.js and the fonts
cp -fr ../../public/ace.js .
cp -fr ../../public/fonts .

# copy to dist
cd ..
cp -fr $HOST ../dist

cd ..
rm -fr app/static/*
cp -fr dist/* app/static/

tar cvf afn.tgz dist/
