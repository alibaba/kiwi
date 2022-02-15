const Observer = (obj, defaultKey = 'zh-CN') => {
    Object.keys(obj.__data__ || obj).forEach(key => {
        defineReactive(obj, key, defaultKey);
    });
    return obj;
};
const observe = value => {
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
                return obj.__data__[key];
            }
            else if (obj.__metas__[defaultKey][key]) {
                return obj.__metas__[defaultKey][key];
            }
        },
        set(newVal) {
            if (obj[key] === newVal) {
                return;
            }
            obj[key] = newVal;
            const cb = obj.callback[key];
            cb.call(obj);
            childObj = observe(newVal);
        }
    });
};
export default Observer;
//# sourceMappingURL=Observer.js.map