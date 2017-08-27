Class("FlashController", ["Model"]);

FlashController.prototype.post_init = function(args){
  var self = this;
  console.log(this)

  var view = self.view;
  this.id = view;
  this.view = $('#'+view);
  this.dynamic_flash = $($.parseHTML("<div></div>"));
  this.sticky_flash = $($.parseHTML("<div></div>"));
  this.notifications = $($.parseHTML("<div class='flash_notifications'></div>"));
  this.view.append(this.dynamic_flash);
  this.view.append(this.sticky_flash);
  this.view.parent().append(this.notifications);
  this.notification_queue = [];
  this.count_since_started = 0;
  this.set("count", 0);

  this.alert_template = Handlebars.compile($('[data-template-name="flash-message"]').html());
}

FlashController.prototype.update_count = function() {
  var self = this;
  self.set("count", self.dynamic_flash.children().size() + self.sticky_flash.children().size());
}

FlashController.prototype.get_alert_id = function(){
  this.count_since_started++
  return "flash_"+this.id+"_"+this.count_since_started;
}

FlashController.prototype.add = function(text, type, timeout, where){
  var self = this;

  var alert_id = this.get_alert_id()
  var element = $(self.alert_template({text:text, type:type, timeout:timeout, alert_id:alert_id}));
  var notification = element.clone();

  element.find("button.close").click(function(){
    // Give it time to be removed as this handler is called before the DOM is updated
    setTimeout(function() {
      self.update_count();
    }, 100);
  });

  // Don't allow to dismiss if it has a timeout
  if(timeout) {
    element.find("button.close").hide();
  }

  // Insert into body
  element.hide()
  where.prepend(element)
  element.slideDown()

  self.update_count();

  if(timeout){
    setTimeout(function(){
      element.slideUp();
      self.update_count();
    }, timeout*1000)
  }

  // Show temporary notification
  this.show_notification(notification);
}

FlashController.prototype.show_notification = function(notification){
  this.notification_queue.push(notification);
  // No notifications are being shown so we do it
  // Detected by seeing we're alone in the queue
  if(this.notification_queue.length == 1){
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
  var self = this;
  this.dynamic_flash.html("");
  self.update_count();
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
  $('.flash_notifications').hide();
  this.view.fadeIn();
}

FlashController.prototype.minimize = function(){
  this.view.fadeOut();
  $('.flash_notifications').show();
}
