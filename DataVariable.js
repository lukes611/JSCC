
function DataVariable(name, dtype, value, scope, size_t, size_c){
	this.name = name;
	this.dtype = dtype;
	this.scope = scope;
	this.locationInMemory = 0;
	this.value = value;
}

DataVariable.prototype.toString = function(){
	return this.name + ' of type ' + this.dtype + ' in ' + this.scope + ' size in bytes: undefined';
};