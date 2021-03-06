/*
has Variable object:
	name, dtype, scope, isGlobal, isReference, isTemporaryVariable, location 
has data object:
	name, dtype, scope, size, locationInMemory

types: user, tmp, ref, data, bytes

*/

function Variable(name, dtype, scope, type, value, uniqueId, codeLocations){
	this.name = name;
	this.dtype = dtype;
	this.scope = scope;
	this.type = type;
	this.value = value;
	this.uniqueId = uniqueId;
	this.codeLocations = codeLocations;
}

Variable.prototype.toString = function(){
	return this.name + ' ('+this.uniqueId + ')    \tof type ' + this.dtype + ' in ' + this.scope + ' type(' + 
	this.type + ')' + (this.type=='data' || this.type =='bytes'?' = '+this.printFriendlyValue():'');
};

Variable.prototype.printFriendlyValue = function(){
	if(this.value === undefined) return '';
	else if(typeof this.value === 'object'){
		if(this.value.length > 30){
			return this.value.slice(0, 20) + '...';
		}
	}
	return this.value;
};

Variable.prototype.eq = function(v2){
	return this.name == v2.name && this.scope == v2.scope && this.type == v2.type;
};

Variable.prototype.isStruct = function(){
	if(this.isPtr()) return false;
	return this.dtype.indexOf('struct') != -1 && this.dtype.split(' ').length == 2;
};

Variable.prototype.nameOfStruct = function(){
	var s = this.dtype.split(' ');
	if(s.length <= 1) return;
	s = s[1];
	s = s.replace(/\*/g, '');
	return s;
};


Variable.prototype.eqGlobal = function(v2){ return this.name == v2.name && this.type == v2.type &&
	(this.scope == 'global'); };

Variable.prototype.eqStack = function(v2){ return this.name == v2.name && this.type == v2.type; };


Variable.prototype.sameDType = function(v2){ return this.dtype == v2.dtype; };

Variable.prototype.isPtr = function(){ return this.dtype.indexOf('*') != -1; };

Variable.prototype.dref = function(){
	if(!this.isPtr()) return false;
	var index = this.dtype.length - 1 - this.dtype.split('').reverse().indexOf('*');
	this.dtype = this.dtype.substr(0, index) + this.dtype.substr(index+1);
	return true;
};

Variable.prototype.getDrefType = function(){
	if(!this.isPtr()) return undefined;
	var index = this.dtype.length - 1 - this.dtype.split('').reverse().indexOf('*');
	return this.dtype.substr(0, index) + this.dtype.substr(index+1);
};

Variable.prototype.isFunction = function(){return this.type == 'function';};

Variable.prototype.bestConversion = function(v2){
	if(this.dtype == 'void' || v2.dtype == 'void') return undefined;
	if(this.dtype !== v2.dtype && (this.isFunction() || v2.isFunction())) return undefined;
	if(this.dtype == v2.dtype) return this.dtype;
	if(this.isPtr() && v2.isPtr()) return this.dtype;
	if(this.isPtr()) return this.dtype;
	if(v2.isPtr()) return v2.dtype;
	var types = 'double,float,int,short,char'.split(',');
	var i1 = types.indexOf(this.dtype);
	var i2 = types.indexOf(v2.dtype);
	if(i1!=-1 && i2!=-1){
		return types[Math.min(i1, i2)];
	}
	return undefined;
};



if(typeof module !== 'undefined') module.exports = Variable;