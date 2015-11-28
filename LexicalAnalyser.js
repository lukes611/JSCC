var CSourceCode = require('./CSourceCode');
var Lexicon = require('./Lexicon');


//a state object is used to decide the state of the
//state machine for interpreting c
function State(nextState, popChar, str, lexi){
	this.nextState = nextState;
	this.popChar = popChar;
	this.str = str;
	this.lexi = lexi;
}

//adds a lexical object to the list if it is not undefined
State.prototype.addLexiObjToList = function(list){
	if(this.lexi !== undefined) list.push(this.lexi);
};

//an object which performs the lexical analysis
function LexicalAnalyser(sourcecode){
	this.sourceCode = sourcecode;
	this.sourceCode.reset();
	this.stateMachineFunctions = [];
	this.init();
}

//an initialization function
LexicalAnalyser.prototype.init = function(){
	this.stateMachineFunctions = new Array(1);
	var alpha = 'abcdefghijklmnopqrstuvwxyz_';
	var numer = '0123456789';
	var isNumer = function(c){ return numer.indexOf(c) != -1; };
	var isAlpha = function(c){ return alpha.indexOf(c) != -1; };

	//blank spaces
	this.stateMachineFunctions[0] = function(state, char, str, location){ 
		if(state != 0) return undefined;
		if(char == ' ') return new State(0,true,'');
		return undefined;
	};

	//words start
	this.stateMachineFunctions[1] = function(state, char, str, location){ 
		if(state != 0) return undefined;
		var c = char.toLowerCase();
		if(isAlpha(c)) return new State(2,true,str+char);
		return undefined;
	};
	this.stateMachineFunctions[2] = function(state, char, str, location){
		if(state != 2) return undefined; 
		var c = char.toLowerCase();
		if(isAlpha(c) || isNumer(c)) return new State(2,true,str+char);
		return new State(0,false,'', new Lexicon(str));
	};


	
};

//this function computes the lexicons
LexicalAnalyser.prototype.compute = function(){
	sc = this.sourceCode;
	flist = this.stateMachineFunctions;
	var state = 0;
	var str = '';
	var out = [];
	while(!sc.eof()){
		var char = sc.top();
		for(var i = 0; i < flist.length; i++){
			var x = flist[i](state, char, str);
			if(x !== undefined){
				x.addLexiObjToList(out);
				state = x.nextState;
				str = x.str;
				if(x.popChar) sc.pop();
				break;
			}
		}
	}
	console.log(out);
};

module.exports = LexicalAnalyser;