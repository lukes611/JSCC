var fs = require('fs');

//source code object, input source cde
function CSourceCode(str){
	str = str || "";
	this.original = str;
	this.lines = str.split("\n");
	this.lineIter = 0;
	this.colIter = 0;
	this.alphabet = 'abcdefghijklmnopqrstuvwxyz_ABCDEFGHIJKLMNOPQRSTUVWXYZ';
	this.numbers = '0123456789';
	this.hexSymbols = '0123456789ABCDEFabcdef';
	this.singleSymbols = '(){}#.,?:[];';
	this.doubleSymbols = '+-*/%<>!=&|~^';
	this.doubleOperators = ('++ += -- -= -> / /= *= %= <= << == != >= >> && &= || |= !=' +
	'~= ^=').split(' ');

	this.whiteSpaceSymbols = ' \t\n\r';
	this.setup();
}

//opens a new source code file
CSourceCode.prototype.open = function(fname){
	this.original = fs.readFileSync(fname).toString();
	this.lines = this.original.split("\n");
	this.reset();
};

//resets the and column pointers
CSourceCode.prototype.reset = function(){
	this.colIter = 0;
	this.lineIter = 0;
	this.setup();
};

//initial function to make sure first character is retieved properly using pop
CSourceCode.prototype.setup = function(){
	//check if first line is empty
	if(this.lines.length > 0)
		if(this.currentLine().length <= 0)
			this.next();
};

//get the current line in the source code
CSourceCode.prototype.currentLine = function(){
	return this.lines[this.lineIter];
};

//checks for the end of the file
CSourceCode.prototype.eof = function(){
	var endOfLine = this.lineIter >= this.lines.length;
	if(endOfLine) return true;
	//var endOfColumn = this.colIter >= this.currentLine().length;
	return false;
};

//changes to the next char
CSourceCode.prototype.next = function(){
	this.colIter++;
	var l = this.currentLine();
	if(this.colIter >= l.length){
		this.colIter = 0;
		this.lineIter++;
	}
	if(this.eof()) return;
	if(this.currentLine().length == 0) this.next();
};

//check the next char from the source code
CSourceCode.prototype.top = function(){
	var l = this.currentLine();
	var rv = l[this.colIter];
	return rv;
};

//get and remove the top char
CSourceCode.prototype.pop = function(){
	var rv = this.top();
	this.next();
	return rv;
};

//retrieves the location
CSourceCode.prototype.getLocation = function(){
	return {
		line : this.lineIter,
		column : this.colIter
	};
}


//checks to see if the top symbol is in the specified string. eg. is 'c' in 'abc' : yes
CSourceCode.prototype.topSymbolIn = function(str){
	return str.indexOf(this.top()) != -1;
};

//checks to see if the top char is from the upper or lowercase alphabet
CSourceCode.prototype.topIsAlpha = function(){
	return this.topSymbolIn(this.alphabet);
};

//checks to see if the top char is a number 0-9
CSourceCode.prototype.topIsNumerical = function(){
	return this.topSymbolIn(this.numbers);
};

//checks to see if the top char is a whitespace symbol
CSourceCode.prototype.topIsWhiteSpace = function(){
	return this.topSymbolIn(this.whiteSpaceSymbols);
};

//checks to see if the top char is a single symbol
CSourceCode.prototype.topIsSingleSymbol = function(){
	return this.topSymbolIn(this.singleSymbols);
};

//checks to see if the top char is a double symbol
CSourceCode.prototype.topIsDoubleSymbol = function(){
	return this.topSymbolIn(this.doubleSymbols);
};


//checks to see if the top char is a double symbol
CSourceCode.prototype.topIsHexSymbol = function(){
	return this.topSymbolIn(this.hexSymbols);
};





module.exports = CSourceCode;

