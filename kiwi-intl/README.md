# 🐤 kiwi-intl [![npm version](https://badge.fury.io/js/kiwi-intl.svg)](http://badge.fury.io/js/kiwi-intl)

通用的国际化框架，不绑定任何框架。

## 如何使用

> yarn add kiwi-intl

> 推荐与[🐤 Kiwi-国际化全流程解决方案](https://github.com/nefe/kiwi)结合使用

## 使用 API

初始化国际化框架

```javascript
import KiwiIntl from 'kiwi-intl';

const kiwiIntl = KiwiIntl.init('en-UK', {
  'en-UK': {
    test: 'testvalue',
    testTemplate: 'you have {value} unread message',
    photo:
      'You have {num, plural, =0 {no photos.} =1 {one photo.} other {# photos.}}'
  },
  'zh-CN': {
    lang: '语言'
  }
});
```

在组件中直接使用，支持模板, 单复数。同时支持 `kiwiIntl.test`,直接取对应 Key 值。

```javascript

kiwiIntl.test; // testvalue;

kiwiIntl.get('test'); // testvalue;

kiwiIntl.get('testTemplate', {
  value: three
}); // 值是 'you have three unread message'

kiwiIntl.template(kiwiIntl.testTemplate, {
  value: three
}); // 值是 'you have three unread message'

kiwiIntl.get('photo', {
  num: 0
}); // 值是 'You have no photos.'
```

切换语言

```javascript
kiwiIntl.setLang('zh-CN'); // 切换到中文语言
```

### License

MIT
