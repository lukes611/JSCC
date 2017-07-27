let e = require('express');

let a = e();

a.use(e.static(__dirname));

a.listen(8142)
