Class("TourController", ["Model"]);

TourController.prototype.post_init = function(args){
}

TourController.prototype.install_overlay = function() {
  var self = this;
  if(!self.overlay) {
    self.overlay = $('<div></div>');
    self.overlay.css('z-index', '9998');
    self.overlay.css('position', 'fixed');
    self.overlay.css('top', '0');
    self.overlay.css('bottom', '0');
    self.overlay.css('left', '0');
    self.overlay.css('right', '0');
  }
  $('body').append(self.overlay);
}

TourController.prototype.remove_overlay = function() {
  var self = this;
  self.overlay.remove();
}

TourController.prototype.menu_change_tour = function() {
  var self = this;
  self.install_overlay();
  var tour = new Shepherd.Tour({
    defaults: {
      classes: 'shepherd-theme-default'
    }
  });

  tour.addStep('present-file-menu-changes', {
    when: {
      show:function() {
        document.getElementById('file_menu_btn').click();
      },
    },
    text: 'All file related operations are in this menu now.',
    attachTo: '#file_menu_btn right',
  });

  tour.addStep('present-file-menu-moved', {
    text: 'The open and favorites menu as well as the syntax selection are now here.',
    attachTo: '#expanded_menu a.menu-file-favorites right',
    when: {
      hide: function() {
        document.getElementById('file_menu_btn').click();
      },
    },
  });

  tour.addStep('present-options-menu-changes', {
    beforeShowPromise: function() {
      return new RSVP.Promise(function(resolve, reject) {
        setTimeout(function() {
          document.getElementById('options_menu_btn').click();
          resolve();
        }, 1000)
      });
    },
    text: 'The Options menu now contains a section to manage your accounts as well as an advanced section.',
    attachTo: '#expanded_menu bottom',
  });

  tour.addStep('present-options-menu-advanced', {
    beforeShowPromise: function() {
      return new RSVP.Promise(function(resolve, reject) {
        $('#expanded_menu .menu-options-advanced').click();
        setTimeout(function() {
          resolve();
        }, 1000)
      });
    },
    text: 'The advanced section allows you to select a theme, the display language and other advanced options.',
    attachTo: '#expanded_menu right',
  });

  tour.addStep('present-changes-completed', {
    text: 'We hope you like those changes, and feel free to provide feedback on how we can make the app better via our Google+ Community.',
    attachTo: '#expanded_menu right',
    when: {
      hide: function() {
        document.getElementById('options_menu_btn').click();
        self.remove_overlay();
      },
    },
    buttons: [
      {
        text: 'Done',
        action: tour.complete
      }
    ]
  });
  tour.start();
}

