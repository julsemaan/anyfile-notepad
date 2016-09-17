# Anyfile Notepad

## This readme is a first draft and is far from complete.

Anyfile Notepad is a Google Drive compatible app that let's you open any type of files on Google Drive and Dropbox.

This repository hosts the code that powers https://anyfile-notepad.semaan.ca/app and is composed of 3 services:
- First and foremost, the client code which encapsulates the application code
- Second, an API (api.anyfile-notepad.semaan.ca) to serve the data that backs the application (syntaxes, extensions and mime types configuration)
- Third, a simple administrative interface to manage the three resources above (admin.anyfile-notepad.semaan.ca)

## Building the app

> NOTE: These instructions are made for Linux and were tested on Debian 8

First, install `perl`, `cpan`, `gcc` and `make` from your distribution repository. Then install these packages from CPAN:

```
# cpan Template
# cpan Getopt::Long
# cpan JSON
# cpan File::Slurp
# cpan Tie::IxHash
```

Next, you need to have `sass` installed, so grab a version of `ruby` and `gem` and install `sass`:

`# gem install sass`

Should you want to serve files using the build script, you will need to have python 2+ installed.

Next, clone the repo and launch the build script to build the app.

```
# git clone https://github.com/julsemaan/anyfile-notepad.git
# cd anyfile-notepad
# ./afn-app.sh
```

## Issues

Report any issues using the [Google community](http://bit.ly/afn-community)

# Licence

GPL
