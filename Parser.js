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

Parser.prototype.factors = function(){
	var e1 = this.adders();
	if(this.checkType('*')){
		this.pop();
		var e2 = this.adders();
		var name = this.no.newTmpName();
		var bestType = this.no.typeResolution(e1.dtype, e2.dtype);
		e1 = this.convertToTypeIfNeccecary(e1, bestType);
		e2 = this.convertToTypeIfNeccecary(e2, bestType);
		var vari = new Variable(name, bestType, 'tmp', this.no.scope);
		this.variables.push(vari);
		this.assembly.push('* ' + vari.name + ' ' + e1.name + ' ' + e2.name);
		return vari;
	}else if(this.checkType('/')){
		this.pop();
		var e2 = this.adders();
		var name = this.no.newTmpName();
		var bestType = this.no.typeResolution(e1.dtype, e2.dtype);
		e1 = this.convertToTypeIfNeccecary(e1, bestType);
		e2 = this.convertToTypeIfNeccecary(e2, bestType);
		var vari = new Variable(name, bestType, 'tmp', this.no.scope);
		this.variables.push(vari);
		this.assembly.push('/ ' + vari.name + ' ' + e1.name + ' ' + e2.name);
		return vari; 
	}
	return e1;
};

Parser.prototype.adders = function(){
	var e1 = this.preElement();
	if(this.checkType('+')){
		this.pop();
		var e2 = this.preElement();
		var name = this.no.newTmpName();
		var bestType = this.no.typeResolution(e1.dtype, e2.dtype);
		e1 = this.convertToTypeIfNeccecary(e1, bestType);
		e2 = this.convertToTypeIfNeccecary(e2, bestType);
		var vari = new Variable(name, bestType, 'tmp', this.no.scope);
		this.variables.push(vari);
		this.assembly.push('+ ' + vari.name + ' ' + e1.name + ' ' + e2.name);
		return vari;
	}else if(this.checkType('-')){
		this.pop();
		var e2 = this.preElement();
		var name = this.no.newTmpName();
		var bestType = this.no.typeResolution(e1.dtype, e2.dtype);
		e1 = this.convertToTypeIfNeccecary(e1, bestType);
		e2 = this.convertToTypeIfNeccecary(e2, bestType);
		var vari = new Variable(name, bestType, 'tmp', this.no.scope);
		this.variables.push(vari);
		this.assembly.push('- ' + vari.name + ' ' + e1.name + ' ' + e2.name);
		return vari; 
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