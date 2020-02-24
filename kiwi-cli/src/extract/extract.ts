/**
 * @author doubledream
 * @desc 提取指定文件夹下的中文
 */

import * as _ from 'lodash';
import * as randomstring from 'randomstring';
import * as slash from 'slash2';
import * as path from 'path';
import { getSpecifiedFiles, readFile, writeFile } from './file';
import { findChineseText } from './findChineseText';
import { getSuggestLangObj } from './getLangData';
import { translateText, findMatchKey, findMatchValue } from '../utils';
import { replaceAndUpdate, hasImportI18N, createImportI18N } from './replace';
import { getProjectConfig } from '../utils';

const CONFIG = getProjectConfig();

/**
 * 递归匹配项目中所有的代码的中文
 */
function findAllChineseText(dir: string) {
  const dirPath = path.resolve(process.cwd(), dir);
  const files = getSpecifiedFiles(dirPath, CONFIG.ignoreDir, CONFIG.ignoreFile);
  const filterFiles = files.filter(file => {
    return file.endsWith('.ts') || file.endsWith('.tsx');
  });
  const allTexts = filterFiles.reduce((pre, file) => {
    const code = readFile(file);
    const texts = findChineseText(code, file);

    if (texts.length > 0) {
      console.log(`${file} 发现中文文案`);
    }

    return texts.length > 0 ? pre.concat({ file, texts }) : pre;
  }, []);

  return allTexts;
}

/**
 * 递归匹配项目中所有的代码的中文
 * @param {dirPath} 文件夹路径
 */
function extractAll(dirPath?: string) {
  if (!CONFIG.googleApiKey) {
    console.log('请配置googleApiKey');
    return;
  }

  const dir = dirPath || './';
  const allTargetStrs = findAllChineseText(dir);

  if (allTargetStrs.length === 0) {
    console.log('没有发现可替换的文案！');
    return;
  }

  allTargetStrs.forEach(item => {
    const currentFilename = item.file;
    const targetStrs = item.texts;
    const suggestPageRegex = /\/pages\/\w+\/([^\/]+)\/([^\/\.]+)/;

    let suggestion = [];
    const finalLangObj = getSuggestLangObj();
    const virtualMemory = {};

    if (currentFilename.includes('/pages/')) {
      suggestion = currentFilename.match(suggestPageRegex);
    }
    if (suggestion) {
      suggestion.shift();
    }
    /** 如果没有匹配到 Key */
    if (!(suggestion && suggestion.length)) {
      const names = slash(currentFilename).split('/');
      const fileName = _.last(names) as any;
      const fileKey = fileName.split('.')[0].replace(new RegExp('-', 'g'), '_');
      const dir = names[names.length - 2].replace(new RegExp('-', 'g'), '_');
      if (dir === fileKey) {
        suggestion = [dir];
      } else {
        suggestion = [dir, fileKey];
      }
    }

    // 翻译中文文案
    const translatePromises = targetStrs.reduce((prev, curr) => {
      // 避免翻译的字符里包含数字或者特殊字符等情况
      const reg = /[^a-zA-Z\x00-\xff]+/g;
      const findText = curr.text.match(reg);
      const transText = findText ? findText.join('').slice(0, 4) : '中文符号';
      return prev.concat(translateText(transText, 'en_US'));
    }, []);

    Promise.all(translatePromises)
      .then(([...translateTexts]) => {
        const replaceableStrs = targetStrs.reduce((prev, curr, i) => {
          const key = findMatchKey(finalLangObj, curr.text);
          if (!virtualMemory[curr.text]) {
            if (key) {
              virtualMemory[curr.text] = key;
              return prev.concat({
                target: curr,
                key
              });
            }
            const uuidKey = `${randomstring.generate({
              length: 4,
              charset: 'qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM'
            })}`;
            const transText = translateTexts[i] ? _.camelCase(translateTexts[i] as string) : uuidKey;
            let transKey = `${suggestion.length ? suggestion.join('.') + '.' : ''}${transText}`;
            let occurTime = 1;
            // 防止出现前四位相同但是整体文案不同的情况
            while (
              findMatchValue(finalLangObj, transKey) !== curr.text &&
              _.keys(finalLangObj).includes(`${transKey}${occurTime >= 2 ? occurTime : ''}`)
            ) {
              occurTime++;
            }
            if (occurTime >= 2) {
              transKey = `${transKey}${occurTime}`;
            }
            virtualMemory[curr.text] = transKey;
            finalLangObj[transKey] = curr.text;
            return prev.concat({
              target: curr,
              key: transKey
            });
          } else {
            return prev.concat({
              target: curr,
              key: virtualMemory[curr.text]
            });
          }
        }, []);

        replaceableStrs
          .reverse()
          .reduce((prev, obj) => {
            return prev.then(() => {
              return replaceAndUpdate(currentFilename, obj.target, `I18N.${obj.key}`, false);
            });
          }, Promise.resolve())
          .then(() => {
            // 添加 import I18N
            if (!hasImportI18N(currentFilename)) {
              const code = createImportI18N(currentFilename);

              writeFile(currentFilename, code);
            }
            console.log(`${currentFilename}替换完成！`);
          })
          .catch(e => {
            console.log(e.message);
          });
      })
      .catch(err => {
        if (err) {
          console.log('google翻译出问题了...');
        }
      });
  });
}

export { extractAll };
