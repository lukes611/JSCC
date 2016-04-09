

function FuncVar(name, returnType, argumentDTypes){
	this.name = name;
	this.returnType = returnType;
	this.arguments = argumentDTypes.map(function(i){return i;});
	this.assembly = [];
}

FuncVar.prototype.scopeName = function(){
	return this.name + this.arguments.reduce(function(p, c){p.push(c); return p; }, []).join('_');
};

FuncVar.prototype.toString = function(){
	var rv = [this.name + '(' + 
	this.arguments.join(', ') + ')->' + this.returnType];
	rv.push("Assembly:");
	Array.prototype.push.apply(rv, this.assembly);
	return '*****************************\n'+rv.join('\n')+'\n*****************************\n';
};





module.exports = FuncVar;