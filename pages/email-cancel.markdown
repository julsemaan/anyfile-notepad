## Cancel your subscription

Please click below to unsubscribe from the application. You will still be able to use the free version of the app even after unsubscribing.

<div style="text-align:center">
  <button id="unsubscribe" class="btn btn-primary">Unsubscribe</button>
  <div class="alert" id="result"></div>
</div>

<script>

function getParameterByName(name, url = window.location.href) {
    name = name.replace(/[\[\]]/g, '\\$&');
    var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

function handleResult(resultClass, message) {
    $("#unsubscribe").hide();
    $("#result").addClass(resultClass);
    $("#result").html(message)
}

$("#unsubscribe").on("click", function() {
  $.post("/api/billing/link_cancel/"+getParameterByName("cus_id")+"/"+getParameterByName("cancel_link_id"))
    .success(function(response){
      handleResult("alert-success", response.message);
    })
    .error(function(response){ 
      if(response.responseJSON.message && response.status == 400) {
        handleResult("alert-warning", response.responseJSON.message);
      } else {
        handleResult("alert-danger", "There was an error canceling your subscription. Please contact support@semaan.ca via email to cancel this subscription.");
      }
    })
})
</script>


<!--- end panel -->
