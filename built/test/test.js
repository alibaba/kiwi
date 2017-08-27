"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var assert = require("assert");
var index_1 = require("../src/index");
describe('intl-format', function () {
    before(function () {
        index_1.default.init('zh-cn', {
            'zh-cn': {
                test: '测试',
                testTemplate: '你有${value}条未读通知'
            }
        });
    });
    describe('get current value from certain language', function () {
        it('get key test value for current lanuage', function () {
            assert.equal(index_1.default.test, '测试');
        });
        it('Get method: get key test value for current lanuage', function () {
            assert.equal(index_1.default.get('test'), '测试');
        });
        it('Template method: get template values for current lanuage', function () {
            assert.equal(index_1.default.template(index_1.default.testTemplate, {
                value: 3
            }), '你有3条未读通知');
        });
    });
});
