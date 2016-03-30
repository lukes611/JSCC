var Variable = require('./Variable');
var NamingObject = require('./NamingObject');
var assert = require('assert');

//the parser object
function Parser(lexiList){
	this.l = lexiList;
	this.variables = [];
	this.assembly = [];
	this.no = new NamingObject;
}

//a function to print out the lexicons in order
Parser.prototype.printLexicons = function(){
	this.l.forEach(function(l){
		console.log(l.toString());
	});
};

Parser.prototype.toString = function(){
	var st = 'VARIABLES:\n';
	this.variables.forEach(function(x){st += x.toString() + '\n';});
	st += 'CODE:\n';
	this.assembly.forEach(function(x){st += x + '\n'; });
	return st;
};

Parser.prototype.top = function(){
	if(this.l.length == 0) return undefined;
	return this.l[0];
};

Parser.prototype.pop = function(){
	if(this.l.length == 0) return undefined;
	var rv = this.l[0];
	this.l.shift();
	return rv;
};

Parser.prototype.variableDefined = function(v){
	for(var i = 0; i < this.variables.length; i++) if(this.variables[i].eq(v)) return true;
	return false;
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

Parser.prototype.checkType = function(type){
	if(this.top() === undefined) return false;
	if(this.top().type != type){
		return false;
	}
	return true;
};

Parser.prototype.stmt = function(){
	if(this.top() == undefined) return false;
	if(this.top().type == 'TYPE'){
		this.initializer();
		this.matchType(';');
		return true;
	}else if(('int,double,float,char,string,short,hex,name,-,!'.split(',')).indexOf(this.top().type) != -1){
		this.rhs();
		this.matchType(';');
		return true;
	}else if(this.top().type == ';') return true;
	return false;
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
		var name = this.no.newTmpName();
		var constant = new Variable(name, t.str, 'constant', this.no.scope, undefined, Number(i.str), variLex.locations);
		vari = new Variable(variLex.str, t.str+'*', 'user', this.no.scope, undefined, 1, variLex.locations);
		this.matchType(']');
		this.assembly.push('= ' + vari.name + ' ' + constant.name);
		this.variables.push(constant);
	}else
		vari = new Variable(variLex.str, t.str, 'user', this.no.scope, undefined, 1, variLex.locations);
	if(this.variableDefined(vari)){
		this.error('error on line: ' + variLex.locations[1].line + ', variable name ' + vari.name + ' was already defined');
	}
	this.variables.push(vari);
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
	return this.ternary();
};

Parser.prototype.ternary = function(){
	var e1 = this.logic();
	if(this.checkType('?')){
		this.pop();
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

		var name = this.no.newTmpName();
		var bestType = this.no.typeResolution(e2.dtype, e3.dtype);
		e2 = this.convertToTypeIfNeccecary(e2, bestType);
		e3 = this.convertToTypeIfNeccecary(e3, bestType);
		var vari = new Variable(name, bestType, 'tmp', this.no.scope, undefined, 1);
		this.variables.push(vari);
		

		this.assembly.push('gotoifn ' + e1.name + ' ' + l1);
		//add e2's assembly first
		Array.prototype.push.apply(this.assembly, e2Assembly);
		this.assembly.push('= ' + vari.name + ' ' + e2.name);
		this.assembly.push('goto ' + l2);
		this.assembly.push('label ' + l1);
		Array.prototype.push.apply(this.assembly, e3Assembly);
		this.assembly.push('= ' + vari.name + ' ' + e3.name);
		this.assembly.push('label ' + l2);

	}
	return e1;
};

Parser.prototype.logic = function(){
	var e1 = this.bitwise();
	return this.moreLogic(e1);
};

Parser.prototype.moreLogic = function(e1){
	var ops = ['&&', '||'];
	for(var i = 0; i < ops.length; i++){
		var op = ops[i];
		if(this.checkType(op)){
			this.pop();
			var e2 = this.bitwise();
			var name = this.no.newTmpName();
			var bestType = this.no.typeResolution(e1.dtype, e2.dtype);
			e1 = this.convertToTypeIfNeccecary(e1, bestType);
			e2 = this.convertToTypeIfNeccecary(e2, bestType);
			var vari = new Variable(name, bestType, 'tmp', this.no.scope, undefined, 1);
			this.variables.push(vari);
			this.assembly.push(op + ' ' + vari.name + ' ' + e1.name + ' ' + e2.name);
			return this.moreLogic(vari);
		}
	}
	return e1;
};


Parser.prototype.bitwise = function(){
	var e1 = this.comparators();
	return this.moreBitwise(e1);
};

Parser.prototype.moreBitwise = function(e1){
	var ops = ['&', '^', '|'];
	for(var i = 0; i < ops.length; i++){
		var op = ops[i];
		if(this.checkType(op)){
			this.pop();
			var e2 = this.comparators();
			var name = this.no.newTmpName();
			var bestType = this.no.typeResolution(e1.dtype, e2.dtype);
			e1 = this.convertToTypeIfNeccecary(e1, bestType);
			e2 = this.convertToTypeIfNeccecary(e2, bestType);
			var vari = new Variable(name, bestType, 'tmp', this.no.scope, undefined, 1);
			this.variables.push(vari);
			this.assembly.push(op + ' ' + vari.name + ' ' + e1.name + ' ' + e2.name);
			return this.moreBitwise(vari);
		}
	}
	return e1;
};


Parser.prototype.comparators = function(){
	var e1 = this.comparators2();
	return this.moreComparators(e1);
};

Parser.prototype.moreComparators = function(e1){
	var ops = ['==', '!='];
	for(var i = 0; i < ops.length; i++){
		var op = ops[i];
		if(this.checkType(op)){
			this.pop();
			var e2 = this.comparators2();
			var name = this.no.newTmpName();
			var bestType = this.no.typeResolution(e1.dtype, e2.dtype);
			e1 = this.convertToTypeIfNeccecary(e1, bestType);
			e2 = this.convertToTypeIfNeccecary(e2, bestType);
			var vari = new Variable(name, bestType, 'tmp', this.no.scope, undefined, 1);
			this.variables.push(vari);
			this.assembly.push(op + ' ' + vari.name + ' ' + e1.name + ' ' + e2.name);
			return this.moreComparators(vari);
		}
	}
	return e1;
};


Parser.prototype.comparators2 = function(){
	var e1 = this.shifters();
	return this.moreComparators2(e1);
};

Parser.prototype.moreComparators2 = function(e1){
	var ops = ['<', '>', '<=', '>='];
	for(var i = 0; i < ops.length; i++){
		var op = ops[i];
		if(this.checkType(op)){
			this.pop();
			var e2 = this.shifters();
			var name = this.no.newTmpName();
			var bestType = this.no.typeResolution(e1.dtype, e2.dtype);
			e1 = this.convertToTypeIfNeccecary(e1, bestType);
			e2 = this.convertToTypeIfNeccecary(e2, bestType);
			var vari = new Variable(name, bestType, 'tmp', this.no.scope, undefined, 1);
			this.variables.push(vari);
			this.assembly.push(op + ' ' + vari.name + ' ' + e1.name + ' ' + e2.name);
			return this.moreComparators2(vari);
		}
	}
	return e1;
};

Parser.prototype.shifters = function(){
	var e1 = this.adders();
	return this.moreShifters(e1);
};

Parser.prototype.moreShifters = function(e1){
	var ops = ['<<', '>>'];
	for(var i = 0; i < ops.length; i++){
		var op = ops[i];
		if(this.checkType(op)){
			this.pop();
			var e2 = this.adders();
			var name = this.no.newTmpName();
			var bestType = this.no.typeResolution(e1.dtype, e2.dtype);
			e1 = this.convertToTypeIfNeccecary(e1, bestType);
			e2 = this.convertToTypeIfNeccecary(e2, bestType);
			var vari = new Variable(name, bestType, 'tmp', this.no.scope, undefined, 1);
			this.variables.push(vari);
			this.assembly.push(op + ' ' + vari.name + ' ' + e1.name + ' ' + e2.name);
			return this.moreShifters(vari);
		}
	}
	return e1;
};

Parser.prototype.adders = function(){
	var e1 = this.factors();
	return this.moreAdders(e1);
};

Parser.prototype.moreAdders = function(e1){
	var ops = ['+', '-'];
	for(var i = 0; i < ops.length; i++){
		var op = ops[i];
		if(this.checkType(op)){
			this.pop();
			var e2 = this.factors();
			var name = this.no.newTmpName();
			var bestType = this.no.typeResolution(e1.dtype, e2.dtype);
			e1 = this.convertToTypeIfNeccecary(e1, bestType);
			e2 = this.convertToTypeIfNeccecary(e2, bestType);
			var vari = new Variable(name, bestType, 'tmp', this.no.scope, undefined, 1);
			this.variables.push(vari);
			this.assembly.push(op + ' ' + vari.name + ' ' + e1.name + ' ' + e2.name);
			return this.moreAdders(vari);
		}
	}
	return e1;
};

Parser.prototype.factors = function(){
	var e1 = this.preElement();
	return this.moreFactors(e1);
};

Parser.prototype.moreFactors = function(e1){
	var ops = ['*', '/', '%'];
	for(var i = 0; i < ops.length; i++){
		var op = ops[i];
		if(this.checkType(op)){
			this.pop();
			var e2 = this.preElement();
			var name = this.no.newTmpName();
			var bestType = this.no.typeResolution(e1.dtype, e2.dtype);
			e1 = this.convertToTypeIfNeccecary(e1, bestType);
			e2 = this.convertToTypeIfNeccecary(e2, bestType);
			var vari = new Variable(name, bestType, 'tmp', this.no.scope, undefined, 1);
			this.variables.push(vari);
			this.assembly.push(op + ' ' + vari.name + ' ' + e1.name + ' ' + e2.name);
			return this.moreFactors(vari);
		}
	}
	return e1;
};



Parser.prototype.preElement = function(){
	//handles: ! (typeconversion) ~ -
	var e = this.top();
	if(this.checkType('-')){
		this.pop();
		var rv = this.element();
		var name = this.no.newTmpName();
		var vari = new Variable(name, rv.dtype, 'tmp', this.no.scope, undefined, 1);
		this.variables.push(vari);
		this.assembly.push('invert ' + vari.name + ' ' + rv.name);
		return vari;
	}else if(this.checkType('!')){
		this.pop();
		var rv = this.element();
		var name = this.no.newTmpName();
		var vari = new Variable(name, rv.dtype, 'tmp', this.no.scope, undefined, 1);
		this.variables.push(vari);
		this.assembly.push('! ' + vari.name + ' ' + rv.name);
		return vari;
	}else if(this.checkType('&')){
		//to do
	}else if(this.checkType('~')){
		this.pop();
		var rv = this.element();
		var name = this.no.newTmpName();
		var vari = new Variable(name, rv.dtype, 'tmp', this.no.scope, undefined, 1);
		this.variables.push(vari);
		this.assembly.push('~ ' + vari.name + ' ' + rv.name);
		return vari;
	}else if(this.checkType('(')){
		this.pop();
		var type = this.matchType('TYPE');
		this.matchType(')');
		var rv = this.element();
		return this.convertToType(rv, type.str);
	}else{
		return this.element();
	}
};

Parser.prototype.convertToType = function(inp, type){
	var name = this.no.newTmpName();
	var vari = new Variable(name, type, 'tmp', this.no.scope, undefined, 1);
	this.variables.push(vari);
	this.assembly.push('convertTo ' + type + ' from ' + inp.dtype + ' ' + vari.name + ' ' + inp.name);
	return vari;
};

Parser.prototype.convertToTypeIfNeccecary = function(inp, type){
	if(inp.dtype != type) return this.convertToType(inp, type);
	return inp;
};

Parser.prototype.element = function(){
	var e = this.pop();
	var types = 'int,double,float,char,string,short,hex'.split(',');
	if(types.indexOf(e.type) != -1){
		var name = this.no.newTmpName();
		var vari = new Variable(name, e.type, 'constant', this.no.scope, e.str, 1, e.locations);
		this.variables.push(vari);
		return vari;
	}else if(e.type == 'name'){
		return this.names(e);
	}
};

Parser.prototype.names = function(e){
	var vari = new Variable(e.str, undefined, 'user', this.no.scope, undefined, 1, e.locations);
	if(!this.variableDefined(vari)) this.error(' variable ' + vari.name + ' is not defined but is referenced');
	for(var i = 0; i < this.variables.length; i++){
		if(this.variables[i].eq(vari)) return this.variables[i];
	}
	this.error(' variable ' + vari.name + ' is not defined but is referenced');
};



module.exports = Parser;