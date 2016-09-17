# Anyfile Notepad

## This readme is a first draft and is far from complete.

Anyfile Notepad is a Google Drive compatible app that let's you open any type of files on Google Drive and Dropbox.

This repository hosts the code that powers https://anyfile-notepad.semaan.ca/app and is composed of 3 services:
- First and foremost, the client code which encapsulates the application code
- Second, an API (api.anyfile-notepad.semaan.ca) to serve the data that backs the application (syntaxes, extensions and mime types configuration)
- Third, a simple administrative interface to manage the three resources above (admin.anyfile-notepad.semaan.ca)

## Building the app

> NOTE: These instructions are made for Linux and were tested on Debian 8

First, install `perl`, `cpan`, `gcc`, `curl` and `make` from your distribution repository. Then install these packages from CPAN:

```
# apt-get install perl gcc make
# cpan Template
# cpan Getopt::Long
# cpan JSON
# cpan File::Slurp
# cpan Tie::IxHash
```

Next, you need to have `sass` installed, so grab a version of `ruby` and `gem` and install `sass`:
```
# apt-get install ruby
# gem install sass
```

Next, install `npm` and `bower`.

```
# apt-get install npm
# ln -s /usr/bin/nodejs /usr/bin/node
# npm install -g bower
```

Then, clone the repo, and launch the install of the assets of the app.

```
# git clone https://github.com/julsemaan/anyfile-notepad.git
# cd anyfile-notepad
# bower install
```

After that, you need to setup the variables that are proper to your setup via `client/assets/js/VARS.js.example` (for now, the defaults should do it).

```
# cp client/assets/js/VARS.js.example client/assets/js/VARS.js
```

Then, launch the build script and ensure no error or warning shows.

```
# ./afn-app.sh 
Press Enter to execute rm -fr /root/anyfile-notepad/tmp/app-compiled/*

Building pages.css
Building site pages
-Building page home
-Building page faq
-Building page news
-Building page help_translate
Building application.css
Building application.js
Fetching extensions.json
Fetching syntaxes.json
Fetching mime_types.json
Building app.partials
Building app
```

The app will then be compiled into static pages and assets that can be served using any basic hosting service. These files will be in `tmp/app-compiled/`

Should you want to serve files using the build script, you will need to have python 2+ and `inotifywait` installed. You will then be able to use the following command to serve the files locally and rebuild the app on changes in the `client/` directory.

```
# apt-get install python inotify-tools
# ./afn-app.sh webdev
```

## Issues

Report any issues using the [Google community](http://bit.ly/afn-community)

# Licence

GPL
