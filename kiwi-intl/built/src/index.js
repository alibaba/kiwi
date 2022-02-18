import IntlMessageFormat from 'intl-messageformat';
import * as lodashGet from 'lodash.get';
import Observer from './Observer';
class I18N {
    constructor(lang, metas, defaultKey) {
        this.__lang__ = lang;
        this.__metas__ = metas;
        this.__data__ = metas[lang];
        this.__defaultKey__ = defaultKey;
    }
    setLang(lang) {
        this.__lang__ = lang;
        this.__data__ = this.__metas__[lang];
    }
    getProp(obj, is, value) {
        if (typeof is === 'string') {
            is = is.split('.');
        }
        if (is.length === 1 && value !== undefined) {
            return (obj[is[0]] = value);
        }
        else if (is.length === 0) {
            return obj;
        }
        else {
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
            return this.getProp(Object.assign({}, this.__data__, args), p1);
        });
    }
    get(str, args) {
        let msg = lodashGet(this.__data__, str);
        if (!msg) {
            msg = lodashGet(this.__metas__[this.__defaultKey__ || 'zh-CN'], str, str);
        }
        if (args) {
            try {
                msg = new IntlMessageFormat(msg, this.__lang__);
                msg = msg.format(args);
                return msg;
            }
            catch (err) {
                console.warn(`kiwi-intl format message failed for key='${str}'`, err);
                return '';
            }
        }
        else {
            return msg;
        }
    }
}
const IntlFormat = {
    init: (lang, metas, defaultKey) => {
        const i18n = new I18N(lang, metas, defaultKey);
        return Observer(i18n, defaultKey);
    }
};
export { IntlFormat };
export default IntlFormat;
//# sourceMappingURL=index.js.map