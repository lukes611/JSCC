/*
has Variable object:
	name, dtype, scope, isGlobal, isReference, isTemporaryVariable, location 
has data object:
	name, dtype, scope, size, locationInMemory

*/

function Variable(name, dtype, scope, isReference, isTemporaryVariable, codeLocations){
	this.name = name;
	this.dtype = dtype;
	this.scope = scope;
	this.isReference = isReference;
	this.isGlobal = this.scope == 'global';
	this.isTemporaryVariable = isTemporaryVariable;
	this.codeLocations = codeLocations;
}

Variable.prototype.toString = function(){
	return this.name + ' of type ' + this.dtype + ' in ' + this.scope + ' ref/tmp(' + 
	this.isReference + ',' + this.isTemporaryVariable + ')';
};

Variable.prototype.eq = function(v2){
	return this.name == v2.name && this.scope == v2.scope &&
	this.isReference == v2.isReference && this.isTemporaryVariable == v2.isTemporaryVariable;
};



module.exports = Variable;