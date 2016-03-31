/*Parser.prototype.factors = function(){
	var e1 = this.preElement();
	return this.moreFactors(e1);
};

Parser.prototype.moreFactors = function(e1){
	var ops = ['*', '/', '%'];
	for(var i = 0; i < ops.length; i++){
		var op = ops[i];
		if(this.checkType(op)){
			this.pop();
			var e2 = this.preElement();
			var name = this.no.newTmpName();
			var bestType = this.no.typeResolution(e1.dtype, e2.dtype);
			e1 = this.convertToTypeIfNeccecary(e1, bestType);
			e2 = this.convertToTypeIfNeccecary(e2, bestType);
			var vari = new Variable(name, bestType, 'tmp', this.no.scope, undefined, 1);
			this.variables.push(vari);
			this.assembly.push(op + ' ' + vari.name + ' ' + e1.name + ' ' + e2.name);
			return this.moreFactors(vari);
		}
	}
	return e1;
};
*/

function Ob(x, y){
	this.x = x === undefined?5:x;
	this.y = y===undefined?'hello':y;
}
Ob.prototype.toString = function(){return this.x + ',' + this.y;};
Ob.prototype.print = function(){console.log(this.toString());};
Ob.prototype.f = function(x){console.log((x+this.x));};
Ob.prototype.args = function(){for(var i = 0; i < arguments.length; i++) this.f(arguments[i]);};
var a = new Ob();
var b = new Ob(10, 'bye');


function cl(ob, f){
	var x = '['+ob[f]()+']';
	console.log(x);
}

console.log(''+a, '\n'+b);


//cl(a, 'toString');
//Ob.prototype.args.apply(a, [19, 20, 21, 32]);
var aaa = [1,2,3, new Ob(20), new Ob(21, 'sixteen')].join(' ');
console.log(aaa);
