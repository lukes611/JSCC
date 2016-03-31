var Variable = require('./Variable');

function t(v){
	console.log(''+v);
	console.log('isPtr: ' + v.isPtr());
	console.log('drefed: ' + v.dref() + ', ' + v);
}

var a = new Variable('a', 'int', 'global', 'user');
var b = new Variable('b', 'int*', 'global', 'user');

[a,b].forEach(t);

