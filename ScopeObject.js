var Variable = require('./Variable');
var NamingObject = require('./NamingObject');
var FuncVar = require('./FuncVar');
var StructVar = require('./StructVar');

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
	this.currentFunc = [];
	this.namingObject = new NamingObject();
	this.structs = [];
};

//returns a string representation of this object
ScopeObject.prototype.toString = function(){
	var st = 'DVARS:\n';
	var f1 = function(x){ st += x.toString() + '\n'; };
	this.getDVariables().forEach(f1);
	st += 'VARIABLES:\n';
	this.getVariables().forEach(f1);
	st += 'STRUCTS:\n';
	this.structs.forEach(f1);
	st += 'CODE:\n';
	this.getAssembly().forEach(f1);
	st += 'FUNCTIONS:\n';
	this.funcs.forEach(f1);
	return st;
};
ScopeObject.prototype.getVariables = function(){return this.variables[this.variables.length-1];};
ScopeObject.prototype.getDVariables = function(){return this.dvariables[this.dvariables.length-1];};
ScopeObject.prototype.getScope = function(){return this.scope[this.scope.length-1];};

//returns the most recent current function on the stack
ScopeObject.prototype.getCurrentFunction = function(){ return this.currentFunc[this.currentFunc.length-1]; };
//adds another function to the end of the list
ScopeObject.prototype.pushFunction = function(x){this.currentFunc.push(x);};
//pops the current function and returns it
ScopeObject.prototype.popFunction = function(){return this.currentFunc.pop();};

//gets the current assembly code
ScopeObject.prototype.getAssembly = function(){return this.assembly[this.assembly.length-1];};
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
//adds a list of assembly instructions to the current list of assembly instructions
ScopeObject.prototype.addAssemblyList = function(l){
	if(l === undefined) return;
	for(var i = 0; i < l.length; i++)
		this.getAssembly().push(l[i]);
};

//checks if there is some similar data for which we can use rather than storing the same constant on the stack
ScopeObject.prototype.getDataVariable = function(a){
	for(var sind = this.dvariables.length-1; sind >= 0; sind--){
		var vars = this.dvariables[sind];
		for(var i = 0; i < vars.length; i++){
			var b = vars[i];
			if(a.dtype == b.dtype && a.type == b.type && a.value == b.value) return b;
		}
	}
	return undefined;
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
	var possibleReuse = this.getDataVariable(rv);
	if(possibleReuse !== undefined) return possibleReuse;
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


//returns a default value given a dtype
ScopeObject.prototype.defaultTypeValue = function(dtype){
	if(dtype == 'int') return 0;
	else if(dtype == 'char') return '\0';
	else if(dtype == 'float' || dtype == 'double') return 0.0;
	else if(dtype == 'string') return '\0';
	return 0;
};

//generates a list of count number of dtype types
//default values are used if count > someValues.length
//someValues defaults to [], if count === -1 then someValues are returned 
ScopeObject.prototype.generateArray = function(dtype, count, someValues){
	if(someValues === undefined) someValues = [];
	if(count === -1) count = someValues.length;
	if(someValues.length > count) this.error('warning, attempting too many array values');
	var _def = this.defaultTypeValue(dtype);
	var rv = Array.apply(undefined, Array(count)).map(function(){return _def;});
	for(var i = 0; i < someValues.length; i++) rv[i] = someValues[i];
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
	if(this.variableExistsInScope(rv)!==undefined) this.error('Error, variable: ' + name + ' was previously defined');
	this.getVariables().push(rv);
	return rv;
};

//checks whether a function is already defined
ScopeObject.prototype.funcExists = function(f){
	for(var i = 0; i < this.funcs.length; i++) if(f.eq(this.funcs[i])) return this.funcs[i];
	return undefined;
};

//creates and returns a new func variable
ScopeObject.prototype.newFuncVar = function(name, returnType, argumentDTypes){
	var func = new FuncVar(name, returnType, argumentDTypes, this.namingObject.newId());
	var oldFunc = this.funcExists(func);
	if(oldFunc !== undefined){
		if(!oldFunc.hasDefinition()) return oldFunc;
		else this.error('warning function: ' + name + ' was already defined');
	}
	this.funcs.push(func);
	var v = new Variable(func.name, func.dtype(), this.getScope(), 'function', undefined, this.namingObject.newId());
	this.getVariables().push(v);
	return func;
};

//checks if a variable exists in the current scope
ScopeObject.prototype.variableExistsInScope = function(v, vars){
	if(vars === undefined) vars = this.getVariables();
	for(var i = 0; i < vars.length; i++) if(vars[i].eq(v)) return vars[i];
	return undefined;
};



//checks if a variable exists in some scope
ScopeObject.prototype.variableExists = function(v, vars){
	for(var i = 0; i < vars.length; i++) if(vars[i].eqStack(v) || (vars[i].name == v.name && vars[i].type == 'function'))
		return vars[i];
	return undefined;
};


//tries to get a variable out of the scope
//tries to get a variable on the stack or a global one
ScopeObject.prototype.getDefinedVariable = function(v){
	for(var i = this.variables.length-1; i >= 0; i--){
		var v2 = this.variableExists(v, this.variables[i]);
		if(v2 !== undefined) return v2;
	}
	return undefined;
};

ScopeObject.prototype.getMatchingFunction = function(e1, fargs){
	var inputSn = e1.name + '(' + fargs.map(function(x){return x.dtype}).join(',') + ')';
	for(var i = 0; i < this.funcs.length; i++){
		var f = this.funcs[i];
		var sn = f.scopeName();
		if(sn === inputSn) return f;
	}
	return undefined;
};


//force convert a variable to a type
ScopeObject.prototype.convertToType = function(inp, type){
	if(type == 'void' || inp.dtype == 'void') this.error('cannot work with type void');
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

//pushes continue and break statements to the stack
ScopeObject.prototype.pushContinueBreak = function(cont, brea){
	this.loopRedirects.push({'continue':cont, 'break':brea});
};

//removes current continue and break statements and returns them
ScopeObject.prototype.popContinueBreak = function(){
	return this.loopRedirects.pop();
};

//checks if there are places to goto with break and continue
ScopeObject.prototype.hasLoopRedirects = function(){
	return this.loopRedirects.length > 0;
};

//gets the current continue label
ScopeObject.prototype.getContinueLabel = function(){
	if(this.hasLoopRedirects()) return this.loopRedirects[this.loopRedirects.length-1]['continue'];
	return undefined;
};

//gets the current break label
ScopeObject.prototype.getBreakLabel = function(){
	if(this.hasLoopRedirects()) return this.loopRedirects[this.loopRedirects.length-1]['break'];
	return undefined;
};

//add a new scope
ScopeObject.prototype.pushScope = function(sname){
	if(sname === undefined) this.scope.push(this.getScope() + this.namingObject.newId());
	else this.scope.push(sname);
};

//pop and remove the current scope
ScopeObject.prototype.popScope = function(){ return this.scope.pop(); };

//newLabel
ScopeObject.prototype.newLabel = function(){return this.namingObject.newTmpLabel();};


//returns the size of dtype in bytes:
ScopeObject.prototype.sizeOf = function(dtype){
	if(StructVar.isPtrType(dtype)) return 4;
	if(dtype.indexOf('struct') !== -1){
		var name = dtype.split(' ').pop();
		var st = this.structByName(name);
		if(st === undefined) this.error('no struct named: ' + name);
		return st.size;
	}
	var ind = 'int,double,char,unsigned int,unsigned char,short'.split(',').indexOf(dtype);
	if(ind == -1) return undefined;
	return [4,8,1,4,1,2][ind];
};

ScopeObject.prototype.structByName = function(name){
	for(var i = 0; i < this.structs.length; i++) if(name == this.structs[i].name) return this.structs[i];
	return undefined;
};


ScopeObject.prototype.newStruct = function(n){
	var rv = new StructVar(n);
	//check if struct already exists
	var st = this.structByName(n);
	if(st !== undefined) this.error('struct ' + n + ' has already been defined');
	this.structs.push(rv);
	return rv;
};

module.exports = ScopeObject;