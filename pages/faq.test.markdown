## Why is a file opened with the app unreadable?

This is actually because you opened a file that is not considered as plain text (see <a href="http://en.wikipedia.org/wiki/Plain_text">http://en.wikipedia.org/wiki/Plain_text</a>). 

The app warns you on the first startup and whenever you open an non plain-text file about this. Make sure you read the warnings, they offer details on how this app behaves.

Files such as Word document, PDF, Pages, images, music, Excel Documents, ZIP are not supported. Note that this list is far from complete and could go on for about 100 pages.

Paying for the app or contacting us will not allow you to open a file that you're currently unable to open.

<!--- end panel -->

## Why does the app open files that have unreadable content ?

We built this app to allow anyone to open any type of file exactly like you do with a Windows application like Notepad++ or GEdit in Linux. We saw that no app allowed you to open these weird type of code files that you don't see often so that's why there is no limit to the type of files you can open. If the file you are opening was never intended to be read directly by a human, well this app won't change it. It's primary use is actually to modify code and configuration files. If you're trying to open a PDF, video or Word document, there are plenty of other apps that allow you to do this.

<!--- end panel -->

## How to override the detected syntax of a file

First of all, you can override the syntax of a file by selecting a new syntax in "File->Select Syntax". When you do this, it will record that preference for the current file extension.

On top of this, similar to vi and vim, you can override the detected syntax of a file by putting a commented line at the bottom of the file indicating which syntax you want to use:
<pre>
// afn:syntax=javascript
# afn:syntax=perl
&lt!--- afn:syntax=html --&gt
</pre>

You can view the full list of syntaxes <a href="https://admin.anyfile-notepad.semaan.ca/#/syntaxes">by clicking here</a>. You will need to use the 'ace_js_mode' value of the desired syntax in the syntax line.

<!--- end panel -->

## How to open or create files directly from Google Drive

This may be related to a Google account issue we had a while back.

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

## Constantly being prompted to authorize the app even though the app was already authorized

If you are using a Google Domain, make sure that 'Third-Party Cookie Blocking' isn't enabled in 'Device management > Chrome Management > User Settings'.

Otherwise, make sure your browser isn't blocking Third-Party cookies. Refer to the following <a href="http://en.lmgtfy.com/?q=third-party+cookie+blocking">link</a> for tips on how it works and how to disable it in your browser.

<!--- end panel -->

## Will this app be translated in langages other than English ?

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

## Hey I found a bug in your so-perfect software. What should I do ?

First, this app is only officially supported on Google Chrome. It will likely work well on other browsers but support may vary.

Make sure you use Google Chrome or at least an up to date version of your browser and if your issue reoccurs, submit it <a href="https://github.com/julsemaan/anyfile-notepad/issues/new">on Github</a> with enough details to reproduce it.

If your bug is on Internet Explorer, don't bother submitting it. This app is not supported at all on Internet Explorer

<!--- end panel -->

## Is the app supported on Internet Explorer ?

Since this is a project that is done for fun and that doing CSS and Javascript in IE is our personal equivalent to pure torture, we're am not even trying.

Sorry, we know IE is popular in corporate environments but it would be a pain that would drive us away from this.

Thankfully, Microsoft Edge is addressing this incompatibility problem. If you have any issues with the Edge browser, let us know.

<!--- end panel -->

## How to uninstall the app ?

Since this app is plugged into your Chrome Browser you first need to uninstall it from there. Then to fully remove Anyfile Notepad you need to remove it from Google Drive. See the instructions provided by Google by <a href="https://support.google.com/drive/answer/2523073?hl=en">clicking here</a>.

<!--- end panel -->

## I have a question that is not in this list. How can I get an answer ?

Feel free to contact us <a href="/site/contact.html">by clicking here</a>

<!--- end panel -->
