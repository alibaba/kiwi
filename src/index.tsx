/**
 * I18N Tools
 * @author @linhuiw
 */
import 'proxy-polyfill';

const I18N = {
  __lang__: 'zh-cn',
  __data__: {},
  __metas__: {},
  setLang: (lang: string) => {
    I18N.__lang__ = lang;
    I18N.__data__ = I18N.__metas__[lang];
  },
  init: (lang: string, metas: object) => {
    I18N.__lang__ = lang;
    I18N.__metas__ = metas;
    I18N.__data__ = metas[lang];
  },
  getProp: (obj, is, value?) => {
    if (typeof is === 'string') {
      is = is.split('.');
    }
    if (is.length === 1 && value !== undefined) {
      return (obj[is[0]] = value);
    } else if (is.length === 0) {
      return obj;
    } else {
      const prop = is.shift();
      if (value !== undefined && obj[prop] === undefined) {
        obj[prop] = {};
      }
      return I18N.getProp(obj[prop], is, value);
    }
  },
  template: (str, args) => {
    if (!str) return '';
    return str.replace(/\$\{(.+?)\}/g, (match, p1) => {
      return I18N.getProp(
        {
          ...args,
          ...I18N.__data__
        },
        p1
      );
    });
  },
  get: str => {
    return Reflect.get(I18N.__data__, str);
  }
};

const getLang: any = new Proxy(I18N, {
  get(target, property, receiver) {
    if (
      property === 'setLang' ||
      property === 'get' ||
      property === 'template' ||
      property === 'init'
    ) {
      return function() {
        return target[property].apply(this, arguments);
      };
    }
    return I18N.__data__[property];
  }
});

export { getLang };
export default getLang;
