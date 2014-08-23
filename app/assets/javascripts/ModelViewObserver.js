function ModelViewObserver(model, view){
  this.model = model
  this.view = []
  this.add_view(view)

  this.skip_model = false
  this.skip_view = false
}

ModelViewObserver.prototype.update_view = function(){
  var self = this;
  if(this.skip_view) return  
  console.log(this.skip_view)
  $.each(this.view, function(){
    var model_attribute = $(this).attr("data-model-attr");
    var view_attribute = $(this).attr("data-view-attr");
    var value = self.model[model_attribute]
    if(view_attribute == "value")
      $(this).attr(view_attribute, value)
    else if(view_attribute)
      $(this).val(value)
    else
      $(this).html(value);
  })
}

ModelViewObserver.prototype.update_model = function(){
  var self = this;
  if(this.skip_model) return
  console.log("synching model")
  $.each(this.view, function(){
    var model_attribute = $(this).attr("data-model-attr");
    var view_attribute = $(this).attr("data-view-attr");
    var value 
    if(view_attribute == "value")
      value = $(this).val() 
    else if (view_attribute)
      value = $(this).attr(view_attribute) 
    else
      value = $(this).html();
    self.model[model_attribute] = value
  })
}

ModelViewObserver.prototype.observe_model = function(){
  var self = this
  //start by making it refreshed
  Object.observe(this.model, function(change){
    console.log("change to model")
    self.skip_model = true
    self.update_view()
    self.skip_model = false
  })
}

ModelViewObserver.prototype.observe_view = function(){
  var self = this
  //start by making it refreshed
  $.each(this.view, function(){
    console.log(this)
    if(this.attr("data-view-attr") && this.attr("data-view-attr") == "value"){
      this.on('change', function(){
        console.log("change"+ this)
        self.skip_view = true
        self.update_model()
        self.skip_view = false
      })
    }
    else if(this.attr("data-view-attr")){
      this.attrchange({trackValues: true, callback: function(){
        console.log("change"+ this)
        self.skip_view = true
        self.update_model()
        self.skip_view = false
      }})
    }
    else{
      this.bind("DOMSubtreeModified",function(){
        console.log("change" +this)
    })
    }
  })
}

ModelViewObserver.prototype.observe_both = function(from){
  var self = this
  if (from == "model") this.update_view()
  else if (from == "view") this.update_model()

  this.observe_view()
  this.observe_model()
}

ModelViewObserver.prototype.add_view = function(view){
  var self = this
  if(view.attr("data-model-attr")) {
    this.view.push(view)
  }
  else {
    view.find("[data-model-attr]").each(function(){
      self.view.push($(this))
    })
  }

}
