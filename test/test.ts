import * as assert from 'assert';
import I18N from '../src/index';

describe('intl-format', function() {
  before(function() {
    I18N.init('zh-cn', {
      'zh-cn': {
        test: '测试',
        testTemplate: '你有${value}条未读通知'
      }
    });
  });
  describe('get current value from certain language', function() {
    it('get key test value for current lanuage', function() {
      assert.equal(I18N.test, '测试');
    });
    it('Get method: get key test value for current lanuage', function() {
      assert.equal(I18N.get('test'), '测试');
    });
    it('Template method: get template values for current lanuage', function() {
      assert.equal(
        I18N.template(I18N.testTemplate, {
          value: 3
        }),
        '你有3条未读通知'
      );
    });
  });
});
