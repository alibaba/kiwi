"use strict";
var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
require("proxy-polyfill");
var I18N = {
    __lang__: 'zh-cn',
    __data__: {},
    __metas__: {},
    setLang: function (lang) {
        I18N.__lang__ = lang;
        I18N.__data__ = I18N.__metas__[lang];
    },
    init: function (lang, metas) {
        I18N.__lang__ = lang;
        I18N.__metas__ = metas;
        I18N.__data__ = metas[lang];
    },
    getProp: function (obj, is, value) {
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
            var prop = is.shift();
            if (value !== undefined && obj[prop] === undefined) {
                obj[prop] = {};
            }
            return I18N.getProp(obj[prop], is, value);
        }
    },
    template: function (str, args) {
        if (!str)
            return '';
        return str.replace(/\$\{(.+?)\}/g, function (match, p1) {
            return I18N.getProp(__assign({}, args, I18N.__data__), p1);
        });
    },
    get: function (str) {
        return Reflect.get(I18N.__data__, str);
    }
};
var getLang = new Proxy(I18N, {
    get: function (target, property, receiver) {
        if (property === 'setLang' ||
            property === 'get' ||
            property === 'template' ||
            property === 'init') {
            return function () {
                return target[property].apply(this, arguments);
            };
        }
        return I18N.__data__[property];
    }
});
exports.getLang = getLang;
exports.default = getLang;
