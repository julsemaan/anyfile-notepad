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

SHOULD_RESET_FILE="tmp/should_reset"
WEB_PID_FILE="tmp/web.pid"

APP_VERSION_ID=`date | sha1sum -t | awk '{print $1}'`
APP_VERSION=`git tag | tail -1`
APP_COMMIT_ID=`git rev-parse HEAD | cut -c1-6`

APPLICATION_CSS="$COMPILED_APP/assets/application-$APP_VERSION_ID.css"
APPLICATION_JS="$COMPILED_APP/assets/application-$APP_VERSION_ID.js"

function should_reset() {
  if [ -e $SHOULD_RESET_FILE ]; then
    return `cat tmp/should_reset`
  else
    return 0
  fi
}

function pages_css() {
  # pages.css
  echo "Building pages.css"
  
  if should_reset; then
    rm -f client/assets/css/libs/bootstrap.min.css.scss
    rm -f $COMPILED_APP/assets/pages-*.css
  fi

  cp bower_components/bootstrap/dist/css/bootstrap.min.css client/assets/css/libs/bootstrap.min.css.scss
  #sass -I client/assets/css/ client/assets/css/pages.css.scss >> $COMPILED_APP/assets/pages-$APP_VERSION_ID.css
}

function pages() {
  # Build website
  echo "Building site pages"

  if should_reset; then
    rm -fr $COMPILED_APP/site
    rm -f $COMPILED_APP/index.html
  fi

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
}

function application_css() {
  # application.css
  echo "Building application.css"

  if should_reset; then
    rm -f $COMPILED_APP/assets/application-*.css
  fi

  add_asset bower_components/bootstrap/dist/css/bootstrap.min.css $APPLICATION_CSS
  #sass -I client/assets/css/ client/assets/css/editor.css.scss >> $APPLICATION_CSS
}

function application_js() {
  # application.js
  echo "Building application.js"

  if should_reset; then
    rm -f $COMPILED_APP/assets/application-*.js
  fi

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
}

function editor_part() {
  # editor.part
  echo "Building app.partials"
  
  if should_reset; then
    rm -f $COMPILED_APP/app.partials
  fi

  find client/ -name '_*.html' | while read file ; do add_asset "$file" $COMPILED_APP/app.partials ; done
}

function app() {
  # Build single page app
  echo "Building app"

  if should_reset; then
    rm -f $COMPILED_APP/app.html
  fi

  cp client/editor-layout.tt $COMPILED_APP/editor-layout.tt
  perl client/render.pl --COMPILED_APP_DIR=$COMPILED_APP --APP_VERSION_ID=$APP_VERSION_ID --APP_VERSION=$APP_VERSION --APP_COMMIT_ID=$APP_COMMIT_ID
}

function public_assets() {
  # Adding public assets
  cp -frp client/public/* $COMPILED_APP/
}

function json_resources() {
  # Adding JSON resources (from prod for now...)
  echo "Fetching extensions.json"
  curl https://anyfile-notepad.semaan.ca/extensions.json --fail --silent --show-error > $COMPILED_APP/extensions.json
  echo "Fetching syntaxes.json"
  curl https://anyfile-notepad.semaan.ca/syntaxes.json --fail --silent --show-error > $COMPILED_APP/syntaxes.json
  echo "Fetching mime_types.json"
  curl https://anyfile-notepad.semaan.ca/mime_types.json --fail --silent --show-error > $COMPILED_APP/mime_types.json
}

pages_css
pages
application_css
application_js
editor_part
app
public_assets
json_resources

if ! [ "$1" == "webdev" ]; then
  exit
fi

function start_server() {
  python -m SimpleHTTPServer 2>&1 &
  WEB_PID=$!
  echo $WEB_PID > $WEB_PID_FILE
}

function watch_dir() {
  DIR=$1
  ACTION=$2
  OPTIONS=$3
  while true; do
    inotifywait $OPTIONS -r -e create,modify,delete $DIR
    kill $(cat $WEB_PID_FILE)
    for action in $2; do
      eval $action
    done
    start_server
  done
}

function exit_cleanup() {
  echo "Exiting..."
  kill `cat tmp/web.pid`
  rm $SHOULD_RESET_FILE
}

start_server
trap exit_cleanup EXIT

watch_dir client/assets/css "pages_css application_css" &
watch_dir client/assets/js "application_js" &
watch_dir client/ "editor_part app" "--exclude client/assets/css --exclude client/assets/js" &

echo "1" > $SHOULD_RESET_FILE

while true; do
  sleep 1
done


