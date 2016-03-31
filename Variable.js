/*
has Variable object:
	name, dtype, scope, isGlobal, isReference, isTemporaryVariable, location 
has data object:
	name, dtype, scope, size, locationInMemory

types: user, tmp, ref, data, bytes

*/

function Variable(name, dtype, scope, type, value, codeLocations){
	this.name = name;
	this.dtype = dtype;
	this.scope = scope;
	this.type = type;
	this.value = value;
	this.codeLocations = codeLocations;
}

Variable.prototype.toString = function(){
	return this.name + ' of type ' + this.dtype + ' in ' + this.scope + ' type(' + 
	this.type + ')' + (this.type=='data' || this.type =='bytes'?' = '+this.value:'');
};

Variable.prototype.eq = function(v2){
	return this.name == v2.name && this.scope == v2.scope && this.type == v2.type;
};





module.exports = Variable;