## Why is the file I'm opening an unreadable mess?

This is actually because you opened a file that is not considered as plain text (see <a href="http://en.wikipedia.org/wiki/Plain_text">http://en.wikipedia.org/wiki/Plain_text</a>). 

I can now see you didn't read the notice in the Chrome Store and on the home page but I now forgive you. 

Files such as Word document, PDF, Pages, images, music, Excel Documents, ZIP are not supported. Note that this list is far from complete and could go on for about 100 pages.

<!--- end panel -->

## Then why does the app opens these type of files? (follow-up to the previous question) 

I built this app to allow anyone to open any type of file on Google Drive exactly like you do with a Windows application like Notepad++ or GEdit in Linux. I saw that no app allowed you to open these weird type of code files that you don't see often so that's why there is no limit to the type of files you can open. If the file you are opening was never intended to be read directly by a human, well this app won't change it. It's primary use is actually to modify code and configuration files.

<!--- end panel -->

## I want to override the detected syntax of a file

First of all, you can override the syntax of a file by selecting a new syntax in "File->Select Syntax". When you do this, it will record that preference for the current file extension.

On top of this, similar to vi and vim, you can override the detected syntax of a file by putting a commented line at the bottom of the file indicating which syntax you want to use:
<pre>
// afn:syntax=javascript
# afn:syntax=perl
&lt!--- afn:syntax=html --&gt
</pre>

You can view the full list of syntaxes <a href="https://admin.anyfile-notepad.semaan.ca/#/syntaxes">by clicking here</a>. You will need to use the 'ace_js_mode' value of the desired syntax in the syntax line.

<!--- end panel -->

## I am not able to open or create files directly from Google Drive

This may be related to a Google account issue I had a while back.

First, try to access the app directly <a href="/app">via this link.</a>. Authorize the application if prompted. Next, try an open or create from Google Drive.

If the above fails, try the following : 

<ul>
  <li>In Google Drive, click the gear in the top right (settings icon)</li>
  <li>Then click 'Settings'</li>
  <li>Then 'Managing apps'</li>
  <li>Check if 'Anyfile Notepad' is there</li>
  <li>If it is, then click the 'Options' next to it and disconnect it from Drive.</li>
  <li>Then re-open the app <a href="/app">via this link</a> and authorize the application.</li>
</ul>

If and only if all of the above failed, ask for help <a href="/site/contact.html">by contacting us</a>

<!--- end panel -->

## I'm constantly being prompted to authorize the app even though I already authorized it

If you are using a Google Domain, make sure that 'Third-Party Cookie Blocking' isn't enabled in 'Device management > Chrome Management > User Settings'. You may need to contact your organization's IT support for help with this matter.

Otherwise, make sure your browser isn't blocking Third-Party cookies. Refer to the following <a href="http://en.lmgtfy.com/?q=third-party+cookie+blocking">link</a> for tips on how it works and how to disable it in your browser.

<!--- end panel -->

## Is this app be translated in langages other than English?

The app is currently translated in the following languages :
<ul>
  <li>Dutch</li>
  <li>French</li>
  <li>German</li>
  <li>Italian</li>
  <li>Japanese</li>
  <li>Polish</li>
  <li>Portuguese (Brazil)</li>
  <li>Spanish</li>
  <li>Romanian</li>
  <li>Turkish</li>
</ul>

If you want to translate the app in your language, <a href="/site/contact.html">please contact us</a>

<script type="text/javascript"> <!--
function UnCryptMailto( s )
{
    var n = 0;
    var r = "";
    for( var i = 0; i < s.length; i++)
    {
        n = s.charCodeAt( i );
        if( n >= 8364 )
        {
            n = 128;
        }
        r += String.fromCharCode( n - 1 );
    }
    return r;
}

function linkTo_UnCryptMailto( s )
{
    location.href=UnCryptMailto( s );
}
// --> </script>

<!--- end panel -->

## I found a bug in your so-perfect software. What should I do?

First, this app is only officially supported on Google Chrome. It will likely work well on other browsers but support may vary.

Make sure you use Google Chrome or at least an up to date version of your browser and if your issue reoccurs, submit it <a href="https://github.com/julsemaan/anyfile-notepad/issues">on our bug tracker</a> with enough details to reproduce it.

If your bug is on Internet Explorer, don't bother submitting it. This app is not supported at all on Internet Explorer

<!--- end panel -->

## Why can't I open the app in Internet Explorer?

Since this is a project that I do for fun and that doing CSS and Javascript in IE is my personal equivalent to pure torture, I am not even trying.

Sorry, I know IE is popular in corporate environments but it would be a pain that would drive me away from this.

Thankfully, Microsoft Edge is addressing this incompatibility problem. If you have any issues with the Edge browser, let us know.

<!--- end panel -->

## How can I uninstall/remove the app?

Since this app is plugged into your Chrome Browser you first need to uninstall it from there. Then to fully remove Anyfile Notepad you need to remove it from Google Drive. 

To remove the app, follow the instructions provided by Google by <a target="_blank" href="https://support.google.com/drive/answer/2523073?hl=en">clicking here</a>.

Additionally, to fully revoke all the permissions you gave to this app, follow the instructions provided by Google by <a target="_blank" href="https://support.google.com/accounts/answer/3466521?hl=en">clicking here</a>

<!--- end panel -->

## I have a question that is not in this list. How can I get an answer?

Feel free to contact us <a href="/site/contact.html">by clicking here</a>

<!--- end panel -->
