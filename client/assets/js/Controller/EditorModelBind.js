Class("EditorModelBindController", ["Model"]);

EditorModelBindController.prototype.post_init = function(args){
  var self = this;

  self.set("line", 0);
  self.set("column", 0);
}
