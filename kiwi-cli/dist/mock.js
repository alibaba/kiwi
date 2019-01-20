"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @author linhuiw
 * @desc 翻译方法
 */
const utils_1 = require("./utils");
const CONFIG = utils_1.getProjectConfig();
const { translate: googleTranslate } = require('google-translate')(CONFIG.googleApiKey);
const utils_2 = require("./utils");
const const_1 = require("./const");
function translateText(text, toLang) {
    function _translateText() {
        return utils_2.withTimeout(new Promise((resolve, reject) => {
            googleTranslate(text, 'zh', const_1.PROJECT_CONFIG.langMap[toLang], (err, translation) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(translation.translatedText);
                }
            });
        }), 3000);
    }
    return utils_2.retry(_translateText, 3);
}
exports.translateText = translateText;
//# sourceMappingURL=mock.js.map