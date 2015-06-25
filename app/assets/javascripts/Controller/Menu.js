function MenuController(view, options){
  this.$ = $('#'+view);
  this.expanded_menu = this.$.find('#expanded_menu');

  this.ZINDEX_BACKGROUND = '990';
  this.ZINDEX_BAR = '995';
  this.ZINDEX_MENU_ITEMS = '999';

  this.previous_contents = [];

  this.active_link;
  this.init();
}

MenuController.prototype.init = function(){
  var self = this;
  self.setup_background();

  self.$.css('z-index', self.ZINDEX_BAR);

  self.$.find('.menu_item').css('z-index', self.ZINDEX_MENU_ITEMS);
  self.expanded_menu.css('z-index', self.ZINDEX_MENU_ITEMS);

  self.$.find('.menu_item').click(function(){
    if(self.active_link) {
      if(self.active_link[0] == $(this)[0]){
        self.hide_menu();
        return;
      }
      else{
        self.active_link.parent().removeClass('active');
      }
    }
    self.active_link = $(this);
    self.active_link.parent().addClass('active');
    self.show_menu();
  });

}

MenuController.prototype.setup_background = function() {
  var self = this;
  self.background =  $("<div></div>");
  self.$.append(this.background);
  self.background.hide();
  self.background.css('top',0);
  self.background.css('bottom',0);
  self.background.css('left',0);
  self.background.css('right',0);
  self.background.css('position','fixed');
  self.background.css('z-index',self.ZINDEX_BACKGROUND);

  self.background.click(function(){
    self.hide_menu();
  });
}

MenuController.prototype.show_menu = function(){
  var self = this;
  var top_offset = self.$.offset()['top'] + self.$.position()['top'] + self.$.outerHeight() + 5;
  self.expanded_menu.css('top', top_offset+"px")
  
  //var left_offset = self.active_link.offset()['left'] + self.active_link.position()['left'];
  //self.expanded_menu.css('left', left_offset+"px")
  //self.expanded_menu.css('bottom', "5px");
  

  self.expanded_menu.html(self.active_link.parent().find('.menu_content').html());

  self.setup_sub_menus();

  self.background.show();
  self.expanded_menu.fadeIn();
}

MenuController.prototype.setup_sub_menus = function() {
  var self = this;
  self.$.find('.sub_menu_item').click(function(){
    var link = $(this);
    self.previous_contents.push(self.expanded_menu.html());
    self.expanded_menu.slideUp(function(){
      self.expanded_menu.html(link.parent().find('.menu_content').html());



      self.setup_sub_menus();
      self.expanded_menu.slideDown();

    });
  });

  self.expanded_menu.find('.menu_back').click(function(){
    var previous_content = self.previous_contents.pop();
    self.expanded_menu.slideUp(function(){
      self.expanded_menu.html(previous_content);
      self.setup_sub_menus();
      self.expanded_menu.slideDown();
    });
  });

 
}

MenuController.prototype.hide_menu = function(){
  var self = this;
  self.expanded_menu.fadeOut();
  self.background.hide();
  self.active_link.parent().removeClass('active');
  self.active_link = undefined;
}
