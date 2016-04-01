/// <reference path="./typings/main.d.ts" />
"use strict";
var _ = require('lodash');
var validator = require('validator');
var Validator = (function () {
    /**
     * Constructor.
     *
     * @param schema Data validation schema.
     */
    function Validator(schema) {
        var _this = this;
        this._nextError = null;
        this._sarray = { '##': { s: void 0, v: [] } };
        this._schema = { '##': { s: void 0, v: [] } };
        this._notArr = true;
        this._strict = false;
        this._tryAll = false;
        this.errors = {};
        this.passed = false;
        _.each(schema, function (v, k) {
            var _last = _this._schema;
            var _elem = _this._schema;
            k.split('.').forEach(function (v) {
                _last = _elem;
                _elem = _elem[k = v] || (_elem[v] = { '##': { s: void 0, v: [] } });
                if (k === '[]') {
                    _last['##'].v.push({ a: [], m: void 0, v: 'isArray' });
                }
            });
            (_.isArray(v) ? v : [v]).forEach(function (v) {
                _.isArray(v) || (v = [v]);
                if (_.isString(v[0])) {
                    var t = v[0].split(':');
                    if (t[0] === 'isExists') {
                        _last[k]['##'].s = t[1] || false;
                    }
                    else if (t[0] === 'default') {
                        _last[k]['##'].d = v[1];
                    }
                    else if (validator[t[0]] || _[t[0]]) {
                        _last[k]['##'].v.push({ a: v.slice(1), m: t[1], v: t[0] });
                    }
                    else {
                        throw new Error('Validator is not defined: ' + t[0]);
                    }
                }
                else {
                    _last[k]['##'].v.push({ a: v.slice(1), m: null, v: v[0] });
                }
            });
        });
        this._sarray['[]'] = this._schema;
    }
    /**
     * Get all errors of last validation.
     *
     * @returns {{}}
     */
    Validator.prototype.getErrors = function () {
        return this.errors;
    };
    /**
     * Get next error of last validation.
     *
     * @returns {any}
     */
    Validator.prototype.getNextError = function () {
        var _this = this;
        if (this._nextError === null) {
            var k_1 = Object.keys(this.errors);
            var i_1 = 0;
            this._nextError = function () {
                if (i_1++ < k_1.length) {
                    return {
                        field: k_1[i_1 - 1],
                        message: _this.errors[k_1[i_1 - 1]]
                    };
                }
                return void 0;
            };
        }
        return this._nextError();
    };
    /**
     * Set [notArr] mode. Validating data will be examined as object.
     *
     * @param value Value.
     * @returns {Validator}
     */
    Validator.prototype.notArr = function (value) {
        if (value === void 0) { value = true; }
        this._notArr = value;
        return this;
    };
    /**
     * Set [strict] mode. All scope keys will be checked for presence.
     *
     * @param value Value.
     * @returns {Validator}
     */
    Validator.prototype.strict = function (value) {
        if (value === void 0) { value = true; }
        this._strict = value;
        return this;
    };
    /**
     * Set [tryAll] mode. All scope validators will be applied in despite of earlier failures.
     *
     * @param value Value.
     * @returns {Validator}
     */
    Validator.prototype.tryAll = function (value) {
        if (value === void 0) { value = true; }
        this._tryAll = value;
        return this;
    };
    /**
     * Validate. If returns [false] errors list can be retrieved by [getErrors] or [getNextError] iterator.
     *
     * @param data Data to be validated.
     * @returns {boolean}
     */
    Validator.prototype.validate = function (data) {
        this._nextError = null;
        this.errors = {};
        if (_.isArray(data)) {
            if (this._notArr) {
                return false;
            }
            this._validate(data, this._sarray, this._tryAll, this.errors, this._strict, '');
        }
        else {
            if (_.isObject(data) === false) {
                return false;
            }
            this._validate(data, this._schema, this._tryAll, this.errors, this._strict, '');
        }
        return this.passed = _.isEmpty(this.errors);
    };
    Validator.prototype._validate = function (data, schema, tryAll, errors, strict, messagePrefix, key, ref) {
        if (tryAll === void 0) { tryAll = false; }
        if (errors === void 0) { errors = {}; }
        if (strict === void 0) { strict = false; }
        if (messagePrefix === void 0) { messagePrefix = ''; }
        var _isObject = _.isObject(data);
        // apply validators/sanitizers
        for (var i = 0, c = schema['##'].v.length; i < c; i++) {
            var _isValidator = true;
            var _result = true;
            var _e = schema['##'].v[i];
            // custom validator/sanitizer; sanitizer can modify data by reference (v, k <= key, d <= reference) and must return [true]
            if (_.isFunction(_e.v)) {
                _isValidator = true;
                _result = _e.m = _e.v(data, key, ref);
            }
            else {
                if (validator[_e.v]) {
                    // try [validator]
                    _isValidator = _e.v.substr(0, 2) === 'is' || Validator._isValidators[_e.v];
                    _result = validator[_e.v](data, _e.a[0], _e.a[1], _e.a[2], _e.a[3]);
                }
                else if (_[_e.v]) {
                    // try [underscore]
                    _isValidator = _e.v.substr(0, 2) === 'is' || Validator._isValidators[_e.v];
                    _result = _[_e.v](data, _e.a[0], _e.a[1], _e.a[2], _e.a[3]);
                }
            }
            if (_isValidator) {
                if (_result !== true) {
                    errors[messagePrefix] = _e.m || false;
                    return false;
                }
            }
            else {
                key !== void 0 ? ref[key] = _result : null;
            }
        }
        // go through all nested in schema
        for (var k in schema) {
            var _message = messagePrefix ? messagePrefix + '.' + k : k;
            if (k !== '##' && k !== '[]') {
                if (_isObject) {
                    if (data[k]) {
                        if (this._validate(data[k], schema[k], tryAll, errors, strict, _message, k, data) || tryAll) {
                            continue;
                        }
                        else {
                            return false;
                        }
                    }
                    if (schema[k]['##'].d !== void 0) {
                        data[k] = schema[k]['##'].d;
                        continue;
                    }
                }
                if (strict || schema[k]['##'].s !== void 0) {
                    errors[_message] = schema[k]['##'].s || false;
                    if (tryAll === false) {
                        return false;
                    }
                }
            }
        }
        // go through each element if data is array
        if (_.isArray(data) && schema['[]']) {
            for (var i = 0, c = data.length; i < c; i++) {
                var result = this._validate(data[i], schema['[]'], tryAll, errors, strict, messagePrefix ? messagePrefix + '.' + i : i.toString(), i.toString(), data);
                if (result === false) {
                    return false;
                }
            }
        }
        return true;
    };
    Validator._isValidators = {
        contains: true,
        equals: true,
        matches: true,
    };
    return Validator;
}());
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Validator;
//# sourceMappingURL=deep-validator.js.map