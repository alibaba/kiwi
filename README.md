# intl-format
I18N tools for universal javascrit apps, easy use & better api;

### How To Use
Init this I18N tools

```javascript
import IntlFormat from 'intl-format';

const intlFormat = IntlFormat.init('en-UK', {
  'en-UK': {
    test: 'testvalue',
    testTemplate: 'you have {value} unread message',
    photo: "You have {num, plural, =0 {no photos.} =1 {one photo.} other {# photos.}}"
  },
  'zh-CN': {
    lang: '语言'
  }
});
```
Then use it in your components

```javascript
intlFormat.test; // testvalue;

intlFormat.get('test'); // testvalue;

intlFormat.get('testTemplate', {
  value: three
}); // value is 'you have three unread message'

intlFormat.template(intlFormat.testTemplate, {
  value: three
}); // value is 'you have three unread message'

intlFormat.get('photo', {
  num: 0
}); // value is 'You have no photos.'
```

How to change default language?
```javascript
intlFormat.setLang('zh-cn'); // change the default language to zh-cn;
```

### License
MIT