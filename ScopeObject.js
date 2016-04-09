var NamingObject = require('./NamingObject');
/*
global -> inits, functions, structs, dvars, vars, assembly, scope
functions -> global, inits, assembly, dvars, vars, scope
stack -> global, inits, dvars, vars

ScopeObject has a static namingObject 
*/

function ScopeObject(){
	this.variables = [[]];
	this.dvariables = [[]];
	this.assembly = [[]];
	this.scope = ['global'];
	this.loopRedirects = [];
	this.funcs = [];
	this.namingObject = new NamingObject();
};

//returns a string representation of this object
ScopeObject.prototype.toString = function(){
	var st = 'DVARS:\n';
	var f1 = function(x){ st += x.toString() + '\n'; };
	this.dvariables.forEach(f1);
	st += 'VARIABLES:\n';
	this.variables.forEach(f1);
	st += 'CODE:\n';
	this.assembly.forEach(f1);
	st += 'FUNCTIONS:\n';
	this.funcs.forEach(f1);
	return st;
};
ScopeObject.prototype.getVariables = function(){return this.variables.slice(-1);};
ScopeObject.prototype.getDVariables = function(){return this.dvariables.slice(-1);};
ScopeObject.prototype.getScope = function(){return this.scope.slice(-1);};

//gets the current assembly code
ScopeObject.prototype.getAssembly = function(){return this.assembly.slice(-1);};
//gets the assembly code pushed most recently and removes and returns it
ScopeObject.prototype.popAssembly = function(){return this.assembly.pop();};
//adds another assembly list to the stack
ScopeObject.prototype.pushAssembly = function(){this.assembly.push([]);};
//add assembly takes a list of arguments and adds them to the current assembly
ScopeObject.prototype.addAssembly = function(){
	if(arguments.length == 0) return;
	var st = []; for(var i = 0; i < arguments.length; i++) st.push(arguments[i]);
	this.getAssembly().push(st.join(' '));
};
//creates a new Temporary variable and adds it to the 
ScopeObject.prototype.newTmpVar = function(dtype, loc){
	var rv = new Variable(this.namingObject.newTmpName(), dtype, this.getScope(), 'tmp', undefined, loc);
	this.getVariables().push(rv);
	return rv;
};
//creates a new data variable for holding data
ScopeObject.prototype.newDataVar = function(dtype, value, loc){
	var rv = new Variable(this.namingObject.newTmpName(), dtype, this.getScope(), 'data', value, loc);
	this.getDVariables().push(rv);
	return rv;
};
//up2 dis!!!!blah
ScopeObject.prototype.newBytesVar = function(dtype, value, loc){
	var rv = new Variable(this.no.newTmpName(), dtype, this.scope, 'bytes', value, loc);
	this.getVariables().push(rv);
	return rv;
};


Parser.prototype.newRefVar = function(dtype, loc){
	var rv = new Variable(this.no.newTmpName(), dtype, this.scope, 'ref', undefined, loc);
	this.variables.push(rv);
	return rv;
};

Parser.prototype.newUserVar = function(name, dtype, loc){
	var rv = new Variable(name, dtype, this.scope, 'user', undefined, loc);
	if(this.variableExistsInScope(rv)!=-1) this.error('Error, variable: ' + name + ' has already been defined on line ' + loc);
	this.variables.push(rv);
	return rv;
};




module.exports = ScopeObject;