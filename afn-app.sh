#!/bin/bash

_GIT_DIR="$GIT_DIR"

if ! [ -z $_GIT_DIR ]; then
  echo "Using git dir $_GIT_DIR"
else
  _GIT_DIR="."
fi

WEBDEV="$1"
function is_webdev() {
  if [ "$WEBDEV" == "webdev" ]; then
    return 0
  else
    return 1
  fi
}

function emptyfile() {
  truncate -s 0 $1
}

function add_template() {
  add_to_file "$1" "$2" ""
}

function add_js_asset() {
  add_to_file "$1" "$2" ";"
}

function add_css_asset() {
  add_to_file "$1" "$2" ""
}

function add_to_file() {
  to_add="$1"
  add_to="$2"
  separator="$3"
  echo "$separator" >> $add_to
  cat $to_add >> $add_to
  echo "$separator" >> $add_to
}
export -f add_js_asset
export -f add_css_asset
export -f add_template
export -f add_to_file

function add_min_prefix() {
  file=$1
  ext="${file##*.}"
  filename="${file%.*}"
  echo -n "${filename}.min.${ext}"
}
export -f add_min_prefix

RUNNING_DIR=$(pwd)

if ! [ -z $AFN_BUILD_DIR ]; then
  echo "Building app into $AFN_BUILD_DIR"
  COMPILED_APP="$AFN_BUILD_DIR"
else
  COMPILED_APP="$RUNNING_DIR/tmp/app-compiled"
fi

SHOULD_RESET_FILE="$RUNNING_DIR/tmp/should_reset"
WEB_PID_FILE="$RUNNING_DIR/tmp/web.pid"

APP_VERSION_ID=`date | sha1sum -t | awk '{print $1}'`
APP_VERSION=`cd $_GIT_DIR && git tag | tail -1 ; cd -`
APP_COMMIT_ID=`cd $_GIT_DIR && git rev-parse HEAD | cut -c1-6 ; cd -`

APPLICATION_CSS="$COMPILED_APP/assets/application-$APP_VERSION_ID.css"
APPLICATION_JS="$COMPILED_APP/assets/application-$APP_VERSION_ID.js"

function should_reset() {
  #### NOTE - this uses process returns code so 0 means it should reset while 1 means it doesn't so it fits in the logic of a bash if
  if [ -e $SHOULD_RESET_FILE ]; then
    return 0
  else
    return 1
  fi
}

function ace_js() {
  cd bower_components/ace-anyfile-notepad
  if ! find -maxdepth 1 -name 'afn-dist' -type d | egrep '.*' > /dev/null ; then 
    npm install
    make afn-dist
  fi
  cd -
  mkdir $COMPILED_APP/ace.js
  cp -a bower_components/ace-anyfile-notepad/afn-dist/* $COMPILED_APP/ace.js/
}

function pages_css() {
  # pages.css
  echo "Building pages.css"
  
  if should_reset; then
    echo "Resetting pages.css"
    rm -f client/assets/css/libs/bootstrap.min.css.scss
    rm -f $COMPILED_APP/assets/pages-*.css
  fi

  cp bower_components/bootstrap/dist/css/bootstrap.min.css client/assets/css/libs/bootstrap.min.css.scss
  ./node_modules/.bin/node-sass --include-path client/assets/css/ client/assets/css/pages.css.scss >> $COMPILED_APP/assets/pages-$APP_VERSION_ID.css
  
  rm -f client/assets/css/libs/bootstrap.min.css.scss
}

function pages() {
  # Build website
  echo "Building site pages"

  if should_reset; then
    echo "Resetting pages"
    rm -fr $COMPILED_APP/site
    rm -f $COMPILED_APP/index.html
  fi

  mkdir $COMPILED_APP/site

  for page in home faq news help_translate privacy_policy; do
    echo "-Building page $page"

    if [ "$page" == "home" ]; then
      COLUMNS=3
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
    echo "Resetting application.css"
    rm -f $COMPILED_APP/assets/application-*.css
  fi

  add_css_asset bower_components/bootstrap/dist/css/bootstrap.min.css $APPLICATION_CSS
  add_css_asset bower_components/tether-shepherd/dist/css/shepherd-theme-default.css $APPLICATION_CSS
  ./node_modules/.bin/node-sass --include-path client/assets/css/ client/assets/css/editor.css.scss >> $APPLICATION_CSS

  if ! is_webdev; then
    ./node_modules/.bin/minify $APPLICATION_CSS > `add_min_prefix $APPLICATION_CSS`
  else
    cp $APPLICATION_CSS `add_min_prefix $APPLICATION_CSS`
  fi
}

function application_js() {
  # application.js
  echo "Building application.js"

  if should_reset; then
    echo "Resetting application.js"
    rm -f $COMPILED_APP/assets/application-*.js
  fi

  add_js_asset node_modules/dropbox/dist/Dropbox-sdk.min.js $APPLICATION_JS
  add_js_asset bower_components/jquery/dist/jquery.min.js $APPLICATION_JS
  add_js_asset bower_components/jquery-ui/jquery-ui.min.js $APPLICATION_JS
  add_js_asset bower_components/bootstrap/dist/js/bootstrap.min.js $APPLICATION_JS
  add_js_asset bower_components/tether-shepherd/dist/js/tether.js $APPLICATION_JS
  add_js_asset bower_components/tether-shepherd/dist/js/shepherd.min.js $APPLICATION_JS

  add_js_asset client/assets/js/libs/rsvp.min.js $APPLICATION_JS
  add_js_asset client/assets/js/libs/route-recognizer.js $APPLICATION_JS
  add_js_asset client/assets/js/DataBinder.js $APPLICATION_JS
  add_js_asset client/assets/js/Model.js $APPLICATION_JS
  add_js_asset client/assets/js/Model/Preference.js $APPLICATION_JS
  add_js_asset client/assets/js/Model/CloudFile.js $APPLICATION_JS
  add_js_asset client/assets/js/Widget/Preference.js $APPLICATION_JS
  add_js_asset client/assets/js/helpers.js $APPLICATION_JS

  # todo - exclude the files above
  find client/assets/js/ -name '*.js' | while read file; do add_js_asset "$file" $APPLICATION_JS ; done

  if ! is_webdev; then
    ./node_modules/.bin/minify $APPLICATION_JS > `add_min_prefix $APPLICATION_JS`
  else
    cp $APPLICATION_JS `add_min_prefix $APPLICATION_JS`
  fi
}

function editor_part() {
  # editor.part
  echo "Building app.partials"
  
  if should_reset; then
    echo "Resetting app.partials"
    rm -f $COMPILED_APP/app.partials
  fi

  find client/ -name '_*.html' | while read file ; do add_template "$file" $COMPILED_APP/app.partials ; done
}

function app() {
  # Build single page app
  echo "Building app"

  if should_reset; then
    echo "Resetting app"
    rm -f $COMPILED_APP/app.html
  fi

  cp client/editor-layout.tt $COMPILED_APP/editor-layout.tt
  perl client/render.pl --COMPILED_APP_DIR=$COMPILED_APP --APP_VERSION_ID=$APP_VERSION_ID --APP_VERSION=$APP_VERSION --APP_COMMIT_ID=$APP_COMMIT_ID --SYNTAX_DB=$COMPILED_APP/syntaxes.json
}

function public_assets() {
  # Adding public assets
  cp -frp client/public/* $COMPILED_APP/
}

function download_if_necessary() {
  DST="$1"
  URL="$2"
  
  mkdir -p tmp/cache/
  if ! is_webdev || ! [ -f tmp/cache/$DST ]; then
    echo "Fetching $DST"
    curl "$URL" --fail --silent --show-error > tmp/cache/$DST
  fi

  cp tmp/cache/$DST $COMPILED_APP/$DST
}

function json_resources() {
  # Adding JSON resources (from prod for now...)
  download_if_necessary extensions.json https://api.anyfile-notepad.semaan.ca/extensions
  download_if_necessary syntaxes.json https://api.anyfile-notepad.semaan.ca/syntaxes
  download_if_necessary mime_types.json https://api.anyfile-notepad.semaan.ca/mime_types
}

function build_all() {
  mkdir -p $COMPILED_APP
  cd /tmp/
  rm -fr $COMPILED_APP/*
  cd -

  mkdir -p $COMPILED_APP
  mkdir -p $COMPILED_APP/assets

  ace_js
  pages_css
  pages
  application_css
  application_js
  json_resources
  editor_part
  app
  public_assets
}

build_all

if ! is_webdev; then
  exit
fi

function start_server() {
  cd $COMPILED_APP
  python -m SimpleHTTPServer 2>&1 &
  WEB_PID=$!
  echo $WEB_PID > $WEB_PID_FILE
  cd -
}

function watch_dir() {
  DIR=$1
  ACTION=$2
  OPTIONS=$3
  while true; do
    inotifywait $OPTIONS -r -e create,modify,delete $RUNNING_DIR/$DIR
    kill $(cat $WEB_PID_FILE)
    for action in $2; do
      eval $action
    done
    start_server
  done
}

function exit_cleanup() {
  echo "Exiting..."
  kill $(cat $WEB_PID_FILE)
  rm -f $SHOULD_RESET_FILE
}

trap exit_cleanup EXIT
start_server

watch_dir client/ build_all &

echo "1" > $SHOULD_RESET_FILE

while true; do
  sleep 1
done


