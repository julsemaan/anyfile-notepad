function FlashController(view){
  this.id = view
  this.view = $('#'+view)
  this.count = 0
}

FlashController.prototype.get_alert_id = function(){
  this.count++
  return "flash_"+this.id+"_"+this.count;
}

FlashController.prototype.adjust_height = function(){
  total_height = 0
  this.view.children().each(function(child){
    console.log(child)
    total_height += child.outerHeight()
  })
  console.log(total_height)
}

FlashController.prototype.add = function(text, type, timeout){
  var alert_id = this.get_alert_id()
  var html = "<div style='text-align:left' class='alert alert-"+type+"' data-flash-id="+alert_id+"><button type='button' class='close' data-dismiss='alert'><span aria-hidden='true'>&times;</span><span class='sr-only'>Close</span></button><p>"+text+"</p></div>"
  var element = $($.parseHTML(html));
  element.hide()
  this.view.prepend(element)
  element.fadeIn()
  if(timeout){
    setTimeout(function(){
      //$('*[data-flash-id="'+alert_id+'"]').remove();
      element.fadeOut()
    }, timeout*1000)
  }
}

FlashController.prototype.success = function(text, timeout){
  this.add(text, 'success' , timeout)
}

FlashController.prototype.error = function(text, timeout){
  this.add(text, 'danger' , timeout)
}

FlashController.prototype.warning = function(text, timeout){
  this.add(text, 'warning' , timeout)
}

FlashController.prototype.empty = function(){
  this.view.html("")
}
