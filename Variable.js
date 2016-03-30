function Variable(name, dtype, type, scope, value, count, locations){
	this.name = name;
	this.dtype = dtype;
	this.type = type;
	this.scope = scope;
	this.value = value;
	this.count = count;
	this.locations = locations;
}

Variable.prototype.toString = function(){
	return this.dtype + " " +  this.name + ' in ' + this.scope + ' = ' + this.type + ': ' + this.value + ' count: ' + this.count;
};

Variable.prototype.eq = function(v2){
	return this.name == v2.name && this.scope == v2.scope && this.type == v2.type;
};



module.exports = Variable;