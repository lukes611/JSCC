var Variable = require('./Variable');
var NamingObject = require('./NamingObject');
var FuncVar = require('./FuncVar');

/*
global -> inits, functions, structs, dvars, vars, assembly, scope
functions -> global, inits, assembly, dvars, vars, scope
stack -> global, inits, dvars, vars

ScopeObject has a static namingObject 
*/

function ScopeObject(errorF){
	this.error = errorF;
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
	var id = this.namingObject.newId();
	var rv = new Variable(this.namingObject.newTmpName(), dtype, this.getScope(), 'tmp', undefined, id, loc);
	this.getVariables().push(rv);
	return rv;
};
//creates a new data variable for holding data
ScopeObject.prototype.newDataVar = function(dtype, value, loc){
	var id = this.namingObject.newId();
	var rv = new Variable(this.namingObject.newTmpName(), dtype, this.getScope(), 'data', value, id, loc);
	this.getDVariables().push(rv);
	return rv;
};
//creates a new bytes data variable
ScopeObject.prototype.newBytesVar = function(dtype, value, loc){
	var id = this.namingObject.newId();
	var rv = new Variable(this.namingObject.newTmpName(), dtype, this.getScope(), 'bytes', value, id, loc);
	this.getDVariables().push(rv);
	return rv;
};

//creates and returns a reference type variable
ScopeObject.prototype.newRefVar = function(dtype, loc){
	var id = this.namingObject.newId();
	var rv = new Variable(this.namingObject.newTmpName(), dtype, this.getScope(), 'ref', undefined, id, loc);
	this.getVariables().push(rv);
	return rv;
};

//creates and returns a new user variable, unless one exists
ScopeObject.prototype.newUserVar = function(name, dtype, loc){
	var id = this.namingObject.newId();
	var rv = new Variable(name, dtype, this.getScope(), 'user', undefined, id, loc);
	if(this.variableExistsInScope(rv)!=-1) this.error('Error, variable: ' + name + ' was previously defined');
	this.getVariables().push(rv);
	return rv;
};

//checks if a variable exists in the current scope
ScopeObject.prototype.variableExistsInScope = function(v, vars){
	if(vars === undefined) vars = this.getVariables();
	for(var i = 0; i < vars.length; i++) if(vars[i].eq(v)) return vars[i];
	return undefined;
};

//checks if a variable exists in some scope
ScopeObject.prototype.variableExists = function(v, vars){
	for(var i = 0; i < vars.length; i++) if(vars[i].eqScope(v)) return vars[i];
	return undefined;
};


//tries to get a variable out of the scope
//tries to get a variable on the stack or a global one
ScopeObject.prototype.getDefinedVariable = function(v){
	for(var i = 1; i < this.variables.length; i++){
		var v2 = this.variableExists(v, this.variables.slice(-i));
		if(v2 !== undefined) return v2;
	}
	return undefined;
};

//force convert a variable to a type
ScopeObject.prototype.convertToType = function(inp, type){
	var name = this.namingObject.newTmpName();
	var id = this.namingObject.newId();
	var vari = new Variable(name, type, this.getScope(), 'tmp', undefined, id, inp.codeLocations);
	this.getVariables().push(vari);
	this.addAssembly('convertTo ', type, ' from ', inp.dtype, vari.name, inp.name);
	return vari;
};

//convert two variables to the correct type if neccesarry
//returns the an object:
//obj.e1 is the e1 variable: converted or not
//obj.e2 is the e2 variable: converted or not
//obj.bestType is the best type for both to be converted to assuming they would be going through an operation
ScopeObject.prototype.possibleTypeConversion = function(e1, e2){
	var bestType = e1.bestConversion(e2);
	if(bestType === undefined) this.error('Warning: Cannot combine ' + e1.dtype + ' and ' +
		e2.dtype + ' to common type');
	return {
		"bestType": bestType,
		"e1": this.convertToTypeIfNecessary(e1, bestType),
		"e2": this.convertToTypeIfNecessary(e2, bestType)
	};
};

//convert e2 to e1's dtype
ScopeObject.prototype.typeConversionE1 = function(e1, e2){
	var dtype = e1.dtype;
	return {
		"bestType": dtype,
		"e1": this.convertToTypeIfNecessary(e1, dtype),
		"e2": this.convertToTypeIfNecessary(e2, dtype)
	};
};

//convert a variable to dtype: 'type' if it is necessary
ScopeObject.prototype.convertToTypeIfNecessary = function(inp, type){
	if(inp.dtype != type) return this.convertToType(inp, type);
	return inp;
};

ScopeObject.prototype.pushContinueBreak = function(cont, brea){
	this.loopRedirects.push({'continue':cont, 'break':brea});
};

ScopeObject.prototype.hasLoopRedirects = function(){
	return this.loopRedirects.length > 0;
};

ScopeObject.prototype.getContinueLabel = function(){
	if(this.hasLoopRedirects()) return this.loopRedirects.slice(-1)['continue'];
	return undefined;
};

ScopeObject.prototype.getBreakLabel = function(){
	if(this.hasLoopRedirects()) return this.loopRedirects.slice(-1)['break'];
	return undefined;
};







module.exports = ScopeObject;