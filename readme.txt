JSCC - a basic C compiler written in JavaScript for the node.js environment
to do:
lexicon compiler
syntax tree
name mapper
real time engine

shortcomings: no do while, no preprocessor definitions,
except #include "blah" or #include <blah>
also files are included only once


key words:
int char unsigned short long double float return struct union if else for while switch 



literals:
"string" 'c' 1 0xFF 2.0f 2.0

operators:
+-*/ << >> -- ++ () func() += & * - ! ~
! == != && || < <= >= > ->

double operators:
	this.doubleSymbols = '+-*/<>!=&|~^';
	+ ++ +=
	- -- -= ->
	/ / /=
	* *=
	< <= <<
	= ==
	> >= >>
	& && &=
	| || |=
	! !=
	~ ~=
	^ ^=





1. Source Code Reading
2. Lexical Analysis
3. Parsing
			a. assembler T0: simplify, one liners -> must keep to and from of the lexicons
				+ scope and variable tracking and checking:
					temporary variable tracking, generation and optimization
			c. assembler T1: pre-linker assembly
4. linker
5. assembler
6. virtual machine

			

3. {
	variable name, dtype, scope, locations
}



