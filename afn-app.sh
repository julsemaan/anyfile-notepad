#!/bin/bash

function emptyfile() {
  truncate -s 0 $1
}

COMPILED_APP="tmp/app-compiled"

rm -fr $COMPILED_APP/*

mkdir -p $COMPILED_APP
mkdir -p $COMPILED_APP/assets

# application.css
echo "Building application.css"
cat bower_components/bootstrap/dist/css/bootstrap.min.css >> $COMPILED_APP/assets/application.css
sass -I app/assets/stylesheets/ app/assets/stylesheets/editor.css.scss >> $COMPILED_APP/assets/application.css

# application.js
echo "Building application.js"
cat bower_components/bootstrap/dist/js/bootstrap.min.js >> $COMPILED_APP/assets/application.js
cat bower_components/jquery/dist/jquery.min.js >> $COMPILED_APP/assets/application.js

cat app/assets/javascripts/libs/rsvp.min.js >> $COMPILED_APP/assets/application.js
cat app/assets/javascripts/libs/route-recognizer.js >> $COMPILED_APP/assets/application.js
cat app/assets/javascripts/DataBinder.js >> $COMPILED_APP/assets/application.js
cat app/assets/javascripts/Model.js >> $COMPILED_APP/assets/application.js
cat app/assets/javascripts/Model/Preference.js >> $COMPILED_APP/assets/application.js
# todo - rename application.js to something else
cat app/assets/javascripts/application.js >> $COMPILED_APP/assets/application.js

find app/assets/javascripts/ -name '*.js' -exec cat {} >> $COMPILED_APP/assets/application.js \;

# editor.part
echo "Building editor.part"
find app/views/editor/ -name '_*.html.erb' -exec cat {} >> $COMPILED_APP/editor.part \;
find app/views/editor/ ! -name '_*.html.erb' -name '*.html.erb' -exec cat {} >> $COMPILED_APP/editor.part \;

# Build single page app
echo "Building app"
cp app/views/layouts/editor-layout.tt $COMPILED_APP/editor-layout.tt
perl -MTemplate -e "\$tt = Template->new({INCLUDE_PATH => '$COMPILED_APP'}) ; \$tt->process('editor-layout.tt', {}, '$COMPILED_APP/app.html') || die \$tt->error()"

