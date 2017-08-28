# intl-format
I18N tools for universal javascrit apps, easy use & better api;

### How To Use

Init this I18N tools
```javascript
IntlFormat.init('en-uk', {
  'en-uk': {
    test: 'testvalue',
    testTemplate: 'you have ${value} unread message'
  },
  'zh-cn': {
    lang: '语言'
  }
});
```
Then use it in your components

```javascript
import IntlFormat from 'intl-format';

IntlFormat.test; // testvalue;

IntlFormat.get('test'); // testvalue;

IntlFormat.template(IntlFormat.testTemplate, {
  value: three
}); // value is 'you have three unread message'
```

How to change default language?
```javascript
IntlFormat.setLang('zh-cn'); // change the default language to zh-cn;
```

### License
MIT