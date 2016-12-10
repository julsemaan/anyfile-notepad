Class("AppSetting", ["Model"]);

AppSetting.find = function(name) {
  return new RSVP.Promise( function(r, f) {
    $.get(AFN_VARS["afn_api_uri"]+'/settings?filter={"var_name":"'+name+'"}')
      .done(function(data){
        if(data.length > 0) {
          r(data[0]);
        }
        else {
          f({"error":"variable not found"});
        }
      }).fail(function(data){
        f(data);
      });
  });
}


