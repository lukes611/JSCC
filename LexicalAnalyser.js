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
		if(sc.topIsAlpha()){ //if alphabetical character is read
			x.state = 1;
			x.str = c;
			x.location = sc.getLocation();
		}else if(sc.topIsSingleSymbol()){
			x.lexicon = new Lexicon(c, c, x.location, x.location);
		}else if(c == '/'){
			x.state = 14;
			x.location = sc.getLocation();
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
			x.location = sc.getLocation();
			sc.pop();
			var nc = sc.top();
			if(c == '0' && ['x', 'X'].indexOf(nc) != -1){
				sc.pop();
				x.state = 7;
				x.str = '';
			}else{
				x.state = 2;
				x.str = c;
				x.location = sc.getLocation();
			}
			return;
		}else if(c == '\''){
			x.str = '';
			x.state = 5;
			x.location = sc.getLocation();
		}else if(c == '"'){
			x.str = '';
			x.state = 9;
			x.location = sc.getLocation();
		}

	}else if(x.state == 1){ //possible key-word or variable
		if(sc.topIsAlpha() || sc.topIsNumerical()){
			x.str += c;
		}else{
			if(x.str == 'unsigned'){
				x.state = 12;
				return;
			}else if(this.stringIsType(x.str)){
				x.state = 11;
				return;
			}else{
				x.lexicon = new Lexicon(this.interpretString(x.str), 
					x.str, x.location, sc.getLocation());
				x.state = 0;
				return;
			}
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
			x.error = true;
			x.msg = 'incorrectly specified char @ line: ' + x.location.line +
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
			x.error = true;
			x.msg = 'incorrectly specified char @ line: ' + x.location.line +
			' and column: ' + x.location.column;
			return;
		}
		sc.pop();
		x.lexicon = new Lexicon('char', ch, x.location, sc.getLocation());
		x.state = 0;
		return;
	}else if(x.state == 7){
		if(sc.topIsHexSymbol()){
			x.str += c;
			x.state = 8;
		}else{ //error, must be at least one hex number
			x.error = true;
			x.msg = 'incorrectly specified hex number @ line: ' + x.location.line +
			' and column: ' + x.location.column;
			return;
		}
	}else if(x.state == 8){ //continuation of hex number
		if(sc.topIsHexSymbol()){
			x.str += c;
		}else{
			x.lexicon = new Lexicon('hex', x.str, x.location, sc.getLocation());
			x.state = 0;
			x.str = '';
			return;
		}
	}else if(x.state == 9){
		if(c == '"'){
			x.lexicon = new Lexicon('string', x.str, x.location, sc.getLocation());
			x.state = 0;
			x.str = '';
		}else if(c == '\\'){
			x.state = 10;
		}else if(c == '\n'){
			x.error = true;
			x.msg = 'incorrectly specified string @ line: ' + x.location.line +
			' and column: ' + x.location.column;
		}else x.str += c;
	}else if(x.state == 10){
		x.str += c;
		x.state = 9;
	}else if(x.state == 11){
		//console.log('here: ' + x.str);
		if(sc.topIsWhiteSpace()){}
		else if(c == '*'){
			x.str += '*';
		}else{
			x.lexicon = new Lexicon('TYPE', 
				x.str, x.location, sc.getLocation());
			x.state = 0;
			return;
		}
	}else if(x.state == 12){
		if(sc.topIsWhiteSpace()){}
		else if(sc.topIsAlpha()){
			x.str += ' ' + c;
			x.state = 13;
		}
	}else if(x.state == 13){
		if(this.stringIsUnsignedType(x.str)){
			x.state = 11;
			return;	
		}else if(sc.topIsAlpha()){
			x.str += c;
		}else{
			x.error = true;
			x.msg = 'incorrectly specified unsigned number @ line: ' + x.location.line +
			' and column: ' + x.location.column;
		}
	}else if(x.state == 14){//read in possible comment after receiving /
		var version1 = '/';
		var version2 = '/' + c;
		if(version2 == '/*'){
			x.state = 16;
		}else if(version2 == '//'){
			x.state = 15;
		}else{
			var index = sc.doubleOperators.indexOf(version2);
			if(index == -1){
				x.lexicon = new Lexicon(c, c, x.location, x.location);
				return;
			}else{
				x.lexicon = new Lexicon(version2, version2, x.location, sc.getLocation());
			}
		}
	}else if(x.state == 15){//continue until new line character read
		if(c == "\n" || c == "\r"){
			x.state = 0;
		}
	}else if(x.state == 16){//continue until */ is read
		if(c == '*'){
			sc.pop();
			var version2 = c + sc.top();
			if(version2 == '*/'){
				x.state = 0;
			}
		}
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
	return out;
};

//check a string input for it's type
LexicalAnalyser.prototype.interpretString = function(str){
	var types = 'double,int,char,void,struct,short,float,union'.split(',');
	var selfDescribers = 'for while if else switch return'.split(' ');
	if(types.indexOf(str) != -1) return 'TYPE';
	else if(selfDescribers.indexOf(str) != -1) return '' + str;
	else if(str == 'unsigned') return 'MODIFIER';
	return 'name';
};

//check a string input if it is part of a type
LexicalAnalyser.prototype.stringIsType = function(str){
	var types = 'double,int,char,void,struct,short,float,union,unsigned'.split(',');
	if(types.indexOf(str) != -1) return true;
	return false;
};


//check a string input if it is part of a type
LexicalAnalyser.prototype.stringIsUnsignedType = function(str){
	var types = 'unsigned double,unsigned int,unsigned char,unsigned short,unsigned float'.split(',');
	if(types.indexOf(str) != -1) return true;
	return false;
};



module.exports = LexicalAnalyser;