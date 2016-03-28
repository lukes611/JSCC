function NamingObject(){
	this.tmpVarNo = 0;
	this.tmpFuncNo = 0;
	this.scope = 'Global';
}

NamingObject.prototype.newTmpName = function(){
	var rv = 'Tmp' + this.tmpVarNo;
	this.tmpVarNo++;
	return rv;
};


NamingObject.prototype.simpleType = function(t){
	t = t.replace(/ /, '');
	t = t.replace(/unsigned/, '');
	return t;
};

NamingObject.prototype.typeResolution = function(t1, t2){
	var tps = 'double,float,int,short,char'.split(',');
	var a = tps.indexOf(this.simpleType(t1));
	var b = tps.indexOf(this.simpleType(t2));
	if(a == -1 || b == -1) return undefined;
	if(a < b) return t1;
	return t2;
};

module.exports = NamingObject;