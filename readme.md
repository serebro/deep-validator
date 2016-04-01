```javascript

var Validator = require('deep-validator');

var schema = {
	'a.b': ['isObject:must be array'],
	'a.b.c': 'isObject',
	'a.d.[].e': [
		'isExists:must be defined',
		'isString:must be text',
		'escape',
	],
	'a.e.[].e': [
		'isExists:must be defined',
		'isString:must be text',
		'escape',
		function(v, k, d) {
		d[k] += '____';
		return true;
		}
	],
	'a.f.[]': 'isObject',
	'a.g': [['default', 5]],
	'a.z': 'isExists:no!'
};

var data = {
    a: {
        b: [],
        e: [{e: 'aaa'}],
        f: [ {} ]
    }
};

let validator = new Validator(schema);
var result = validator.validate([ d, d, d, d, d, d ]);
console.log(result);

var message;
while (message = validator.getNextError()) {
    console.log(message);
}

```
