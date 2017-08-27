# intl-format
I18N tools for universal javascrit apps, easy use & better api;

### How To Use

Init this I18N tools
```js
I18N.init('en-uk', {
  'en-uk': {
    test: 'testvalue',
    testTemplate: 'you have ${value} unread message'
  }
});
```
Then use it in your components

```js
import IntlFormat from 'intl-format';
IntlFormat.test ====> testvalue;
IntlFormat.get('test')   ====> testvalue;
I18N.template(I18N.testTemplate, {
  value: three
});  // value is 'you have three unread message'
```

### License
MIT