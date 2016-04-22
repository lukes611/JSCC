var CSource = require('./CSourceCode');
var LexicalAnalyser = require('./LexicalAnalyser');
var Parser = require('./Parser');
var code = new CSource();
code.open('test2.c');
var lx = new LexicalAnalyser(code);
var parser = new Parser(lx.compute());
//parser.printLexicons();

parser.start();
	

console.log(parser.toString());


