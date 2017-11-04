Class("HBRenderer", ["Model"])

HBRenderer.prototype.post_init = function(args) {
  var self = this;

  self.registerHelpers();
}

HBRenderer.prototype.renderAll = function(context) {
  var templates = $('.template');
  var partials = $('.template-partial');

  partials.each(function() {
    var $source = $(this);
    Handlebars.registerPartial($source.data('partial-name'), $source.html());
  });

  templates.each( function() {
    var $source = $(this);
    var source = $source.html();
    var template = Handlebars.compile(source);
    $(template(context)).insertAfter($source);
  });
}

HBRenderer.prototype.registerHelpers = function() {
  Handlebars.registerHelper('i18n', locale_controller.i18n);

  Handlebars.registerHelper('noaction', function(){return "javascript:void(0)"});

  Handlebars.registerHelper('m-action-n-close', function(action){
    action = typeof(action) == "string" ? action : "";
    return 'data-eb-click="application.controllers.editor.top_menu.action_and_close(function(){'+action+'})"'
  });

  Handlebars.registerHelper('isNull', function(val){
    return val == null;
  });

  Handlebars.registerHelper('concat', function(){
    var params = Array.from(arguments);
    params = params.slice(0, params.length - 1);
    return params.join('');
  });

  Handlebars.registerHelper("math", function(lvalue, operator, rvalue, options) {
      lvalue = parseFloat(lvalue);
      rvalue = parseFloat(rvalue);
          
      return {
          "+": lvalue + rvalue,
          "-": lvalue - rvalue,
          "*": lvalue * rvalue,
          "/": lvalue / rvalue,
          "%": lvalue % rvalue
      }[operator];
  });

  Handlebars.registerHelper("eq", function(param1, param2) {return param1 == param2;});
  Handlebars.registerHelper("ne", function(param1, param2) {return param1 != param2;});
  Handlebars.registerHelper("ge", function(param1, param2) {return param1 >= param2});
  Handlebars.registerHelper("gt", function(param1, param2) {return param1 > param2});
  Handlebars.registerHelper("le", function(param1, param2) {return param1 <= param2});
  Handlebars.registerHelper("lt", function(param1, param2) {return param1 < param2;});

}
