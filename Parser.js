var Variable = require('./Variable');
var NamingObject = require('./NamingObject');
var assert = require('assert');

//the parser object
function Parser(lexiList){
	this.l = lexiList;
	this.variables = [];
	this.dvariables = [];
	this.assembly = [];
	this.no = new NamingObject;
	this.scope = 'global';
	this.continueLabel = undefined;
	this.breakLabel = undefined;
}

//a function to print out the lexicons in order
Parser.prototype.printLexicons = function(){
	this.l.forEach(function(l){
		console.log(l.toString());
	});
};

Parser.prototype.addAssembly = function(){
	if(arguments.length == 0) return;
	var st = []; for(var i = 0; i < arguments.length; i++) st.push(arguments[i]);
	this.assembly.push(st.join(' '));
};

Parser.prototype.toString = function(){
	var st = 'DVARS:\n';
	var f1 = function(x){ st += x.toString() + '\n'; };
	this.dvariables.forEach(f1);
	st += 'VARIABLES:\n';
	this.variables.forEach(f1);
	st += 'CODE:\n';
	this.assembly.forEach(function(x){st += x + '\n'; });
	return st;
};

Parser.prototype.top = function(index){
	index = (index === undefined)? 0 : index;
	if(index >= this.l.length) return undefined;
	return this.l[index];
};


Parser.prototype.pop = function(){
	if(this.l.length == 0) return undefined;
	var rv = this.l[0];
	this.l.shift();
	return rv;
};

Parser.prototype.getDefinedVariable = function(v){
	for(var i = 0; i < this.variables.length; i++) if(this.variables[i].eq(v)) return i;
	for(var i = 0; i < this.variables.length; i++) if(this.variables[i].eqGlobal(v)) return i;
	return -1;
};

Parser.prototype.variableExistsInScope = function(v){
	for(var i = 0; i < this.variables.length; i++) if(this.variables[i].eq(v)) return i;
	return -1;
};


Parser.prototype.error = function(str){
	console.log('error' + str);
	assert(false, 'cool');
};

Parser.prototype.matchType = function(type){
	if(this.top() === undefined) this.error('error matching');
	if(this.top().type != type){
		this.error('error matching');
	}
	return this.pop();
};

Parser.prototype.checkType = function(type, index){
	if(this.top(index) === undefined) return false;
	if(this.top(index).type != type){
		return false;
	}
	return true;
};

Parser.prototype.multiStmt = function(){
	while(this.stmt()) ;
};

Parser.prototype.stmt = function(){
	if(this.top() == undefined) return false;
	if(this.top().type == '}') return false;
	if(this.top().type == 'TYPE'){
		this.initializer();
		this.matchType(';');
		return true;
	}else if(('int,double,float,char,string,short,hex,name,-,!,&,*,('.split(',')).indexOf(this.top().type) != -1){
		this.rhs();
		this.moreRHS();
		this.matchType(';');
		return true;
	}else if(this.top().type == ';') return true;
	else if(this.top().type == 'if'){
		this.ifStmt();
		return true;
	}else if(this.top().type == '{'){
		this.matchType('{');
		var oldScope = this.scope;
		this.scope += this.no.newTmpName();
		this.addAssembly('pushScope', this.scope);
		this.multiStmt();
		this.matchType('}');
		this.scope = oldScope;
		this.addAssembly('popScope', this.scope);
		return true;
	}else if(this.top().type == 'for'){
		this.forStmt();
		return true;
	}else if(this.checkType('break')){
		if(this.breakLabel === undefined) this.error('warning, using break statement in incorrect spot');
		this.pop();
		this.matchType(';');
		this.addAssembly('goto', this.breakLabel);
		return true;
	}else if(this.checkType('continue')){
		if(this.breakLabel === undefined) this.error('warning, using continue statement in incorrect spot');
		this.pop();
		this.matchType(';');
		this.addAssembly('goto', this.continueLabel);
		return true;
	}else if(this.checkType('while')){
		this.whileStmt();
		return true;
	}
	return false;
};

Parser.prototype.whileStmt = function(){
	this.matchType('while');
	var testLabel = this.no.newTmpLabel();
	var whileStartLabel = this.no.newTmpLabel();
	var endLabel = this.no.newTmpLabel();

	this.matchType('(');
	var oldAssembly = this.assembly;
	this.assembly = [];
	var a = this.rhs();
	this.matchType(')');
	var aAssembly = this.assembly;
	this.assembly = oldAssembly;
	var oldBreak = this.breakLabel;
	var oldContinue = this.continueLabel;

	this.continueLabel = testLabel;
	this.breakLabel = endLabel;

	this.addAssembly('goto', testLabel);
	this.addAssembly('label', whileStartLabel);
	this.stmt();
	this.continueLabel = oldContinue;
	this.breakLabel = oldBreak;

	this.addAssembly('label', testLabel);
	Array.prototype.push.apply(this.assembly, aAssembly);
	this.addAssembly('ifngoto', a.name, endLabel);
	this.addAssembly('goto', whileStartLabel);
	this.addAssembly('label', endLabel);
};

Parser.prototype.forStmt = function(){
	this.pop(); //pop for
	this.matchType('(');
	var forLoopStart = this.no.newTmpLabel();
	var a = undefined, b = undefined, c = undefined;
	if(!this.checkType(';')){
		a = this.rhsMore();
	}

	this.addAssembly('label', forLoopStart);
	this.matchType(';');
	var oldAssembly = this.assembly;
	this.assembly = [];
	if(!this.checkType(';')){
		b = this.rhs();
	}
	this.matchType(';');
	var BAssembly = this.assembly;
	this.assembly = [];
	
	if(!this.checkType(')')){
		c = this.rhsMore();
	}
	var CAssembly = this.assembly;
	this.assembly = oldAssembly;
	this.matchType(')');
	
	var oldBreakLabel = this.breakLabel;
	var oldContinueLabel = this.continueLabel;
	this.continueLabel = this.no.newTmpLabel();
	this.breakLabel = this.no.newTmpLabel();

	if(!this.stmt()) this.error('error in stmt() in for loop!'); //got d
	
	this.addAssembly('label', this.continueLabel);

	Array.prototype.push.apply(this.assembly, CAssembly);

	Array.prototype.push.apply(this.assembly, BAssembly);
	if(b !== undefined) this.addAssembly('ifgoto', b.name, forLoopStart);
	else this.addAssembly('goto', forLoopStart);
	this.addAssembly('label', this.breakLabel);

	this.breakLabel = oldBreakLabel;
	this.continueLabel = oldContinueLabel;
};

Parser.prototype.ifStmt = function(){
	this.matchType('if');
	this.matchType('(');
	var e1 = this.rhs();
	this.matchType(')');
	var endLabel = this.no.newTmpLabel();
	var l1 = this.no.newTmpLabel();

	this.addAssembly('ifngoto', e1.name, l1);
	if(!this.stmt()) this.error('error in if statement');
	this.addAssembly('goto', endLabel);
	this.addAssembly('label', l1);

	this.moreIf(endLabel);
};

Parser.prototype.moreIf = function(endLabel){
	if(this.top() === undefined) return this.addAssembly('label', endLabel);	
	if(this.top().type == 'else'){
		this.pop();
		if(this.top().type == 'if'){
			this.pop();
			this.matchType('(');
			var e1 = this.rhs();
			this.matchType(')');
			var l1 = this.no.newTmpLabel();
			this.addAssembly('ifngoto', e1.name, l1);
			if(!this.stmt()) this.error('error in else statement');
			this.addAssembly('goto', endLabel);
			this.addAssembly('label', l1);
			this.moreIf(endLabel);
		}else{
			if(!this.stmt()) this.error('error in else statement');
			this.addAssembly('label', endLabel);	
		}
	}else this.addAssembly('label', endLabel);

};

Parser.prototype.moreRHS = function(){
	if(this.top().type == ','){
		this.pop();
		this.rhs();
		this.moreRHS();
	}
};

Parser.prototype.initializer = function(){
	var t = this.top();
	if(t.type != 'TYPE') return;
	this.pop();
	this.moreInitializers(t);
};

Parser.prototype.moreInitializers = function(t){
	var variLex = this.matchType('name');
	var vari;
	if(this.top().type == '['){
		this.pop();
		var i = this.matchType('int');
		var constant = this.newBytesVar('int', Number(i.str));
		vari = this.newUserVar(variLex.str, t.str+'*', variLex.locations);
		this.matchType(']');
		this.addAssembly('=',vari.name,constant.name);
	}else
		vari = this.newUserVar(variLex.str, t.str, variLex.locations);

	if(this.checkType('=')){
		this.pop();
		var rh = this.rhs();
		var bestType = vari.dtype;
		rh = this.convertToTypeIfNeccecary(rh, bestType);
		this.assembly.push('= ' + vari.name + ' ' + rh.name);
	}
	if(this.checkType(',')){
		this.pop();
		this.moreInitializers(t);
	}
};

Parser.prototype.rhs = function(){
	return this.assignment();
};

Parser.prototype.rhsMore = function(){
	this.assignment();
	this.moreRHS();
};


Parser.prototype.assignment = function(){
	var e1 = this.ternary();
	return this.moreFunctionAssignment(e1, '=,*=,/=,%=,+=,-=,<<=,>>=,&=,|=,^='.split(','), 'ternary');
};

Parser.prototype.ternary = function(){
	var e1 = this.logic();
	if(this.checkType('?')){
		var lex = this.pop();
		var l1 = this.no.newTmpLabel();
		var l2 = this.no.newTmpLabel();
		var oldAssembly = this.assembly;
		this.assembly = [];
		var e2 = this.logic();
		var e2Assembly = this.assembly;
		this.matchType(':');
		this.assembly = [];
		var e3 = this.logic();
		var e3Assembly = this.assembly;
		this.assembly = oldAssembly;

		var bestType = this.no.typeResolution(e2.dtype, e3.dtype);
		e2 = this.convertToTypeIfNeccecary(e2, bestType);
		e3 = this.convertToTypeIfNeccecary(e3, bestType);
		var vari = this.newTmpVar(bestType, lex.locations);
		
		this.addAssembly('gotoifn', e1.name, l1);
		//add e2's assembly first
		Array.prototype.push.apply(this.assembly, e2Assembly);
		this.addAssembly('=', vari.name, e2.name);
		this.addAssembly('goto', l2);
		this.addAssembly('label', l1);
		Array.prototype.push.apply(this.assembly, e3Assembly);
		this.addAssembly('=', vari.name, e3.name);
		this.addAssembly('label', l2);

	}
	return e1;
};

Parser.prototype.logic = function(){
	var e1 = this.bitwise();
	return this.moreFunction(e1, ['&&', '||'], 'bitwise');
};

Parser.prototype.bitwise = function(){
	var e1 = this.comparators();
	return this.moreFunction(e1, ['&', '^', '|'], 'comparators');
};

Parser.prototype.comparators = function(){
	var e1 = this.comparators2();
	return this.moreFunction(e1, ['==', '!='], 'comparators2');//this.moreComparators(e1);
};

Parser.prototype.comparators2 = function(){
	var e1 = this.shifters();
	return this.moreFunction(e1, ['<', '>', '<=', '>='], 'shifters');
};

Parser.prototype.shifters = function(){
	var e1 = this.adders();
	return this.moreFunction(e1, ['<<', '>>'], 'adders');
};

Parser.prototype.adders = function(){
	var e1 = this.factors();
	return this.moreFunction(e1, ['+', '-'], 'factors');
};

Parser.prototype.factors = function(){
	var e1 = this.preElement();
	return this.moreFunction(e1, ['*', '/', '%'], 'preElement');
};

Parser.prototype.preElement = function(){
	//handles: ! (typeconversion) ~ -
	var e = this.top();
	if(this.checkType('-')){
		var lex = this.pop();
		var rv = this.element();
		var vari = this.newTmpVar(rv.dtype, lex.locations);
		this.addAssembly('invert', vari.name, rv.name);
		return vari;
	}else if(this.checkType('!')){
		var lex = this.pop();
		var rv = this.element();
		var vari = this.newTmpVar(rv.dtype, lex.locations);
		this.addAssembly('!', vari.name, rv.name);
		return vari;
	}else if(this.checkType('&')){
		var lex = this.pop();
		var rv = this.element();
		var vari = this.newTmpVar(rv.dtype+'*', lex.locations);
		this.addAssembly('ref', vari.name, rv.name);
		return vari;
	}else if(this.checkType('*')){
		var lex = this.pop();
		var rv = this.element();
		if(rv.type != 'user' && !rv.isPtr()) this.error('illegal de-reference of a variable');
		var vari = this.newRefVar(rv.dtype, lex.locations);
		vari.dref();
		this.addAssembly('deref', vari.name, rv.name);
		return vari;
	}else if(this.checkType('~')){
		var lex = this.pop();
		var rv = this.element();
		var vari = this.newTmpVar(rv.dtype, lex.locations);
		this.addAssembly('~', vari.name, rv.name);
		return vari;
	}else if(this.checkType('(') && this.checkType('TYPE', 1)){
		this.pop();
		var type = this.matchType('TYPE');
		this.matchType(')');
		var rv = this.element();
		return this.convertToType(rv, type.str);
	}else{
		return this.element();
	}
};


Parser.prototype.element = function(){
	var e = this.pop();
	var types = 'int,double,float,char,string,short,hex'.split(',');
	if(types.indexOf(e.type) != -1)
		return this.newDataVar(e.type, e.str, e.locations);
	else if(e.type == 'name')
		return this.postNamedVariable(this.existingVariable(e));
	else if(e.type == '('){
		var rv = this.rhs();
		this.matchType(')');
		return rv;
	}
	this.error('error in element()');
};

Parser.prototype.existingVariable = function(e){
	if(e === undefined) e = this.matchType('name');
	var vari = new Variable(e.str, undefined, this.scope, 'user', undefined, undefined);
	var index = this.getDefinedVariable(vari);
	if(index == -1) this.error(' variable ' + vari.name + ' is not defined but is referenced');
	return this.variables[index];
};

Parser.prototype.postNamedVariable = function(e1){
	var e = this.top();
	if(e.type == '['){
		this.matchType('[');
		var e2 = this.rhs();
		this.matchType(']');
		var bt = this.possibleTypeConversion(e1, e2);
		var vari = this.newTmpVar(bt.bestType, e.locations);
		this.addAssembly('+',vari.name,bt.e1.name, bt.e2.name);
		var vari2 = this.newRefVar(vari.dtype, e.locations);
		vari2.dref();
		this.addAssembly('deref', vari2.name, vari.name);
		return vari2;
	}else if(e.type == '++' || e.type == '--'){
		this.matchType(e.type);
		if(e1.dtype != 'int' && !e1.isPtr())
			this.error('warning, attempting to increment a non integer type / non pointer type');
		var e2 = this.newTmpVar(e1.dtype, e.locations);
		this.addAssembly('=', e2.name, e1.name);
		this.addAssembly(e.type, e1.name);
		return e2;
	}
	return e1;
};

Parser.prototype.moreFunction = function(e1, ops, nextFunction){
	for(var i = 0; i < ops.length; i++){
		var op = ops[i];
		if(this.checkType(op)){
			var lex = this.pop();
			var e2 = this[nextFunction]();
			var bt = this.possibleTypeConversion(e1, e2);
			var vari = this.newTmpVar(bt.bestType, lex.locations);
			this.addAssembly(op, vari.name, bt.e1.name, bt.e2.name);
			return this.moreFunction(vari, ops, nextFunction);
		}
	}
	return e1;	
};

Parser.prototype.moreFunctionAssignment = function(e1, ops, nextFunction){
	for(var i = 0; i < ops.length; i++){
		var op = ops[i];
		if(this.checkType(op)){
			if(e1.type != 'user' && e1.type != 'ref') this.error('error, assigning to a non variable');
			var lex = this.pop();
			var e2 = this[nextFunction]();
			var bt = this.possibleTypeConversion(e1, e2);
			var vari = this.newTmpVar(bt.bestType, lex.locations);
			this.addAssembly(op, vari.name, bt.e1.name, bt.e2.name);
			return this.moreFunction(vari, ops, nextFunction);
		}
	}
	return e1;	
};




Parser.prototype.convertToType = function(inp, type){
	var name = this.no.newTmpName();
	var vari = new Variable(name, type, 'tmp', this.no.scope, undefined, 1);
	this.variables.push(vari);
	this.assembly.push('convertTo ' + type + ' from ' + inp.dtype + ' ' + vari.name + ' ' + inp.name);
	return vari;
};

Parser.prototype.possibleTypeConversion = function(e1, e2){
	var bestType = e1.bestConversion(e2);
	if(bestType === undefined) this.error('Warning: Cannot convert ' + e1.dtype + ' and ' +
		e2.dtype + ' to common type');
	return {
		"bestType": bestType,
		"e1": this.convertToTypeIfNeccecary(e1, bestType),
		"e2": this.convertToTypeIfNeccecary(e2, bestType)
	};
};

Parser.prototype.convertToTypeIfNeccecary = function(inp, type){
	if(inp.dtype != type) return this.convertToType(inp, type);
	return inp;
};

Parser.prototype.newTmpVar = function(dtype, loc){
	var rv = new Variable(this.no.newTmpName(), dtype, this.scope, 'tmp', undefined, loc);
	this.variables.push(rv);
	return rv;
};

Parser.prototype.newDataVar = function(dtype, value, loc){
	var rv = new Variable(this.no.newTmpName(), dtype, this.scope, 'data', value, loc);
	this.variables.push(rv);
	return rv;
};

Parser.prototype.newBytesVar = function(dtype, value, loc){
	var rv = new Variable(this.no.newTmpName(), dtype, this.scope, 'bytes', value, loc);
	this.variables.push(rv);
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


module.exports = Parser;