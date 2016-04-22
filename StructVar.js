
function StructVar(name){
	this.name = name;
	this.dtype = 'struct ' + this.name;
	this.vars = []; // objects have: name, dtype, count, index
	this.size = 0;
	this.index = 0;
}

StructVar.varToString = function(x){
	return '\tname: ' + x.name + ', dt: ' + x.dtype +
		' size: ' + x.size + ', index: ' + x.index;
};

StructVar.prototype.toString = function(){
	var rv = [];
	rv.push('name: ' + this.name, 'dtype: ' + this.dtype);
	rv.push.apply(rv, this.vars.map(StructVar.varToString));
	rv.push('size in bytes: ' + this.size);
	return '*****************************\n'+rv.join('\n')+'\n*****************************\n';
};

StructVar.prototype.getVar = function(name){
	for(var i = 0; i < this.vars.length; i++) if(this.vars[i].name == name) return this.vars[i];
	return undefined;
};

StructVar.prototype.newVariable = function(name, dtype, count, size_t){
	if(count === undefined) count = 1;
	var s = size_t === undefined ? StructVar.sizeOf(dtype) : size_t;
	s *= count;
	if(count > 1) dtype += '*';
	this.vars.push({
		name: name,
		dtype: dtype,
		size: s,
		index: this.index
	});
	this.size += s;
	this.index += s;
};


StructVar.isPtrType = function(dtype){
	return dtype.indexOf('*') !== -1;
};

StructVar.sizeOf = function(dtype){
	if(StructVar.isPtrType(dtype)) return 4;
	var ind = 'int,double,char,unsigned int,unsigned char,short'.split(',').indexOf(dtype);
	if(ind == -1) return undefined;
	return [4,8,1,4,1,2][ind];
};



if(typeof module !== 'undefined') module.exports = StructVar;