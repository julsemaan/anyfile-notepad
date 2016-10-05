# Anyfile Notepad

## This readme is a first draft and is far from complete.

Anyfile Notepad is a Google Drive compatible app that let's you open any type of files on Google Drive and Dropbox.

This repository hosts the code that powers https://anyfile-notepad.semaan.ca/app and is composed of 3 services:
- First and foremost, the client code which encapsulates the application code
- Second, an API (api.anyfile-notepad.semaan.ca) to serve the data that backs the application (syntaxes, extensions and mime types configuration)
- Third, a simple administrative interface to manage the three resources above (admin.anyfile-notepad.semaan.ca)

## Building the client side app

> NOTE: These instructions are made for Linux and were tested on Debian 8

### Templating setup

First, install `perl`, `cpan`, `gcc`, `curl` and `make` from your distribution repository. Then install these packages from CPAN:

```
# apt-get install perl gcc make
# cpan Template
# cpan Getopt::Long
# cpan JSON
# cpan File::Slurp
# cpan Tie::IxHash
```

### CSS (SASS) compilation setup

Next, you need to have `sass` installed, so grab a version of `ruby` and `gem` and install `sass`:
```
# apt-get install ruby
# gem install sass
```

### Assets package manager setup

Next, install `npm` and `bower`.

```
# apt-get install npm
# ln -s /usr/bin/nodejs /usr/bin/node
# npm install -g
```

### Setting up the app dependencies

Then, clone the repo, and launch the install of the assets of the app.

```
# git clone https://github.com/julsemaan/anyfile-notepad.git
# cd anyfile-notepad
# bower install
```

### Basic configuration and initial launch

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

### Using the integrated development server

Should you want to serve files using the build script, you will need to have python 2+ and `inotifywait` installed. You will then be able to use the following command to serve the files locally and rebuild the app on changes in the `client/` directory.

```
# apt-get install python inotify-tools
# ./afn-app.sh webdev
```

The application will then be available through `http://localhost:8000`.

### Setting up Google Drive for the app

Once you get the application displaying properly, you will need to setup at least the Google Drive API (Dropbox is optional). 

In order to do so, follow *Step 1* from the following documentation https://developers.google.com/drive/v3/web/quickstart/js#step_1_turn_on_the_api_name

Here are some tips on how to configure it:
 * You will be calling the API using a *Web application / Javascript*
 * You will require access to the user data
 * The authorized javascript origin should be `http://localhost:8000` if using the local dev server that is included with the app build script.
 * The authorized URI should be `http://localhost:8000/app.html` if using the local dev server that is included with the app build script.

Once your application and credentials are created, you will need to get the *Client ID* from the credentials you created as well as the *Drive App ID*. So, if your *Credentials Client ID* is `362162162007-o0uhasgsdlte2s2or9cr265bg2bhvth1.apps.googleusercontent.com`, your *Drive App ID* will be `362162162007` (the first part of the ID prior to the `-`).

Then, open `client/assets/js/VARS.js` and configure it with your Google Drive infos:

```
window.AFN_VARS = {
  api_uri:"",
  google_client_id:"362162162007-o0uhasgsdlte2s2or9cr265bg2bhvth1.apps.googleusercontent.com",
  drive_app_id:"362162162007",
  dropbox_key:"dummy",
};
```

> WARNING: Unless you have the intention of setting up Dropbox, make sure you put a dummy key in the VARS.js file. Otherwise, the app won't boot since this parameter will be missing.

Once you've setup the Drive integration, rebuild the application using `afn-app.sh`.

Should any issue arise in the app boot, make sure to look at the Javascript console for any error.

If you were brave enough to reach the end of the setup and are having issues setting it up, feel free to reach out on the [Google community](http://bit.ly/afn-community).

## Issues

Report any issues using the [Google community](http://bit.ly/afn-community)

# Licence

GPL
