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

module.exports = NamingObject;