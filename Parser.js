var Variable = require('./Variable');
var LexiProcessor = require('./LexiProcessor');
var ScopeObject = require('./ScopeObject');

//the parser object
function Parser(lexiList){
	this.__proto__.__proto__ = new LexiProcessor(lexiList);
	this.so = new ScopeObject(this.error.bind(this));
}

Parser.prototype.toString = function(){
	return this.so.toString();
	var st = 'DVARS:\n';
	var f1 = function(x){ st += x.toString() + '\n'; };
	this.dvariables.forEach(f1);
	st += 'VARIABLES:\n';
	this.variables.forEach(f1);
	st += 'CODE:\n';
	this.assembly.forEach(function(x){st += x + '\n'; });
	st += 'FUNCTIONS:\n';
	this.funcs.forEach(f1);
	return st;
};

Parser.prototype.start = function(){
	while(true){
		if(!this.func())
			if(this.checkType('TYPE')){
				this.initializer();
				this.matchType(';');
			}else if(this.checkType('struct')){
				this.struct();
				this.matchType(';');
			}else break;
	}
};

Parser.prototype.struct = function(){
	var isStructDefinition = this.checkType('struct') && this.checkType('name', 1) && this.checkType('{', 2);
	if(!isStructDefinition) return;
	this.matchType('struct');
	var nameLex = this.matchType('name');
	this.matchType('{');
	var st = this.so.newStruct(nameLex.str);
	while(!this.checkType('}')){
		if(this.checkType('struct')){
			this.matchType('struct');
			var n = this.matchType('name').str;
			while(this.checkMatchType('*')) n += '*';
			this.structElement(st, 'struct ' + n);
		}else{
			var dt = this.matchType('TYPE');
			this.structElement(st, dt.str);
		}
		this.matchType(';');
	}
	this.matchType('}');
};

Parser.prototype.structElement = function(struct, dt){
	var nm = this.matchType('name');
	var count = 1;
	if(this.checkType('[')){
		this.matchType('[');
		var n = this.matchType('int');
		this.matchType(']');
		count = Number(n.str);
	}
	struct.newVariable(nm.str, dt, count, this.so.sizeOf(dt));
	if(this.checkType(',')){
		this.pop();
		this.structElement(struct, dt);
	}
};

Parser.prototype.multiStmt = function(){
	while(true) if(!this.stmt()) break;
};

Parser.prototype.func = function(){
	if(this.checkType('TYPE') && this.checkType('name',1) && this.checkType('(', 2)){
		var rtype = this.matchType('TYPE').str;
		var fname = this.matchType('name').str;
		this.matchType('(');
		var args = this.funcArgs();
		this.matchType(')');
		this.so.pushAssembly();
		this.assembly = [];
		var func = this.so.newFuncVar(fname, rtype, args.map(function(x){return x.dtype;}));
		if(this.checkType(';')){
			if(func.hasDefinition()) this.error('function ' + fname + ' already has a definition');
			this.matchType(';');
		}else{
			if(func.hasDefinition()) this.error('function ' + fname + ' already has a definition');
			this.so.pushFunction(func);
			this.matchType('{');
			this.so.addAssembly('pushFunc', func.scopeName());
			this.so.addAssembly('popArgs', args.map(function(x){return x.name}).join(' '));
			this.so.pushScope(func.scopeName());
			var me = this;
			args.forEach(function(arg){me.so.newUserVar(arg.name, arg.dtype);});
			this.multiStmt();
			this.matchType('}');
			this.so.addAssembly('popFunc');
			this.so.popScope();
			this.so.popFunction();
		}
		func.assembly = this.so.popAssembly();
		return true;
	}
	return false;
};

Parser.prototype.funcArgs = function(){
	var rv = [], me = this;
	var hasNext = function(){return me.checkType('TYPE') && me.checkType('name', 1);};
	var tmpF = function(){
		if(hasNext()){
			var t = me.matchType('TYPE');
			var n = me.matchType('name');
			rv.push({dtype:t.str, name:n.str});
			if(me.checkType(',')){ me.matchType(','); tmpF(); };
		}
	};
	if(hasNext()) tmpF();
	return rv;
};

Parser.prototype.stmt = function(){
	if(this.top() == undefined) return false;
	if(this.top().type == '}') return false;
	if(this.checkType('TYPE') || this.checkType('struct')){
		this.initializer();
		this.matchType(';');
		return true;
	}else if(('int,double,float,char,string,short,hex,name,-,!,&,*,('.split(',')).indexOf(this.top().type) != -1){
		this.rhs();
		this.moreRHS();
		this.matchType(';');
		return true;
	}else if(this.top().type == ';') return true;
	else if(this.top().type == 'if'){
		this.ifStmt();
		return true;
	}else if(this.top().type == '{'){
		this.matchType('{');
		this.so.pushScope();
		this.so.addAssembly('pushScope', this.scope);
		this.multiStmt();
		this.matchType('}');
		this.so.popScope();
		this.so.addAssembly('popScope');
		return true;
	}else if(this.top().type == 'for'){
		this.forStmt();
		return true;
	}else if(this.checkType('break')){
		if(!this.so.hasLoopRedirects()) this.error('warning, using break statement in incorrect spot');
		this.pop();
		this.matchType(';');
		this.so.addAssembly('popScope');
		this.so.addAssembly('goto', this.so.getBreakLabel());
		return true;
	}else if(this.checkType('continue')){
		if(!this.so.hasLoopRedirects()) this.error('warning, using continue statement in incorrect spot');
		this.pop();
		this.matchType(';');
		this.so.addAssembly('popScope');
		this.so.addAssembly('goto', this.so.getContinueLabel());
		return true;
	}else if(this.checkType('while')){
		this.whileStmt();
		return true;
	}else if(this.checkType('return')){
		this.pop();
		if(this.checkType(';')){
			var rt = this.so.getCurrentFunction().returnType;
			var returnTypeIsVoid = rt == 'void';
			if(!returnTypeIsVoid) this.error('must return type ' + rt);
			this.so.addAssembly('popFunc');
			this.so.addAssembly('ret');
			this.pop();
		}else{
			var rt = this.so.getCurrentFunction().returnType;
			var rhs = this.rhs();
			rhs = this.so.convertToTypeIfNecessary(rhs, rt);
			this.so.addAssembly('popFunc');
			this.so.addAssembly('ret', rhs.name);
			this.matchType(';');
		}
		return true;
	}
	return false;
};

Parser.prototype.whileStmt = function(){
	this.matchType('while');
	var testLabel = this.so.newLabel();
	var whileStartLabel = this.so.newLabel();
	var endLabel = this.so.newLabel();

	this.matchType('(');
	this.so.pushAssembly();
	var a = this.rhs();
	this.matchType(')');
	var aAssembly = this.so.popAssembly();

	this.so.pushContinueBreak(testLabel, endLabel);

	this.so.addAssembly('goto', testLabel);
	this.so.addAssembly('label', whileStartLabel);
	this.stmt();
	
	this.so.popContinueBreak();

	this.so.addAssembly('label', testLabel);
	this.so.addAssemblyList(aAssembly);
	this.so.addAssembly('ifngoto', a.name, endLabel);
	this.so.addAssembly('goto', whileStartLabel);
	this.so.addAssembly('label', endLabel);
};

Parser.prototype.forStmt = function(){
	this.matchType('for'); //pop for
	this.matchType('(');
	var restartLabel = this.so.newLabel(), contLabel = this.so.newLabel(), endLabel = this.so.newLabel();
	if(!this.checkType(';')) this.rhsMore();
	this.so.addAssembly('label', restartLabel);
	this.matchType(';');
	if(!this.checkType(';')){
		var b = this.rhs();
		this.so.addAssembly('ifngoto', b.name, endLabel);
	}
	this.matchType(';');
	this.so.pushAssembly();
	
	if(!this.checkType(')')){
		c = this.rhsMore();
	}
	var CAssembly = this.so.popAssembly();
	this.matchType(')');
	
	this.so.pushContinueBreak(contLabel, endLabel);
	
	if(!this.stmt()) this.error('error in stmt() in for loop!'); //got d
	
	this.so.addAssembly('label', contLabel);

	console.log(CAssembly)
	this.so.addAssemblyList(CAssembly);
	
	this.so.addAssembly('goto', restartLabel);
	this.so.addAssembly('label', endLabel);

	this.so.popContinueBreak();
};

Parser.prototype.ifStmt = function(){
	this.matchType('if');
	this.matchType('(');
	var e1 = this.rhs();
	this.matchType(')');
	var endLabel = this.so.newLabel();
	var l1 = this.so.newLabel();

	this.so.addAssembly('ifngoto', e1.name, l1);
	if(!this.stmt()) this.error('error in if statement');
	this.so.addAssembly('goto', endLabel);
	this.so.addAssembly('label', l1);

	this.moreIf(endLabel);
};

Parser.prototype.moreIf = function(endLabel){
	if(this.top() === undefined) return this.addAssembly('label', endLabel);	
	if(this.top().type == 'else'){
		this.pop();
		if(this.top().type == 'if'){
			this.pop();
			this.matchType('(');
			var e1 = this.rhs();
			this.matchType(')');
			var l1 = this.so.newLabel();
			this.so.addAssembly('ifngoto', e1.name, l1);
			if(!this.stmt()) this.error('error in else statement');
			this.so.addAssembly('goto', endLabel);
			this.so.addAssembly('label', l1);
			this.moreIf(endLabel);
		}else{
			if(!this.stmt()) this.error('error in else statement');
			this.so.addAssembly('label', endLabel);	
		}
	}else this.so.addAssembly('label', endLabel);

};

Parser.prototype.moreRHS = function(){
	if(this.top().type == ','){
		this.pop();
		this.rhs();
		this.moreRHS();
	}
};

Parser.prototype.initializer = function(){
	var t = this.top();
	if(t.type == 'TYPE'){
		this.matchType('TYPE');
		var dtype = t.str;
		this.moreInitializers(dtype);
	}else if(t.type == 'struct'){
		var isStructDefinition = this.checkType('struct') && this.checkType('name', 1) && this.checkType('{', 2);
		if(isStructDefinition) return;
		this.matchType('struct');
		var name = this.matchType('name').str;
		var st = this.so.structByName(name);
		if(st === undefined) this.error('struct by the name of ' + name + ' does not exist');
		var dtype = 'struct ' + name;
		this.moreInitializers(dtype);
	}

	return;
};

Parser.prototype.moreInitializers = function(dtype){
	var variLex = this.matchType('name');
	var vari;
	if(this.top().type == '['){
		this.pop();
		var i = this.matchType('int');
		vari = this.so.newUserVar(variLex.str, dtype+'*', variLex.locations);
		this.matchType(']');
		if(this.checkType('=')){
			this.pop();
			var rh = this.rhs();
			if(rh.dtype !== vari.dtype && rh.type !== 'bytes') this.error('error in array assignment');
			rh.value = this.so.generateArray(vari.dtype, Number(i.str), rh.value);
			this.so.addAssembly('=', vari.name, rh.name);
		}else{
			var constant = this.so.newBytesVar(vari.dtype, this.so.generateArray(dtype,Number(i.str)));
			this.so.addAssembly('=',vari.name,constant.name);
		
		}
	}else{
		vari = this.so.newUserVar(variLex.str, dtype, variLex.locations);
		if(this.checkType('=')){
			this.pop();
			var rh = this.rhs();
			var bestType = vari.dtype;
			rh = this.so.convertToTypeIfNecessary(rh, bestType);
			this.so.addAssembly('=', vari.name, rh.name);
		}
	}

	if(this.checkType(',')){
		this.pop();
		this.moreInitializers(dtype);
	}
};

Parser.prototype.rhs = function(){
	return this.assignment();
};

Parser.prototype.rhsMore = function(){
	this.assignment();
	this.moreRHS();
};


Parser.prototype.assignment = function(){
	var e1 = this.ternary();
	return this.moreFunctionAssignment(e1, '=,*=,/=,%=,+=,-=,<<=,>>=,&=,|=,^='.split(','), 'ternary');
};

Parser.prototype.ternary = function(){
	var e1 = this.logic();
	if(this.checkType('?')){
		var lex = this.pop();
		var l1 = this.so.newLabel();
		var l2 = this.so.newLabel();
		this.so.pushAssembly();
		var e2 = this.logic();
		var e2Assembly = this.so.popAssembly();
		this.matchType(':');
		this.so.pushAssembly();
		var e3 = this.logic();
		var e3Assembly = this.so.popAssembly();
		
		var bt = this.so.possibleTypeConversion(e2, e3);
		//var bestType = this.no.typeResolution(e2.dtype, e3.dtype);
		//e2 = this.convertToTypeIfNeccecary(e2, bestType);
		//e3 = this.convertToTypeIfNeccecary(e3, bestType);
		var vari = this.so.newTmpVar(bt.bestType, lex.locations);
		
		this.so.addAssembly('gotoifn', e1.name, l1);
		//add e2's assembly first
		this.so.addAssemblyList(e2Assembly);
		this.so.addAssembly('=', vari.name, e2.name);
		this.so.addAssembly('goto', l2);
		this.so.addAssembly('label', l1);
		this.so.addAssemblyList(e3Assembly);
		this.so.addAssembly('=', vari.name, e3.name);
		this.so.addAssembly('label', l2);
		return vari;
	}
	return e1;
};

Parser.prototype.logic = function(){
	var e1 = this.bitwise();
	return this.moreFunction(e1, ['&&', '||'], 'bitwise');
};

Parser.prototype.bitwise = function(){
	var e1 = this.comparators();
	return this.moreFunction(e1, ['&', '^', '|'], 'comparators');
};

Parser.prototype.comparators = function(){
	var e1 = this.comparators2();
	return this.moreFunction(e1, ['==', '!='], 'comparators2');//this.moreComparators(e1);
};

Parser.prototype.comparators2 = function(){
	var e1 = this.shifters();
	return this.moreFunction(e1, ['<', '>', '<=', '>='], 'shifters');
};

Parser.prototype.shifters = function(){
	var e1 = this.adders();
	return this.moreFunction(e1, ['<<', '>>'], 'adders');
};

Parser.prototype.adders = function(){
	var e1 = this.factors();
	return this.moreFunction(e1, ['+', '-'], 'factors');
};

Parser.prototype.factors = function(){
	var e1 = this.preElement();
	return this.moreFunction(e1, ['*', '/', '%'], 'preElement');
};

Parser.prototype.preElement = function(){
	//handles: ! (typeconversion) ~ -
	var e = this.top();
	if(this.checkType('-')){
		var lex = this.pop();
		var rv = this.element();
		var vari = this.so.newTmpVar(rv.dtype, lex.locations);
		this.so.addAssembly('invert', vari.name, rv.name);
		return vari;
	}else if(this.checkType('!')){
		var lex = this.pop();
		var rv = this.element();
		var vari = this.so.newTmpVar(rv.dtype, lex.locations);
		this.so.addAssembly('!', vari.name, rv.name);
		return vari;
	}else if(this.checkType('&')){
		var lex = this.pop();
		var rv = this.element();
		var vari = this.so.newTmpVar(rv.dtype+'*', lex.locations);
		this.so.addAssembly('ref', vari.name, rv.name);
		return vari;
	}else if(this.checkType('*')){
		var lex = this.pop();
		var rv = this.element();
		if(rv.type != 'user' && !rv.isPtr()) this.error('illegal de-reference of a variable');
		var vari = this.so.newRefVar(rv.dtype, lex.locations);
		vari.dref();
		this.so.addAssembly('deref', vari.name, rv.name);
		return vari;
	}else if(this.checkType('~')){
		var lex = this.pop();
		var rv = this.element();
		var vari = this.so.newTmpVar(rv.dtype, lex.locations);
		this.so.addAssembly('~', vari.name, rv.name);
		return vari;
	}else if(this.checkType('(') && this.checkType('TYPE', 1)){
		this.pop();
		var type = this.matchType('TYPE');
		this.matchType(')');
		var rv = this.element();
		return this.so.convertToType(rv, type.str);
	}else{
		return this.element();
	}
};


Parser.prototype.element = function(){
	var e = this.pop();
	var types = 'int,double,float,char,short,hex'.split(',');
	if(types.indexOf(e.type) != -1)
		return this.so.newDataVar(e.type, e.str, e.locations);
	else if(e.type == 'string'){
		var value = this.so.generateArray('char', -1, e.str.split('').concat(['\0']));
		return this.so.newBytesVar('char*', value, e.locations);
	}else if(e.type == 'name' && e.str == '__sys__')
		return this.__sys__();
	else if(e.type == 'name')
		return this.postNamedVariable(this.existingVariable(e));
	else if(e.type == '('){
		var rv = this.rhs();
		this.matchType(')');
		return rv;
	}else if(e.type == '{'){
		var rv = this.CList();
		return rv;
	}
	this.error('error in element()');
};

//handles cases like: {1,2,3} -> to do...
Parser.prototype.CList = function(){
	var v1 = this.pop();
	var isType = function(x){ return 'int,double,char,float'.split(',').indexOf(x.type) !== -1;};
	if(!isType(v1)) this.error('warning array elements must be simple data types and not variables');
	var me = this;
	var rv = [v1];
	var nextOne = function(){
		me.matchType(',');
		var n = me.pop();
		if(!isType(n)) me.error('A+warning array elements must be simple data types and not variables');
		if(v1.dtype !== n.dtype) me.error('B+array elements must be of same type: ' + v1.dtype);
		rv.push(n);
		if(me.checkType(',')) nextOne();
	};
	if(this.checkType(',')) nextOne();
	if(v1.dtype == 'char') rv = rv.map(function(x){return x.str;});
	else rv = rv.map(function(x){return Number(x.str);});
	var value = this.so.generateArray(v1.dtype, -1, rv);
	this.matchType('}');
	return this.so.newBytesVar('char*', value, v1.locations);
};


Parser.prototype.existingVariable = function(e){
	if(e === undefined) e = this.matchType('name');
	var vari = new Variable(e.str, undefined, this.so.getScope(), 'user', undefined, undefined);
	var v = this.so.getDefinedVariable(vari);
	if(v === undefined) this.error(' variable ' + vari.name + ' is not defined but is referenced');
	return v;
};

Parser.prototype.postNamedVariable = function(e1){
	var e = this.top();
	if(e.type == '['){
		this.matchType('[');
		var e2 = this.rhs();
		this.matchType(']');
		var bt = this.so.possibleTypeConversion(e1, e2);
		var vari = this.so.newTmpVar(bt.bestType, e.locations);
		this.so.addAssembly('+',vari.name,bt.e1.name, bt.e2.name);
		var vari2 = this.so.newRefVar(vari.dtype, e.locations);
		vari2.dref();
		this.so.addAssembly('deref', vari2.name, vari.name);
		return vari2;
	}else if(e.type == '++' || e.type == '--'){
		this.matchType(e.type);
		if(e1.dtype != 'int' && !e1.isPtr())
			this.error('warning, attempting to increment a non integer type / non pointer type');
		var e2 = this.so.newTmpVar(e1.dtype, e.locations);
		this.so.addAssembly('=', e2.name, e1.name);
		this.so.addAssembly(e.type, e1.name);
		return e2;
	}else if(e.type == '('){
		if(!e1.isFunction()) this.error('warning: calling non function type');
		var fargs = this.getFunctionArgs();
		var fargs2 = fargs.map(function(x){return x.dtype;});
		var func = this.so.getMatchingFunction(e1, fargs);
		if(func === undefined) this.error('warning, function call with arguments ' + fargs2.join(',') + 
			' called ' + e1.name + ' not found');
		for(var i = fargs.length-1; i >= 0; i--)
			this.so.addAssembly('pushArg', fargs[i].name);
		this.so.addAssembly('call', e1.name, func.uniqueId);
		if(func.returnType === 'void'){
			return this.so.newDataVar('void', 0, this.currentLocation);	
		}
		var rv = this.so.newTmpVar(func.returnType, this.currentLocation);
		this.so.addAssembly('popReturnValue', rv.name);
		return rv;
	}else if(e.type == '.'){
		this.pop();
		if(!e1.isStruct()) this.error('cannot index type ', e1.dtype);
		var structDefinition = this.so.structByName(e1.nameOfStruct());
		var name = this.matchType('name').str;
		var nameVar = structDefinition.getVar(name);
		if(nameVar === undefined) this.error('struct ' + structDefinition + ' has no member called ' + name);
		var index = nameVar.index;
		console.log(name, 'is at', index);
		var pointerToStruct = this.so.newTmpVar(structDefinition.dtype);
		this.so.addAssembly('ref', pointerToStruct.name, e1.name);
		var charPointer = this.so.convertToType(pointerToStruct, 'char*');
		var properIndexedCharPointer = this.so.newTmpVar('char*');
		var indexToAdd = this.so.newDataVar('char*', index);
		this.so.addAssembly('+', properIndexedCharPointer.name, charPointer.name, indexToAdd.name);
		var eOut = this.so.convertToType(properIndexedCharPointer, nameVar.dtype + '*');
		var rv = this.so.newRefVar(nameVar.dtype);
		this.so.addAssembly('dref', rv.name, eOut.name);
		return this.postNamedVariable(rv);
	}
	return e1;
};

Parser.prototype.__sys__ = function(){
	var fargs = this.getFunctionArgs();
	for(var i = fargs.length-1; i >= 0; i--)
		this.so.addAssembly('pushArg', fargs[i].name);
	this.so.addAssembly('system', fargs.length);
	return this.so.newDataVar('void', 0, this.currentLocation);	
};

Parser.prototype.getFunctionArgs = function(){
	this.matchType('(');
	if(this.checkType(')')){
		this.pop();
		return [];
	}
	var me = this;
	var rv = [];
	var hasMore = function(){return me.checkMatchType(',');};
	var add = function(){rv.push(me.rhs());};
	add();
	while(hasMore()) add();
	this.matchType(')');
	return rv;
};



Parser.prototype.moreFunction = function(e1, ops, nextFunction){
	for(var i = 0; i < ops.length; i++){
		var op = ops[i];
		if(this.checkType(op)){
			var lex = this.pop();
			var e2 = this[nextFunction]();
			var bt = this.so.possibleTypeConversion(e1, e2);
			var vari = this.so.newTmpVar(bt.bestType, lex.locations);
			this.so.addAssembly(op, vari.name, bt.e1.name, bt.e2.name);
			return this.moreFunction(vari, ops, nextFunction);
		}
	}
	return e1;	
};

Parser.prototype.moreFunctionAssignment = function(e1, ops, nextFunction){
	for(var i = 0; i < ops.length; i++){
		var op = ops[i];
		if(this.checkType(op)){
			if(e1.type != 'user' && e1.type != 'ref') this.error('error, assigning to a non variable');
			var lex = this.pop();
			var e2 = this[nextFunction]();
			var bt = this.so.typeConversionE1(e1, e2);
			var vari = this.so.newTmpVar(bt.bestType, lex.locations);
			this.so.addAssembly(op, vari.name, bt.e1.name, bt.e2.name);
			return this.moreFunction(vari, ops, nextFunction);
		}
	}
	return e1;	
};

module.exports = Parser;