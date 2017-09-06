/**
 * I18N Tools
 * @author @linhuiw
 */
import 'proxy-polyfill';
import IntlMessageFormat from 'intl-messageformat';
import { get as lodashGet } from 'lodash';

class I18N {
  __lang__: string;
  __metas__: any;
  __data__: any;
  constructor(lang: string, metas: object) {
    this.__lang__ = lang;
    this.__metas__ = metas;
    this.__data__ = metas[lang];
  }
  setLang(lang: string) {
    this.__lang__ = lang;
    this.__data__ = this.__metas__[lang];
  }
  getProp(obj, is, value?) {
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
      return this.getProp(obj[prop], is, value);
    }
  }
  template(str, args) {
    if (!str) {
      return '';
    }
    return str.replace(/\{(.+?)\}/g, (match, p1) => {
      return this.getProp(
        {
          ...args,
          ...this.__data__
        },
        p1
      );
    });
  }
  get(str, options?) {
    let msg = lodashGet(this.__data__, str, str);
    if (options) {
      try {
        msg = new IntlMessageFormat(msg, this.__lang__);
        msg = msg.format(options);
        return msg;
      } catch (err) {
        console.warn(`intl-format format message failed for key='${str}'`, err);
        return '';
      }
    } else {
      return msg;
    }
  }
}

const IntlFormat = {
  init: (lang: string, metas: object) => {
    const i18n = new I18N(lang, metas);
    const getLang = new Proxy(i18n, {
      get(target, property, receiver) {
        if (
          property === 'setLang' ||
          property === 'get' ||
          property === 'template' ||
          property === 'init'
        ) {
          return function() {
            return target[property].apply(i18n, arguments);
          };
        }
        return i18n.get(property);
      }
    });
    return getLang;
  }
};

export { IntlFormat };
export default IntlFormat;