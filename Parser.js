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
	var st = '';
	this.variables.forEach(function(x){st += x.toString();});
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

Parser.prototype.preElement = function(){
	//handles: ! (typeconversion) ~ -
	var e = this.top();
	if(e.type == '-'){
		this.pop();
		var rv = this.element();
		var name = this.no.newTmpName();
		var vari = new Variable(name, rv.type, 'tmp', this.no.scope);
		this.variables.push(vari);
		this.assembly.push('invert ' + vari.name + ' ' + rv.name);
	}else{
		return this.element();
	}
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