function BSort(ar){
	if(ar.length == 0) return [];
	var rv = ar.reduce(function(p, c){
		if(p.length == 0) return [c];
		var last = p.splice(-1)[0];
		return p.concat( last < c ? [last, c] : [c, last] );
	}, []);
	return BSort(rv.slice(0,-1)).concat(rv.slice(-1));
}
var ar = Array.apply(undefined, Array(5)).map(Math.random).map(function(x){return x*100;}).map(Math.round);
console.log(ar);
console.log(BSort(ar));