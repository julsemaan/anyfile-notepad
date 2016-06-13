#!/bin/bash

function emptyfile() {
  truncate -s 0 $1
}

COMPILED_APP="tmp/app-compiled"

rm -fr $COMPILED_APP/*

mkdir -p $COMPILED_APP
mkdir -p $COMPILED_APP/assets

APP_VERSION_ID=`date | sha1sum -t | awk '{print $1}'`

APPLICATION_CSS="$COMPILED_APP/assets/application-$APP_VERSION_ID.css"
APPLICATION_JS="$COMPILED_APP/assets/application-$APP_VERSION_ID.js"

# application.css
echo "Building application.css"
cat bower_components/bootstrap/dist/css/bootstrap.min.css >> $APPLICATION_CSS
sass -I app/assets/stylesheets/ app/assets/stylesheets/editor.css.scss >> $APPLICATION_CSS

# application.js
echo "Building application.js"
cat bower_components/bootstrap/dist/js/bootstrap.min.js >> $APPLICATION_JS
cat bower_components/jquery/dist/jquery.min.js >> $APPLICATION_JS

cat app/assets/javascripts/libs/rsvp.min.js >> $APPLICATION_JS
cat app/assets/javascripts/libs/route-recognizer.js >> $APPLICATION_JS
cat app/assets/javascripts/DataBinder.js >> $APPLICATION_JS
cat app/assets/javascripts/Model.js >> $APPLICATION_JS
cat app/assets/javascripts/Model/Preference.js >> $APPLICATION_JS
# todo - rename application.js to something else
cat app/assets/javascripts/application.js >> $APPLICATION_JS

# todo - exclude the files above
find app/assets/javascripts/ -name '*.js' -exec cat {} >> $APPLICATION_JS \;

# editor.part
echo "Building editor.part"
find client/app/ -name '_*.html.erb' -exec cat {} >> $COMPILED_APP/editor.part \;
find client/app/ ! -name '_*.html.erb' -name '*.html.erb' -exec cat {} >> $COMPILED_APP/editor.part \;

# Build single page app
echo "Building app"
cp client/editor-layout.tt $COMPILED_APP/editor-layout.tt
perl -MTemplate -e "\$tt = Template->new({INCLUDE_PATH => ['$COMPILED_APP', 'client/']}) ; \$tt->process('editor-layout.tt', {APP_VERSION_ID => '$APP_VERSION_ID'}, '$COMPILED_APP/app.html') || die \$tt->error()"

