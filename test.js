var radixSort = function(a){
	var mx = (''+a.reduce(function(p,c){return Math.max(p,c);}, a[0])).length;
	for(var i = 0; i < mx; i++){
		var indices = a.map(function(v){return Math.floor(v/Math.pow(10,i)) % 10;});
		var bin = Array.apply(undefined, Array(10)).map(function(){return [];});
		a.forEach(function(v, i){bin[indices[i]].push(v);});
		a = bin.reduce(function(p,c){return p.concat(c);}, []);
	}
	return a;
};

var N = 30;
var ls = Array.apply(undefined, Array(N)).map(function(){return Math.random()*N*200;}).map(Math.round);
console.log.apply(undefined, ls);
ls=radixSort(ls)
console.log.apply(undefined, ls);