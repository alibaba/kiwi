"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Observer = function (obj) {
    Object.keys(obj.__data__ || obj).forEach(function (key) {
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
    var childObj = observe(obj[key]);
    Object.defineProperty(obj, key, {
        get: function () {
            if (obj.__data__[key]) {
                return obj.__data__[key];
            }
            else if (obj.__metas__['zh-CN'][key]) {
                return obj.__metas__['zh-CN'][key];
            }
        },
        set: function (newVal) {
            if (obj[key] === newVal) {
                return;
            }
            obj[key] = newVal;
            var cb = obj.callback[key];
            cb.call(obj);
            childObj = observe(newVal);
        }
    });
};
exports.default = Observer;
//# sourceMappingURL=Observer.js.map