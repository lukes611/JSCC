var CSourceCode = require('./CSourceCode');
var Lexicon = require('./Lexicon');



//an object which performs the lexical analysis
function LexicalAnalyser(sourcecode){
	this.sourceCode = sourcecode;
	this.sourceCode.reset();
	this.stateMachineFunctions = [];
}

LexicalAnalyser.prototype.step = function(x){
	x.lexicon = undefined; //set no lexicon to be returned
	//needs state number, return new state and lexicon as well as string
	var c = this.sourceCode.top(); //get the next character
	var sc = this.sourceCode; //a simple link to the source code object
	//console.log(x);
	if(x.state == 0){ //if default state
		if(sc.topIsAlpha()){ //if numerical character is read
			x.state = 1;
			x.str = c;
			x.location = sc.getLocation();
		}else if(sc.topIsSingleSymbol()){
			x.lexicon = new Lexicon(c, c, x.location, x.location);
		}else if(sc.topIsDoubleSymbol()){
			var version1 = c; sc.pop();
			var version2 = c + sc.top();
			var index = sc.doubleOperators.indexOf(version2);
			if(index == -1){
				x.lexicon = new Lexicon(c, c, x.location, x.location);
			}else{
				x.lexicon = new Lexicon(version2, version2, x.location, x.location);
				sc.pop();
			}
			return;
		}else if(sc.topIsNumerical()){
			x.str = c;
			x.state = 2;
			x.location = sc.getLocation();
		}else if(c == '\''){
			x.str = '';
			x.state = 5;
			x.location = sc.getLocation();
		}

	}else if(x.state == 1){ //possible key-word or variable
		if(sc.topIsAlpha() || sc.topIsNumerical()){
			x.str += c;
		}else{
			x.lexicon = new Lexicon(this.interpretString(x.str), 
				x.str, x.location, sc.getLocation());
			x.state = 0;
			return;
		}
	}else if(x.state == 2){ //number type int loop
		if(c == '.'){
			x.str += c;
			x.state = 3;
		}else if(sc.topIsNumerical()){
			x.str += c;
		}else{
			x.lexicon = new Lexicon('int', x.str, x.location, sc.getLocation());
			x.state = 0;
			return;
		}
	}else if(x.state == 3){ //number type float or double, start
		if(!sc.topIsNumerical()){
			x.error = true;
			x.msg = 'incorrectly specified float or double @ line: ' + x.location.line +
			' and column: ' + x.location.column;
			return;
		}else{
			x.str += c;
			x.state = 4;
		}
	}else if(x.state == 4){ //continuation of float or double
		if(sc.topIsNumerical()){
			x.str += c;
		}else if(c == 'f'){
			x.lexicon = new Lexicon('float', x.str, x.location, sc.getLocation());
			x.state = 0;
		}else{
			x.lexicon = new Lexicon('double', x.str, x.location, sc.getLocation());
			x.state = 0;
			return;
		}
	}else if(x.state == 5){
		var ch = c; sc.pop();
		var next = sc.top();
		if(ch == '\\'){
			state = 6;
			return;
		}
		
		if(next != '\''){
			x.error = 'incorrectly specified char @ line: ' + x.location.line +
			' and column: ' + x.location.column;
			return;
		}
		sc.pop();
		x.lexicon = new Lexicon('char', ch, x.location, sc.getLocation());
		x.state = 0;
		return;
	}else if(x.state == 6){
		var ch = c; sc.pop();
		var next = sc.top();
		if(next != '\''){
			x.error = 'incorrectly specified char @ line: ' + x.location.line +
			' and column: ' + x.location.column;
			return;
		}
		sc.pop();
		x.lexicon = new Lexicon('char', ch, x.location, sc.getLocation());
		x.state = 0;
		return;
	}
	this.sourceCode.pop();
};

//this function computes the lexicons
LexicalAnalyser.prototype.compute = function(){
	var sc = this.sourceCode;
	var out = [];
	var ob = {
		"state" : 0, //the start state
		"lexicon" : undefined,
		"str" : '',
		"location" : sc.getLocation(),
		"error" : false,
		"msg" : ''
	};
	while(!sc.eof()){
		this.step(ob);
		if(ob.lexicon !== undefined) out.push(ob.lexicon);
	}
	out.forEach(function(x){
		console.log(x.toString());
	});
};

//check a string input for it's type
LexicalAnalyser.prototype.interpretString = function(str){
	var types = 'double int char void struct short float union'.split(' ');
	var selfDescribers = 'for while if else switch return'.split(' ');
	if(types.indexOf(str) != -1) return 'TYPE';
	else if(selfDescribers.indexOf(str) != -1) return '' + str;
	return 'name';
};

module.exports = LexicalAnalyser;