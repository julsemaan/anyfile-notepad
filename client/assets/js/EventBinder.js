function StartEventBinder() {
  $(document).on('click', "[data-eb-click]", function(e){
    var $target = $(e.target);
    var action = $target.data('eb-click');
    action = action.replace(/\bthis\b/g, "$target");
    eval(action);
  });  
}

StartEventBinder();
