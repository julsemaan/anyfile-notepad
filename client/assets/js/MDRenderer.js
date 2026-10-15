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
  
  var index = 0;
  var row = $('<div class="row"></div>');
  for(var i=0; i<self.columns; i++){
    var column = $('<div class="col-md-'+width+'"></div>');
    var per_column = Math.ceil((panels.length - index) / (self.columns - i));
    for(var j=0; j<per_column; j++){
      column.append(panels[index++]);
    }
    row.append(column);
  }
  return row;
}

MDRenderer.prototype.createPanels = function() {
  var self = this;
  var panels = [];
  var title;
  var panel_items = [];
  for(var i=0; i<self.elements.length; i++){
    var element = self.elements[i];
    if(element.type == "heading" && element.depth == 1){
      // Just a random info header
      panels.push($("<h3 class='alert alert-success'></h3>").html(marked.Parser.parseInline(element.tokens)));
    }
    else if(element.type == "heading" && element.depth == 2){
      title = marked.Parser.parseInline(element.tokens);
    }
    else if(element.type == "html" && /^<!--- end panel -->\n*$/.test(element.text)){
      var panel = self.createPanel(title, panel_items);
      panels.push(panel);

      title = undefined;
      panel_items = [];
    }
    else {
      panel_items.push(element);
    }
  }
  return panels;
}

MDRenderer.prototype.createPanel = function(title, panel_items){
  var self = this; 
  var panel = $('<div class="panel panel-primary"></div>')
  var panel_header = $('<h4 class="panel-heading"></h4>');
  var panel_body = $('<div class="panel-body"></div>');
  panel.append(panel_header);
  panel.append(panel_body);

  panel_header.html(title);
  // Only trusted first-party pages: raw HTML, styles and scripts are intentional.
  // Do not use this renderer for user-supplied Markdown.
  panel_body.append(marked.parser(panel_items));
  return panel;
}
