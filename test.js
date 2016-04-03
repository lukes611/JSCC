
function X(){
	this.ar = [];
	for(var i = 0; i < arguments.length; i++) this.ar.push(arguments[i]);
}
X.prototype.toString = function(){return this.ar.reduce(function(p,c){return p + ',' + c;});};
X.prototype.iter = function(){
	var i = 0, v, m = this;
	return {
		hasNext : function(){
			return i < m.ar.length;
		},
		next : function(){
			return m.ar[i++];
		},
		reset: function(){i=0;},
		valueOf : function(){
			return m.ar[i];
		}
	};
};

var x = new X(5,6,7,8,9,10);
console.log(''+x);

var i = x.iter();
while(i.hasNext()){
	console.log('GOD: ' + i.next());
}
i.reset();
while(i.hasNext()){
	console.log(0+i);
	console.log('DOG: ' + i.next());
}
