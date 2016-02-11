var CSource = require('./CSourceCode');
var LexicalAnalyser = require('./LexicalAnalyser');
var code = new CSource();
code.open('test2.c');
var lx = new LexicalAnalyser(code);
var lexicons = lx.compute();
lexicons.forEach(function(x){
	console.log(x.toString());
});


