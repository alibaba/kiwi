/**
 * @author linhuiw
 * @desc 翻译文件
 */
require('ts-node').register({
  compilerOptions: {
    module: 'commonjs'
  }
});
import * as fs from 'fs';
import * as path from 'path';
import * as _ from 'lodash';
import { traverse, getProjectConfig, getLangDir } from './utils';
const CONFIG = getProjectConfig();

/**
 * 获取中文文案文件的翻译，优先使用已有翻译，若找不到则使用 google 翻译
 * */
function getTranslations(file, toLang) {
  const translations = {};
  const fileNameWithoutExt = path.basename(file).split('.')[0];
  const srcLangDir = getLangDir(CONFIG.srcLang);
  const distLangDir = getLangDir(toLang);
  const srcFile = path.resolve(srcLangDir, file);
  const distFile = path.resolve(distLangDir, file);
  const { default: texts } = require(srcFile);
  let distTexts;
  if (fs.existsSync(distFile)) {
    const distTexts = require(distFile).default;
  }

  traverse(texts, (text, path) => {
    const key = fileNameWithoutExt + '.' + path;
    const distText = _.get(distTexts, path);
    translations[key] = distText || text;
  });

  return translations;
}

/**
 * 将翻译写入文件
 * */
function writeTranslations(file, toLang, translations) {
  const fileNameWithoutExt = path.basename(file).split('.')[0];
  const srcLangDir = getLangDir(CONFIG.srcLang);
  const srcFile = path.resolve(srcLangDir, file);
  const { default: texts } = require(srcFile);
  const rst = {};

  traverse(texts, (text, path) => {
    const key = fileNameWithoutExt + '.' + path;
    // 使用 setWith 而不是 set，保证 numeric key 创建的不是数组，而是对象
    // https://github.com/lodash/lodash/issues/1316#issuecomment-120753100
    _.setWith(rst, path, translations[key], Object);
  });

  const fileContent = 'export default ' + JSON.stringify(rst, null, 2);
  const filePath = path.resolve(getLangDir(toLang), path.basename(file));
  return new Promise((resolve, reject) => {
    fs.writeFile(filePath, fileContent, err => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

/**
 * 翻译对应的文件
 * @param file
 * @param toLang
 */
function translateFile(file, toLang) {
  const translations = getTranslations(file, toLang);
  const toLangDir = path.resolve(__dirname, `../${toLang}`);
  if (!fs.existsSync(toLangDir)) {
    fs.mkdirSync(toLangDir);
  }

  writeTranslations(file, toLang, translations);
}

/**
 * 翻译所有文件
 */
function sync(callback?) {
  const srcLangDir = getLangDir(CONFIG.srcLang);
  fs.readdir(srcLangDir, (err, files) => {
    if (err) {
      console.error(err);
    } else {
      files = files.filter(file => file.endsWith('.ts') && file !== 'index.ts' && file !== 'mock.ts').map(file => file);
      const translateFiles = toLang =>
        Promise.all(
          files.map(file => {
            translateFile(file, toLang);
          })
        );
      Promise.all(CONFIG.distLangs.map(translateFiles)).then(
        () => {
          const langDirs = CONFIG.distLangs.map(getLangDir);
          langDirs.map(dir => {
            const filePath = path.resolve(dir, 'index.ts');
            if (!fs.existsSync(dir)) {
              fs.mkdirSync(dir);
            }
            fs.copyFileSync(path.resolve(srcLangDir, 'index.ts'), filePath);
          });
          callback && callback();
        },
        e => {
          console.error(e);
          process.exit(1);
        }
      );
    }
  });
}

export { sync };
