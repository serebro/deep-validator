var Validator = require('../index');

describe('A suite', function() {
    it('validation', function() {
        var schema = {
            'a.b': ['isObject:must be array'],
            'a.b.c': 'isObject',
            'a.d.[].e': [
                'isExists:must be defined',
                'isString:must be text',
                'escape'
            ],
            'a.e.[].e': [
                'isExists:must be defined',
                'isString:must be text',
                'escape',
                function(v, k, d) {
                    d[k]+= '____';
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
                d: [{e: '555'},{e: 6}],
                e: [{e: 'aaa'}],
                f: [{}]
            }
        };

        var validator = new Validator(schema);

        var actual = validator.tryAll().validate(data);
        var errors = validator.getErrors();
        expect(actual).toBe(false);
        expect(data.a.e[0].e).toBe('aaa____');
        expect(errors['a.d.1.e']).toBe('must be text');
        expect(errors['a.z']).toBe('no!');
    });
});
