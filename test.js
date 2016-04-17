//0 6
function OLL(){
	this.len = 0;
	this.head = 0;
	this.push = function(item){
		if(this.len == 0) this.head = {data:item, next:undefined};
		else if(item < this.head.data) this.head = {data:item, next:this.head};
		else{
			var c = this.head;
			while(true){
				if(c.next === undefined) break;
				if(c.next.next === undefined) break;
				if(item <= c.next.data) break;
				c = c.next;
			}
			if(c.data == item) return;
			else if(c.next !== undefined) if(c.next.data == item) return;
			c.next = {data:item, next:c.next};
		}
		this.len++;
	};
	this.toArray = function(){
		var rv = [];
		var c = this.head;
		for(var i = 0; i < this.len; i++, c = c.next) rv.push(c.data);
		return rv;
	};
	this.toString = function(){return ''+this.toArray();};
	this.contains = function(item){
		var c = this.head;
		var d = undefined;
		var next = function(){d = c.data; c=c.next; return d;};
		var hasNext = function(){return c.next !== undefined;};
		if(this.len == 0) return false;
		while(hasNext()) if(next() == item) return d;
	};
}


var l = new OLL();
for(var i = 20; i >=0; i--) l.push(parseInt(i));
console.log(''+l);

console.log(l.contains(3));