import IntlFormat from '../src/index';
const intlFormat = IntlFormat.init('zh-CN', {
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
console.log(intlFormat.test, 'intlFormat.test');
console.log(intlFormat.template(intlFormat.testTemplate, {
    value: '22'
}), 'intlFormat.testTemplate');
intlFormat.setLang('en-US');
console.log(intlFormat.get('foo.bar'), 'get foo bar');
//# sourceMappingURL=demo.js.map