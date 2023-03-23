/**
 * @file 值处理
 * @author linhuiw
 */

import { getProxyObj, getDefaultProxyString } from './utils';

const Observer = (obj, defaultKey = 'zh-CN') => {
  Object.keys(obj.__data__ || obj).forEach(key => {
    defineReactive(obj, key, defaultKey);
  });
  return obj;
};
const observe = value => {
  // 判断是否为object类型，是就继续执行Observer
  if (!value || typeof value !== 'object') {
    return;
  }
  Observer(value);
};

var defineReactive = (obj, key, defaultKey) => {
  var childObj = observe(obj[key]);
  Object.defineProperty(obj, key, {
    get() {
      if (obj.__data__[key]) {
        return getProxyObj(obj.__data__[key]);
      } else if (obj.__metas__[defaultKey][key]) {
        return getProxyObj(obj.__metas__[defaultKey][key]);
      } else {
        return getDefaultProxyString();
      }
    },
    set(newVal) {
      if (obj[key] === newVal) {
        return;
      }
      // 如果值有变化的话，做一些操作
      obj[key] = newVal;
      // 执行回调
      const cb = obj.callback[key];
      cb.call(obj);
      // 如果set进来的值为复杂类型，再递归它，加上set/get
      childObj = observe(newVal);
    }
  });
};

export default Observer;
