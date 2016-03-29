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
		var vari = new Variable(name, bestType, 'tmp', this.no.scope);
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
			var vari = new Variable(name, bestType, 'tmp', this.no.scope);
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
			var vari = new Variable(name, bestType, 'tmp', this.no.scope);
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
			var vari = new Variable(name, bestType, 'tmp', this.no.scope);
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
			var vari = new Variable(name, bestType, 'tmp', this.no.scope);
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
			var vari = new Variable(name, bestType, 'tmp', this.no.scope);
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
			var vari = new Variable(name, bestType, 'tmp', this.no.scope);
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
			var vari = new Variable(name, bestType, 'tmp', this.no.scope);
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
		var vari = new Variable(name, rv.dtype, 'tmp', this.no.scope);
		this.variables.push(vari);
		this.assembly.push('invert ' + vari.name + ' ' + rv.name);
		return vari;
	}else if(this.checkType('!')){
		this.pop();
		var rv = this.element();
		var name = this.no.newTmpName();
		var vari = new Variable(name, rv.dtype, 'tmp', this.no.scope);
		this.variables.push(vari);
		this.assembly.push('! ' + vari.name + ' ' + rv.name);
		return vari;
	}else if(this.checkType('&')){
		//to do
	}else if(this.checkType('~')){
		this.pop();
		var rv = this.element();
		var name = this.no.newTmpName();
		var vari = new Variable(name, rv.dtype, 'tmp', this.no.scope);
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
	var vari = new Variable(name, type, 'tmp', this.no.scope);
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
		var vari = new Variable(name, e.type, 'constant', this.no.scope, e.str, e.locations);
		this.variables.push(vari);
		return vari;
	}else if(e.type == 'name'){
		this.error('found name... need to implement finding name in variable list');
		return e;
	}
};

module.exports = Parser;