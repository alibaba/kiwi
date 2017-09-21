"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Observer = function (obj) {
    Object.keys(obj).forEach(function (key) {
        defineReactive(obj, key);
    });
    return obj;
};
var observe = function (value) {
    if (!value || typeof value !== 'object') {
        return;
    }
    Observer(value);
};
var defineReactive = function (obj, key) {
    var childObj = observe(obj.__data__[key]);
    Object.defineProperty(obj, key, {
        get: function () {
            return obj.__data__[key];
        },
        set: function (newVal) {
            if (obj.__data__[key] === newVal) {
                return;
            }
            obj.__data__[key] = newVal;
            var cb = obj.callback[key];
            cb.call(obj);
            childObj = observe(newVal);
        }
    });
};
exports.default = Observer;
