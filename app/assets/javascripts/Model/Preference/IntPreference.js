function IntPreference(value){
  this.value = value 
}

IntPreference.prototype.valueOf = function(){
  return parseInt(this.value)
}
