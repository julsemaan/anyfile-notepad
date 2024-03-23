## Drop us a line

<style>
  a {
    text-decoration: underline;
  }
</style>

<div class="alert alert-warning contact-warning" style="font-size:110%;">
  <p>Please make sure that you first read our <a href="/faq">Frequently Asked Questions (FAQ)</a> page before contacting us.</p>
  <p>Questions on how to open specific types of files or on how to uninstall the app are covered in the <a href="/faq">FAQ</a> so please don't ask them here.</p>
  <p>Your message must be in English (use Google Translate if necessary).</p>
  <p><b>Any message that doesn't match the criterias above will not be answered and will be silently ignored.</b></p>
</div>

<div class="alert alert-success hide" id="message_sent">
  <p>
  Your message was sent successully, we will reply in the next 24 to 48 hours. 
  </p>
  <p>
  Make sure to verify your SPAM folder in the event you don't see our reply.
  </p>
</div>

<div class="alert alert-danger hide" id="invalid_input">
  <p>
    Please ensure that your email address is valid and that all the fields have been filled.
  </p>
  <p>
    Your message must contain at least 10 characters and at most 2000 characters.
  </p>
</div>

<div class="alert alert-danger hide" id="error">
  <p>
    Failed to submit contact request. Please try again later or send an email to <a href="mailto:support@semaan.ca">support@semaan.ca</a>
  </p>
</div>

<form>
  <div class="form-group">
    <label for="contact_email">Email address</label>
    <input type="email" class="form-control" id="contact_email" aria-describedby="emailHelp" placeholder="Enter email">
    <small id="emailHelp" class="form-text text-muted">We'll never share your email with anyone else.</small>
  </div>
  <div class="form-group">
    <label for="message">Message</label>
    <textarea class="form-control" id="message" rows=6 maxlength=2000></textarea>
  </div>
  <button type="submit" class="btn btn-primary">Submit</button>
</form>

<script>
$(function(){
  if(window.location.search.match("feedback")) {
    $('.contact-warning').hide()
  }
  $('form').submit(function(e){
    $("#invalid_input").addClass("hide");
    e.preventDefault();
    $.ajax({
      type: "POST",
      url: "https://api.anyfile-notepad.semaan.ca/contact_requests",
      data: JSON.stringify({
        "contact_email":$('#contact_email').val(),
        "message":$('#message').val(),
      }),
      contentType: "application/json; charset=utf-8",
      }).
      done(function(data) {
        $('form').hide();
        $('#message_sent').removeClass("hide");
      }).fail(function(data) {
        console.log(data)
        if(data.status == 422) {
          $("#invalid_input").removeClass("hide")
        } else {
          $("form").hide();
          $("#error").removeClass("hide");
        }
      });
    return false;
  })
})
</script>

<!--- end panel -->

