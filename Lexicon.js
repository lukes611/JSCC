function Lexicon(type, str, locationFrom, locationTo){
	this.lexiType = type;
	this.str = str;
	this.locations = [locationFrom, locationTo];
}

Lexicon.prototype.toString = function(){
	return this.lexiType + '\t' + this.str;
};



module.exports = Lexicon;