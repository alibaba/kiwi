"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var assert = require("assert");
var index_1 = require("../src/index");
describe('IntlFormat', function () {
    var intlFormat;
    before(function () {
        intlFormat = index_1.default.init('zh-cn', {
            'zh-cn': {
                test: '测试',
                testTemplate: '你有${value}条未读通知',
                foo: {
                    bar: 'foobar'
                }
            }
        });
    });
    describe('get current value from certain language', function () {
        it('get key test value for current lanuage', function () {
            assert.equal(intlFormat.test, '测试');
        });
        it('Get method: get key test value for current lanuage', function () {
            assert.equal(intlFormat.get('test'), '测试');
        });
        it('Template method: get template values for current lanuage', function () {
            assert.equal(intlFormat.template(intlFormat.testTemplate, {
                value: 3
            }), '你有3条未读通知');
        });
        it('Different instance values', function () {
            var intlFormat1 = index_1.default.init('zh-cn', {
                'zh-cn': {
                    test: 'firstvalue'
                }
            });
            var intlFormat2 = index_1.default.init('zh-cn', {
                'zh-cn': {
                    test: 'secondvalue'
                }
            });
            assert.equal(intlFormat1.test, 'firstvalue');
            assert.equal(intlFormat2.test, 'secondvalue');
        });
        it('Get deep value', function () {
            assert.equal(intlFormat.foo.bar, 'foobar');
            assert.equal(intlFormat.get('foo.bar'), 'foobar');
        });
    });
});
