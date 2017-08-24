Class("ArrayPreference", ["Preference"]);

ArrayPreference.find = Preference.find;

ArrayPreference.prototype.init_child = function(args){
  var value = args["value"] || "[]";
  this.array = JSON.parse(value);
  this.value = value;
}

ArrayPreference.prototype.commit = function(locker, fail_action){
  return this.refreshAndSet(this.array, locker, fail_action);
}

ArrayPreference.prototype.toString = function() {
  return JSON.stringify(this.array);
}
