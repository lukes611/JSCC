var CSourceCode = require('./CSourceCode');
var Lexicon = require('./Lexicon');



//an object which performs the lexical analysis
function LexicalAnalyser(sourcecode){
	this.sourceCode = sourcecode;
	this.sourceCode.reset();
	this.stateMachineFunctions = [];
}

LexicalAnalyser.prototype.step = function(x){
	x.lexicon = undefined;
	//needs state number, return new state and lexicon as well as string
	var c = this.sourceCode.top();
	var sc = this.sourceCode;
	//console.log(x);
	if(x.state == 0){
		if(sc.topIsAlpha()){
			x.state = 1;
			x.str = c;
			x.location = sc.getLocation();
		}else if(sc.topIsSingleSymbol()){
			
		}

	}else if(x.state == 1){
		if(sc.topIsAlpha() || sc.topIsNumerical()){
			x.str += c;
		}else{
			x.lexicon = new Lexicon(this.interpretString(x.str), 
				x.str, x.location, sc.getLocation());
			x.state = 0;
			return;
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
		"location" : sc.getLocation()
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
	return 'variable';
};

module.exports = LexicalAnalyser;