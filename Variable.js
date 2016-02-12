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

module.exports = Variable;