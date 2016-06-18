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

APPLICATION_CSS="$COMPILED_APP/assets/application-$APP_VERSION_ID.css"
APPLICATION_JS="$COMPILED_APP/assets/application-$APP_VERSION_ID.js"

# application.css
echo "Building application.css"
add_asset bower_components/bootstrap/dist/css/bootstrap.min.css $APPLICATION_CSS
sass -I app/assets/stylesheets/ app/assets/stylesheets/editor.css.scss >> $APPLICATION_CSS

# application.js
echo "Building application.js"
add_asset bower_components/jquery/dist/jquery.min.js $APPLICATION_JS
add_asset bower_components/bootstrap/dist/js/bootstrap.min.js $APPLICATION_JS

add_asset app/assets/javascripts/libs/rsvp.min.js $APPLICATION_JS
add_asset app/assets/javascripts/libs/route-recognizer.js $APPLICATION_JS
add_asset app/assets/javascripts/DataBinder.js $APPLICATION_JS
add_asset app/assets/javascripts/Model.js $APPLICATION_JS
add_asset app/assets/javascripts/Model/Preference.js $APPLICATION_JS
add_asset app/assets/javascripts/Model/CloudFile.js $APPLICATION_JS
# todo - rename application.js to something else
add_asset app/assets/javascripts/application.js $APPLICATION_JS

# todo - exclude the files above
find app/assets/javascripts/ -name '*.js' | while read file; do add_asset "$file" $APPLICATION_JS ; done

# editor.part
echo "Building editor.part"
find client/app/ -name '_*.html' -exec cat {} >> $COMPILED_APP/editor.part \;

# Build single page app
echo "Building app"
cp client/editor-layout.tt $COMPILED_APP/editor-layout.tt
perl -MTemplate -e "\$tt = Template->new({INCLUDE_PATH => ['$COMPILED_APP', 'client/']}) ; \$tt->process('editor-layout.tt', {APP_VERSION_ID => '$APP_VERSION_ID'}, '$COMPILED_APP/app.html') || die \$tt->error()"

# Adding public assets
cp -frp public/* $COMPILED_APP/

# Adding JSON resources
cp dist/extensions.json $COMPILED_APP/
cp dist/syntaxes.json $COMPILED_APP/
cp dist/mime_types.json $COMPILED_APP/
