function Variable(name, dtype, type, scope, value, locations){
	this.name = name;
	this.dtype = dtype;
	this.type = type;
	this.scope = scope;
	this.value = value;
	this.locations = locations;
}

Variable.prototype.toString = function(){
	return this.dtype + " " +  this.name + ' in ' + this.scope + ' = ' + this.type + ': ' + this.value;
};

Variable.prototype.eq = function(v2){
	return this.name == v2.name && this.scope == v2.scope && this.type == v2.type;
};

module.exports = Variable;