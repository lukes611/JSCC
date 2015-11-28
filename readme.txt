Celery - a basic C compiler written in JavaScript for the node.js environment
to do:
lexicon compiler
syntax tree
name mapper
real time engine

shortcomings: structs cannot have functions, no do while, no preprocessor definitions,
except #include "blah" or #include <blah>
also files are included only once


key words:
int char unsigned short long double float return struct union if else for while switch 

literals:
"string" 'c' 1 0xFF 2.0f 2.0

operators:
+-*/ << >> -- ++ () func() += & * - ! ~
! == != && || < <= >= > ->


basic state machine practice:
	1 function per state:
		function returns the next state, whether to pop or not, the tmp string contents, a lexicon or nor



