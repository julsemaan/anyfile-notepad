#!/bin/bash

function emptyfile() {
  truncate -s 0 $1
}

function add_asset() {
  to_add="$1"
  add_to="$2"
  echo "" >> $add_to
  cat $to_add >> $add_to
  echo "" >> $add_to
}
export -f add_asset

COMPILED_APP="tmp/app-compiled"

rm -fr $COMPILED_APP/*

mkdir -p $COMPILED_APP
mkdir -p $COMPILED_APP/assets

APP_VERSION_ID=`date | sha1sum -t | awk '{print $1}'`
APP_VERSION=`git tag | tail -1`
APP_COMMIT_ID=`git rev-parse HEAD | cut -c1-6`

APPLICATION_CSS="$COMPILED_APP/assets/application-$APP_VERSION_ID.css"
APPLICATION_JS="$COMPILED_APP/assets/application-$APP_VERSION_ID.js"

# pages.css
echo "Building pages.css"
cp bower_components/bootstrap/dist/css/bootstrap.min.css client/assets/css/libs/bootstrap.min.css.scss
sass -I client/assets/css/ client/assets/css/pages.css.scss >> $COMPILED_APP/assets/pages-$APP_VERSION_ID.css

# Build website
echo "Building site pages"

mkdir $COMPILED_APP/site

for page in home faq help_translate; do
  echo "-Building page $page"

  if [ "$page" == "home" ]; then
    COLUMNS=2
  else
    COLUMNS=1
  fi

  perl -MTemplate -e "\$tt = Template->new({INCLUDE_PATH => ['$COMPILED_APP', 'client/']}) ; \$tt->process('site/layout.tt', {APP_VERSION_ID => '$APP_VERSION_ID', APP_VERSION => '$APP_VERSION', APP_COMMIT_ID => '$APP_COMMIT_ID', PAGE_KEY => '$page', COLUMNS => $COLUMNS}, '$COMPILED_APP/site/$page.html') || die \$tt->error()"
done 

cp $COMPILED_APP/site/home.html $COMPILED_APP/index.html

# application.css
echo "Building application.css"
add_asset bower_components/bootstrap/dist/css/bootstrap.min.css $APPLICATION_CSS
sass -I client/assets/css/ client/assets/css/editor.css.scss >> $APPLICATION_CSS

# application.js
echo "Building application.js"
add_asset bower_components/jquery/dist/jquery.min.js $APPLICATION_JS
add_asset bower_components/jquery-ui/jquery-ui.min.js $APPLICATION_JS
add_asset bower_components/bootstrap/dist/js/bootstrap.min.js $APPLICATION_JS

add_asset client/assets/js/libs/rsvp.min.js $APPLICATION_JS
add_asset client/assets/js/libs/route-recognizer.js $APPLICATION_JS
add_asset client/assets/js/DataBinder.js $APPLICATION_JS
add_asset client/assets/js/Model.js $APPLICATION_JS
add_asset client/assets/js/Model/Preference.js $APPLICATION_JS
add_asset client/assets/js/Model/CloudFile.js $APPLICATION_JS
add_asset client/assets/js/helpers.js $APPLICATION_JS

# todo - exclude the files above
find client/assets/js/ -name '*.js' | while read file; do add_asset "$file" $APPLICATION_JS ; done

# editor.part
echo "Building app.partials"
find client/ -name '_*.html' | while read file ; do add_asset "$file" $COMPILED_APP/app.partials ; done

# Build single page app
echo "Building app"
cp client/editor-layout.tt $COMPILED_APP/editor-layout.tt
perl -MTemplate -e "\$tt = Template->new({INCLUDE_PATH => ['$COMPILED_APP', 'client/']}) ; \$tt->process('editor-layout.tt', {APP_VERSION_ID => '$APP_VERSION_ID', APP_VERSION => '$APP_VERSION', APP_COMMIT_ID => '$APP_COMMIT_ID'}, '$COMPILED_APP/app.html') || die \$tt->error()"

# Adding public assets
cp -frp client/public/* $COMPILED_APP/

# Adding JSON resources (from prod for now...)
echo "Fetching extensions.json"
curl https://anyfile-notepad.semaan.ca/extensions.json --fail --silent --show-error > $COMPILED_APP/extensions.json
echo "Fetching syntaxes.json"
curl https://anyfile-notepad.semaan.ca/syntaxes.json --fail --silent --show-error > $COMPILED_APP/syntaxes.json
echo "Fetching mime_types.json"
curl https://anyfile-notepad.semaan.ca/mime_types.json --fail --silent --show-error > $COMPILED_APP/mime_types.json
