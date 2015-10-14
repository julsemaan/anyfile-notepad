function MDRenderer(ledata){
  ledata['columns'] = ledata['columns'] || 1;
  Model.call(this, ledata);

  var self = this;

  var user_callback = ledata['callback'] || function(){};
  var callback;

  if(self.destination){
    callback = function(){
      $(self.destination).append(self.createGrid());
      user_callback();
    }
  }

  self.parseFile(callback ? callback : user_callback);
}

MDRenderer.prototype = new Model()

MDRenderer.prototype.parse = function(text){
  var self = this;
  var lexer = new marked.Lexer();
  var tokens = lexer.lex(text);
  return tokens;
}

MDRenderer.prototype.getFile = function(callback) {
  var self = this;
  $.ajax({
    url:self.url,
    success:function(data){
      callback(data);
    }
  })  
}

MDRenderer.prototype.parseFile = function(callback) {
  var self = this;
  self.getFile(function(data){
    self.elements = self.parse(data);
    callback(self.elements);
  });
}

MDRenderer.prototype.createGrid = function(){
  var self = this;
  var width = 12 / self.columns;
  var panels = self.createPanels();
  
  var missing = self.columns - (panels.length % self.columns);
  var per_column = (panels.length + missing) / self.columns;

  // inserts an empty panel at each bottom of row starting from the end to make all columns equal
  for(var i=0; i<missing; i++){
    panels.splice((length - (i*per_column) -1), 0, $('<span style="display:none"></span>'));
  }
  
  var row = $('<div class="row"></div>');
  var column = $('<div class="col-md-'+width+'"></div>');
  for(var i in panels){
    i = parseInt(i)
    column.append(panels[i]);
    // we switch column if necessary
    if((i+1) % per_column == 0){
      if(column) row.append(column);
      column = $('<div class="col-md-'+width+'"></div>');
    }
  }
  return row;
}

MDRenderer.prototype.createPanels = function() {
  var self = this;
  var panels = [];
  var title;
  var panel_items = [];
  for(var i in self.elements){
    var element = self.elements[i];
    if(element.type == "heading"){
      // Just a random info header
      if (element.depth == 1){
        panels.push($("<h3 class='alert alert-success'></h3>").html(element.text));
      }
      else if(element.depth == 2){
        title = element.text;
      }
    }
    else if(element.type == "paragraph"){
      panel_items.push(element)
    }
    else if(element.text == "<!--- end panel -->\n"){
      var panel = self.createPanel(title, panel_items);
      panels.push(panel);

      title = undefined;
      panel_items = [];
    }
    else if(element.type == "html") {
      panel_items.push(element);
    }
  }
  return panels;
}

MDRenderer.prototype.createPanel = function(title, panel_items){
  var self = this; 
  var panel = $('<div class="panel"></div>')
  var panel_header = $('<h3 class="panel-heading"></h3>');
  var panel_body = $('<div class="panel-body"></div>');
  panel.append(panel_header);
  panel.append(panel_body);

  panel_header.html(title);
  for(var i in panel_items){
    var e = panel_items[i].type == "paragraph" ? $('<p></p>').html(panel_items[i].text) : $(panel_items[i].text);
    panel_body.append(e);
  }
  return panel;
}
