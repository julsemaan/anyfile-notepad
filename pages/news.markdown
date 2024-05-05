# Realtime collaboration is staying with a new in-house implementation

## TLDR (Too long don't read)

After Google has announced the end of the Google Drive realtime API, we were pretty sure we would have to remove support for realtime collaboration. Thanks to the new revenue streams (ads and subscriptions), we were able to replace this with an in-house implementation and offer it to all users free of charge.

<!--- end panel -->

## How its implemented

This uses the excellent <a href="https://github.com/jcuga/golongpoll">Golongpoll library</a> and the events exposed by <a href="https://ace.c9.io/">ace.js</a> (the editor behind the app) to perform realtime sync of the changes when multiple users are modifying the same file.

The downside with this implementation versus Google's realtime API is the fact that this currently sits on a single instance in NYC meaning latency may hurt the experience of users far from the North American east coast. Future development of this feature will eventually make this globally distributed like the rest of the app.

<!--- end panel -->

## Next steps

The new version of the app will launch as the stable version in the beginning of December just in time for the start of the shutdown of the Google Drive realtime API (planned on December 11th) -- <a href="https://www.google.ca/url?sa=i&source=images&cd=&cad=rja&uact=8&ved=2ahUKEwj6gYal7eHeAhXjT98KHYLEDaEQjRx6BAgBEAU&url=https%3A%2F%2Fknowyourmeme.com%2Fmemes%2Fi-too-like-to-live-dangerously&psig=AOvVaw3Hjg6rHdZfU0tgwCKk6oqa&ust=1542764901879117">I also like to live dangerously</a>

Also, as promised a while back, if the realtime collaboration was an in-house implementation, Dropbox support would be added. We're currently looking into this and will analyse the now more limited required features from the Dropbox API to make this possible.

<!--- end panel -->

        <h4 style="text-align:center">
                  If you want to learn more about the new realtime collaboration, <br><a target="_blank" href="/news">click here for a detailed 
                  article</a>

