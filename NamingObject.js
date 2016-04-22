function NamingObject(){
	this.tmpVarNo = 0;
	this.tmpFuncNo = 0;
	this.idNo = 0;
	this.scope = 'Global';
}

NamingObject.prototype.newTmpName = function(){
	var rv = '$t_' + this.tmpVarNo;
	this.tmpVarNo++;
	return rv;
};

NamingObject.prototype.newTmpLabel = function(){
	var rv = '#L' + this.tmpVarNo;
	this.tmpVarNo++;
	return rv;
};

NamingObject.prototype.newId = function(){
	return this.idNo++;
};


if(typeof module !== 'undefined') module.exports = NamingObject;