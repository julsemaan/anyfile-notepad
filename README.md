# Anyfile Notepad

Anyfile Notepad is a Google Drive compatible app that let's you open any type of files on Google Drive and Dropbox.

This repository hosts the code that powers https://anyfile-notepad.semaan.ca/app and is composed of 4 services:
- First and foremost, the client code which encapsulates the application code
- Second, a webserver that serves the client code and encapsulates the paid subscriptions logic
- Third, an API (api.anyfile-notepad.semaan.ca) to serve the data that backs the application (syntaxes, extensions and mime types configuration)
- Fourth, a simple administrative interface to manage the three resources above (admin.anyfile-notepad.semaan.ca)

## Dev environment setup

NOTE: The instructions were tested on Ubuntu but will work with some adjustments on any machine that has `docker` and `docker-compose`

### Install docker and docker-compose

Install docker using these instructions: https://docs.docker.com/engine/install/ubuntu/

Ensure you then install the docker compose plugin:

```
# apt-get install docker-compose-plugin
```

### Cloning the repo

First, clone the repo and cd into its directory
```
# git clone https://github.com/julsemaan/anyfile-notepad
# cd anyfile-notepad
```

Next, setup the empty vars file (you will be editing these afterwards)

```
# make dev-vars
```

### Setting up Google Drive for the app

Once you get the application displaying properly, you will need to setup at least the Google Drive API (Dropbox is optional). 

In order to do so, follow *Step 1* from the following documentation https://developers.google.com/drive/v3/web/quickstart/js#step_1_turn_on_the_api_name

Here are some tips on how to configure it:
 * You will be calling the API using a *Web application / Javascript*
 * You will require access to the user data
 * The authorized javascript origin should be `http://localhost:8000` if using the local dev server that is included with the app build script.
 * The authorized URI should be `http://localhost:8000/api/oauth2/google/callback` if using the local dev server that is included with the app build script.

Once your application and credentials are created, you will need to get the *Client ID* from the credentials you created as well as the *Drive App ID*. So, if your *Credentials Client ID* is `362162162007-o0uhasgsdlte2s2or9cr265bg2bhvth1.apps.googleusercontent.com`, your *Drive App ID* will be `362162162007` (the first part of the ID prior to the `-`).

Then, open `client/assets/js/VARS.js` and configure it with your Google Drive infos:

```
window.AFN_VARS = {
  <...>
  google_client_id:"362162162007-o0uhasgsdlte2s2or9cr265bg2bhvth1.apps.googleusercontent.com",
  drive_app_id:"362162162007",
  <...>
};
```

Next, open `docker4dev/.env` and add the following to it:

```
GOOGLE_CLIENT_ID=<your oauth2 client id>
GOOGLE_CLIENT_SECRET=<your oauth2 client secret>
```

### Creating the Google API key for the file picker

## Setting up Stripe

## Setting up email notifications

# Licence

GPL
