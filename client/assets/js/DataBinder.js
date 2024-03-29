function DataBinder( object_id ) {
  // Use a jQuery object as simple PubSub
  var pubSub = jQuery({});

  // We expect a `data` element specifying the binding
  // in the form: data-bind-<object_id>="<property_name>"
  var data_attr = "bind-" + object_id,
      message = object_id + ":change";

  // Listen to change events on elements with the data-binding attribute and proxy
  // them to the PubSub, so that the change is "broadcasted" to all connected objects
  jQuery( document ).on( "change", "[data-" + data_attr + "]", function( evt ) {
    var $input = jQuery( this );

    pubSub.trigger( message, [ $input.data( data_attr ), $input.val(), $input ] );
  });

  jQuery( document ).on( "blur keyup paste input", "[contenteditable][data-" + data_attr + "]", function( evt ) {
    var $input = jQuery( this );

    pubSub.trigger( message, [ $input.data( data_attr ), unsanitize($input.html()), $input ] );
  });

  // PubSub propagates changes to all bound elements, setting value of
  // input tags or HTML content of other tags
  pubSub.on( message, function( evt, prop_name, new_val, target ) {
    jQuery( "[data-" + data_attr + "=" + prop_name + "]" ).each( function() {
      var $bound = jQuery( this );

      if($bound.is(target)) {
        return;
      }

      if ( $bound.is("input, textarea, select") ) {
        $bound.val( new_val );
      } 
      else if($bound.is("img")){
        $bound.attr("src", new_val);
      }
      else if($bound.is("[contenteditable]")) {
        $bound.html(sanitize(new_val))
      }
      else {
        $bound.attr("data-binder-value", new_val);
        $bound.html( sanitize(new_val) );
      }
    });
  });

  return pubSub;
}

function sanitize(s) {
  s += ""
  s = s.replaceAll('&', '&amp;')
  s = s.replaceAll('<', '&lt;')
  s = s.replaceAll('>', '&gt;')
  s = s.replaceAll('"', '&quot;')
  s = s.replaceAll("'", '&#x27;')
  s = s.replaceAll("/", '&#x2F;')
  s = s.replaceAll("`", '&grave;')
  return s;
}

function unsanitize(s) {
  s += ""
  s = s.replaceAll('&amp;', '&')
  s = s.replaceAll('&lt;', '<')
  s = s.replaceAll('&gt;', '>')
  s = s.replaceAll('&quot;', '"')
  s = s.replaceAll('&#x27;', "'")
  s = s.replaceAll('&#x2F;', "/")
  s = s.replaceAll('&grave;', "`")
  return s;
}
