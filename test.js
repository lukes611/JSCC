var StructVar = require('./StructVar');

var a = new StructVar('Person');

a.newVariable('age', 'int');
a.newVariable('name', 'char', 20);
a.newVariable('scalar', 'double');
a.newVariable('job', 'char', 20);
a.newVariable('family', 'struct Person*');

console.log(''+a);