import * as assert from 'assert';
import IntlFormat from '../src/index';
describe('IntlFormat', function() {
  let intlFormat;
  before(function() {
    intlFormat = IntlFormat.init('zh-CN', {
      'zh-CN': {
        value: '值',
        test: '测试',
        testTemplate: '你有{value}条未读通知',
        foo: {
          bar: 'foobar'
        },
        photo: '我{num, plural, =0 {没有照片} =1 {有1张照片} other {有#张照片}}'
      },
      'en-US': {
        value: 'value'
      }
    });
  });
  describe('get current value from certain language', function() {
    it('get key test value for current lanuage', function() {
      assert.equal(intlFormat.test, '测试');
    });
    it('Get method: get key test value for current lanuage', function() {
      assert.equal(intlFormat.get('test'), '测试');
      assert.equal(
        intlFormat.get('photo', {
          num: 0
        }),
        '我没有照片'
      );
      assert.equal(
        intlFormat.get('photo', {
          num: 1
        }),
        '我有1张照片'
      );
      assert.equal(
        intlFormat.get('photo', {
          num: 1000
        }),
        '我有1,000张照片'
      );
    });
    it('Template method: get template values for current lanuage', function() {
      assert.equal(
        intlFormat.template(intlFormat.testTemplate, {
          value: 3
        }),
        '你有3条未读通知'
      );
      assert.equal(
        intlFormat.get('testTemplate', {
          value: 3
        }),
        '你有3条未读通知'
      );
    });
    it('Different instance values', function() {
      const intlFormat1: any = IntlFormat.init('zh-CN', {
        'zh-CN': {
          test: 'firstvalue'
        }
      });
      const intlFormat2: any = IntlFormat.init('zh-CN', {
        'zh-CN': {
          test: 'secondvalue'
        }
      });
      assert.equal(intlFormat1.test, 'firstvalue');
      assert.equal(intlFormat2.test, 'secondvalue');
    });
    it('Get deep value', function() {
      assert.equal(intlFormat.foo.bar, 'foobar');
      assert.equal(intlFormat.get('foo.bar'), 'foobar');
    });
    it('获取默认中文值', function() {
      intlFormat.setLang('en-US');
      assert.equal(intlFormat.foo.bar, 'foobar');
      assert.equal(intlFormat.get('foo.bar'), 'foobar');
    });
  });
});
