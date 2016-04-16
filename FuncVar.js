

function FuncVar(name, returnType, argumentDTypes, uniqueId){
	this.name = name;
	this.returnType = returnType;
	this.arguments = argumentDTypes.map(function(i){return i;});
	this.assembly = [];
	this.variables = [];
	this.dvariables = [];
	this.uniqueId = uniqueId;
}

FuncVar.prototype.scopeName = function(){
	return this.name + '('+this.arguments.join(',') + ')';
};



FuncVar.prototype.dtype = function(){
	return 'func*('+this.arguments.join(',') + ')->' + this.returnType;
};

FuncVar.prototype.hasDefinition = function(){
	return this.assembly.length > 0;
};

FuncVar.prototype.eq = function(f2){ return this.scopeName() == f2.scopeName(); };

FuncVar.prototype.toString = function(){
	var rv = [this.name + '(' + 
	this.arguments.join(', ') + ')->' + this.returnType];
	rv.push('unique name: ' + this.scopeName());
	rv.push('id: ' + this.uniqueId);
	rv.push("Assembly:");
	Array.prototype.push.apply(rv, this.assembly);
	return '*****************************\n'+rv.join('\n')+'\n*****************************\n';
};





module.exports = FuncVar;