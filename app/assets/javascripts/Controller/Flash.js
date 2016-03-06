function FlashController(view){
  this.id = view;
  this.view = $('#'+view);
  this.dynamic_flash = $($.parseHTML("<div></div>"));
  this.sticky_flash = $($.parseHTML("<div></div>"));
  this.notifications = $($.parseHTML("<div class='flash_notifications'></div>"));
  this.view.append(this.dynamic_flash);
  this.view.append(this.sticky_flash);
  this.view.parent().append(this.notifications);
  this.notification_queue = [];
  this.count = 0;
}

FlashController.prototype.get_alert_id = function(){
  this.count++
  return "flash_"+this.id+"_"+this.count;
}

FlashController.prototype.add = function(text, type, timeout, where){
  var alert_id = this.get_alert_id()
  var html = "<div style='text-align:left' class='alert alert-"+type+"' data-flash-id="+alert_id+"><button type='button' class='close' data-dismiss='alert'><span aria-hidden='true'>&times;</span><span class='sr-only'>Close</span></button><p>"+text+"</p></div>"
  var element = $($.parseHTML(html));
  var notification = element.clone();
  element.hide()
  where.prepend(element)
  element.slideDown()
  if(timeout){
    setTimeout(function(){
      //$('*[data-flash-id="'+alert_id+'"]').remove();
      element.slideUp()
    }, timeout*1000)
  }
  this.show_notification(notification);
}

FlashController.prototype.show_notification = function(notification){
  this.notification_queue.push(notification);
  // No notifications are being shown so we do it
  // Detected by seeing we're alone in the queue
  if(this.notification_queue.length == 1){
    console.log("Starting queue processing");
    this.show_next_notification();
  }
}

FlashController.prototype.show_next_notification = function(){
  var self = this;
  var notification = this.notification_queue[0];
  if(notification){
    this.notifications.append(notification);
    setTimeout(function(){
      notification.fadeOut(function(){
        self.notification_queue.shift();
        self.show_next_notification();
      });
    },3000);
  }
}

FlashController.prototype.success = function(text, timeout){
  this.add(text, 'success' , timeout, this.dynamic_flash)
}

FlashController.prototype.error = function(text, timeout){
  this.add(text, 'danger' , timeout, this.dynamic_flash)
}

FlashController.prototype.warning = function(text, timeout){
  this.add(text, 'warning' , timeout, this.dynamic_flash)
}

FlashController.prototype.sticky_success = function(text){
  this.add(text, 'success' , false, this.sticky_flash)
}

FlashController.prototype.sticky_error = function(text){
  this.add(text, 'danger' , false, this.sticky_flash)
}

FlashController.prototype.sticky_warning = function(text){
  this.add(text, 'warning' , false, this.sticky_flash)
}

FlashController.prototype.empty = function(){
  this.dynamic_flash.html("")
}

FlashController.prototype.toggle_maximize = function(){
  if(this.view.is(":visible")){
    this.minimize();
  }
  else {
    this.maximize();
  }
}

FlashController.prototype.maximize = function(){
  this.view.fadeIn();
}

FlashController.prototype.minimize = function(){
  this.view.fadeOut();
}
