function Lexicon(type, str, locationFrom, locationTo){
	this.type = type;
	this.str = str;
	this.locations = [locationFrom, locationTo];
}

Lexicon.prototype.toString = function(){
	return this.type + '\t\t\t' + this.str;
};



module.exports = Lexicon;