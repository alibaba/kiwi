import IntlFormat from '../src/index';

const intlFormat = IntlFormat.init('zh-CN', {
  'zh-CN': {
    test: '测试',
    testTemplate: '你有{value}条未读通知',
    foo: {
      bar: 'foobar'
    },
    photo: '我{num, plural, =0 {没有照片} =1 {有1张照片} other {有#张照片}}'
  }
});
console.log(intlFormat.test, 'intlFormat.test');
