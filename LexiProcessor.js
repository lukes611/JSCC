var assert = require('assert');


function LexiProcessor(ll){
	this.l = ll;
	this.currentLocation = undefined;
}

//a function to print out the lexicons in order
LexiProcessor.prototype.printLexicons = function(){
	this.l.forEach(function(l){console.log(l.toString());});
};

//prints out an error and stops the program
LexiProcessor.prototype.error = function(str){
	assert(false, 'error: ' + str + ' at location: ' + this.currentLocationString());
};

//gets a string version of the current line number and column number to list where the 
//compiler is up to
LexiProcessor.prototype.currentLocationString = function(){
	if(this.currentLocation === undefined) return '[no location information available]';
	return 'line: ' + (this.currentLocation[0].line+1) + ', col: [' + (this.currentLocation[0].column+1) + ',' + 
	(this.currentLocation[1].column+1) + ']';
};

//gets the top element, if an integer is passed as the first argument
//then give the top element after removing index many elements (does not cause any actual pops or side effects)
LexiProcessor.prototype.top = function(index){
	index = (index === undefined)? 0 : index;
	if(index >= this.l.length) return undefined;
	this.currentLocation = this.l[index].locations;
	return this.l[index];
};

//this removes the next element from the list of lexicons
//it then returns this lexicon
LexiProcessor.prototype.pop = function(){
	if(this.l.length == 0) return undefined;
	var rv = this.l.shift();
	this.currentLocation = rv.locations;
	return rv;
};

//attempts to match a type on the current lexicon list
//if the type is not matched, an error occurs
LexiProcessor.prototype.matchType = function(type){
	if(this.top() === undefined) this.error('error, unexpected token, expected: ' + type);
	if(this.top().type != type){
		this.error('error, unexpected token, expected: ' + type);
		return undefined;
	}
	return this.pop();
};

//checks if type is the next type of lexicon in list,
//users can pass in index to specify a type further down the list
LexiProcessor.prototype.checkType = function(type, index){
	if(this.top(index) === undefined) return false;
	if(this.top(index).type != type) return false;
	return true;
};

//checks if type is the next type of lexicon in list, if so it is popped off and this returns true
//users can pass in index to specify a type further down the list
LexiProcessor.prototype.checkMatchType = function(type, index){
	if(this.top(index) === undefined) return false;
	if(this.top(index).type != type) return false;
	this.pop();
	return true;
};



module.exports = LexiProcessor;