/**
 * @author doubledream
 * @desc 提取指定文件夹下的中文
 */

import * as _ from 'lodash';
import slash from 'slash2';
import * as path from 'path';
import * as fs from 'fs';
import * as colors from 'colors';

import { getSpecifiedFiles, readFile, writeFile, isFile, isDirectory } from './file';
import { findChineseText } from './findChineseText';
import { getSuggestLangObj } from './getLangData';
import {
  translateText,
  findMatchKey,
  findMatchValue,
  translateKeyText,
  successInfo,
  failInfo,
  highlightText
} from '../utils';
import { replaceAndUpdate, hasImportI18N, createImportI18N } from './replace';
import { getProjectConfig } from '../utils';

const CONFIG = getProjectConfig();

/**
 * 获取已存在的 lang 文件名列表（不含扩展名，不含 index）
 */
function getExistingLangFiles(): string[] {
  const srcLangDir = path.resolve(CONFIG.kiwiDir, CONFIG.srcLang);
  if (!fs.existsSync(srcLangDir)) return [];
  return fs
    .readdirSync(srcLangDir)
    .filter(f => f.endsWith(`.${CONFIG.fileType}`) && f !== `index.${CONFIG.fileType}`)
    .map(f => f.replace(`.${CONFIG.fileType}`, ''));
}

/**
 * 检查 suggestion 的第一个元素（作为 lang 文件名）是否与已有文件存在大小写冲突
 * 如果存在，使用已有文件的命名以保证一致性
 */
function resolveFilenameCasing(suggestion: string[]): string[] {
  if (!suggestion || !suggestion.length) return suggestion;
  const existingFiles = getExistingLangFiles();
  const firstName = suggestion[0];
  const match = existingFiles.find(f => f.toLowerCase() === firstName.toLowerCase());
  if (match && match !== firstName) {
    // 存在大小写冲突，使用已有文件的命名
    suggestion[0] = match;
  }
  return suggestion;
}

/**
 * 剔除 kiwiDir 下的文件
 */
function removeLangsFiles(files: string[]) {
  const langsDir = path.resolve(process.cwd(), CONFIG.kiwiDir);
  return files.filter(file => {
    const completeFile = path.resolve(process.cwd(), file);
    return !completeFile.includes(langsDir);
  });
}

/**
 * 递归匹配项目中所有的代码的中文
 */
function findAllChineseText(dir: string) {
  const first = dir.split(',')[0];
  let files = [];
  if (isDirectory(first)) {
    const dirPath = path.resolve(process.cwd(), dir);
    files = getSpecifiedFiles(dirPath, CONFIG.ignoreDir, CONFIG.ignoreFile);
  } else {
    files = removeLangsFiles(dir.split(','));
  }
  const filterFiles = files.filter(file => {
    return (
      (isFile(file) && file.endsWith('.ts')) ||
      file.endsWith('.tsx') ||
      file.endsWith('.vue') ||
      file.endsWith('.js') ||
      file.endsWith('.jsx')
    );
  });
  const allTexts = filterFiles.reduce((pre, file) => {
    const code = readFile(file);
    const texts = findChineseText(code, file);
    // 调整文案顺序，保证从后面的文案往前替换，避免位置更新导致替换出错
    const sortTexts = _.sortBy(texts, obj => -obj.range.start);
    if (texts.length > 0) {
      console.log(`${highlightText(file)} 发现 ${highlightText(texts.length)} 处中文文案`);
    }

    return texts.length > 0 ? pre.concat({ file, texts: sortTexts }) : pre;
  }, []);

  return allTexts;
}

/**
 * 处理作为key值的翻译原文
 */
function getTransOriginText(text: string) {
  // 避免翻译的字符里包含数字或者特殊字符等情况，只过滤出汉字和字母
  const reg = /[a-zA-Z\u4e00-\u9fa5]+/g;
  const findText = text.match(reg) || [];
  const transOriginText = findText ? findText.join('').slice(0, 5) : '中文符号';

  return transOriginText;
}

/**
 * @param currentFilename 文件路径
 * @returns string[]
 */
function getSuggestion(currentFilename: string) {
  let suggestion = [];
  const suggestPageRegex = /\/pages\/\w+\/([^\/]+)\/([^\/\.]+)/;

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

  return resolveFilenameCasing(suggestion);
}

/**
 * 统一处理key值，已提取过的文案直接替换，翻译后的key若相同，加上出现次数
 * @param currentFilename 文件路径
 * @param langsPrefix 替换后的前缀
 * @param translateTexts 翻译后的key值
 * @param targetStrs 当前文件提取后的文案
 * @returns any[] 最终可用于替换的key值和文案
 */
function getReplaceableStrs(currentFilename: string, langsPrefix: string, translateTexts: string[], targetStrs: any[]) {
  const finalLangObj = getSuggestLangObj();
  const virtualMemory = {};
  const suggestion = getSuggestion(currentFilename);
  const replaceableStrs = targetStrs.reduce((prev, curr, i) => {
    const _text = curr.text;
    let key = findMatchKey(finalLangObj, _text);
    if (key) {
      key = key.replace(/-/g, '_');
    }
    if (!virtualMemory[_text]) {
      if (key) {
        virtualMemory[_text] = key;
        return prev.concat({
          target: curr,
          key,
          needWrite: false
        });
      }
      const transText = translateTexts[i] && _.camelCase(translateTexts[i] as string);
      let transKey = `${suggestion.length ? suggestion.join('.') + '.' : ''}${transText}`;
      transKey = transKey.replace(/-/g, '_');
      if (langsPrefix) {
        transKey = `${langsPrefix}.${transText}`;
      }
      let occurTime = 1;
      // 防止出现前四位相同但是整体文案不同的情况
      while (
        findMatchValue(finalLangObj, transKey) !== _text &&
        _.keys(finalLangObj).includes(`${transKey}${occurTime >= 2 ? occurTime : ''}`)
      ) {
        occurTime++;
      }
      if (occurTime >= 2) {
        transKey = `${transKey}${occurTime}`;
      }
      virtualMemory[_text] = transKey;
      finalLangObj[transKey] = _text;
      return prev.concat({
        target: curr,
        key: transKey,
        needWrite: true
      });
    } else {
      return prev.concat({
        target: curr,
        key: virtualMemory[_text],
        needWrite: true
      });
    }
  }, []);

  return replaceableStrs;
}

/**
 * 递归匹配项目中所有的代码的中文
 * @param {dirPath} 文件夹路径
 */
function extractAll({ dirPath, prefix }: { dirPath?: string; prefix?: string }) {
  const dir = dirPath || './';
  // 去除I18N
  const langsPrefix = prefix ? prefix.replace(/^I18N\./, '') : null;
  // 翻译源配置错误，则终止
  const origin = CONFIG.defaultTranslateKeyApi || 'Pinyin';
  if (!['Pinyin', 'Google', 'Baidu'].includes(CONFIG.defaultTranslateKeyApi)) {
    console.log(
      `Kiwi 仅支持 ${highlightText('Pinyin、Google、Baidu')}，请修改 ${highlightText('defaultTranslateKeyApi')} 配置项`
    );
    return;
  }

  const allTargetStrs = findAllChineseText(dir);
  if (allTargetStrs.length === 0) {
    console.log(highlightText('没有发现可替换的文案！'));
    return;
  }

  // 提示翻译源
  if (CONFIG.defaultTranslateKeyApi === 'Pinyin') {
    console.log(
      `当前使用 ${highlightText('Pinyin')} 作为key值的翻译源，若想得到更好的体验，可配置 ${highlightText(
        'googleApiKey'
      )} 或 ${highlightText('baiduApiKey')}，并切换 ${highlightText('defaultTranslateKeyApi')}`
    );
  } else {
    console.log(`当前使用 ${highlightText(CONFIG.defaultTranslateKeyApi)} 作为key值的翻译源`);
  }

  console.log('即将截取每个中文文案的前5位翻译生成key值，并替换中...');

  /**
   * 对单个文件执行一轮提取替换
   * @param currentFilename 文件路径
   * @param texts 待替换的中文文案列表（已按 start 降序排列）
   * @param depth 当前递归深度，防止无限递归
   */
  const extractAndReplace = async (currentFilename: string, texts: any[], depth = 0) => {
    // 过滤掉模板字符串内的中文，避免替换时位置冲突
    const targetStrs = texts.reduce((pre, strObj, i) => {
      const afterStrs = texts.slice(i + 1);
      if (afterStrs.some(obj => strObj.range.end <= obj.range.end)) {
        return pre;
      }
      return pre.concat(strObj);
    }, []);
    const filteredCount = texts.length - targetStrs.length;
    if (filteredCount > 0 && depth === 0) {
      console.log(
        colors.yellow(`存在 ${highlightText(filteredCount)} 处模板字符串变量中的嵌套中文，将在下一轮提取中处理`)
      );
    }

    // 翻译生成 key
    let translateTexts;
    if (origin !== 'Google') {
      const delimiter = origin === 'Baidu' ? '\n' : '$';
      const translateOriginTexts = targetStrs.reduce((prev, curr, i) => {
        const transOriginText = getTransOriginText(curr.text);
        if (i === 0) return transOriginText;
        return `${prev}${delimiter}${transOriginText}`;
      }, []);
      translateTexts = await translateKeyText(translateOriginTexts, origin);
    } else {
      const translatePromises = targetStrs.reduce((prev, curr) => {
        return prev.concat(translateText(getTransOriginText(curr.text), 'en_US'));
      }, []);
      [...translateTexts] = await Promise.all(translatePromises);
    }

    if (translateTexts.length === 0) {
      failInfo(`未得到翻译结果，${currentFilename}替换失败！`);
      return;
    }

    // 生成可替换的 key-value 对并执行替换
    const replaceableStrs = getReplaceableStrs(currentFilename, langsPrefix, translateTexts, targetStrs);
    await replaceableStrs
      .reduce((prev, obj) => {
        return prev.then(() => {
          return replaceAndUpdate(currentFilename, obj.target, `I18N.${obj.key}`, false, obj.needWrite);
        });
      }, Promise.resolve())
      .then(() => {
        if (!hasImportI18N(currentFilename)) {
          const code = createImportI18N(currentFilename);
          writeFile(currentFilename, code);
        }
        successInfo(`${currentFilename} ${depth > 0 ? '嵌套文案' : ''}替换完成，共替换 ${targetStrs.length} 处文案！`);
      })
      .catch(e => {
        failInfo(e.message);
      });

    // 如果有被过滤的嵌套文案，递归处理（最多递归 3 层）
    if (filteredCount > 0 && depth < 3) {
      const updatedCode = readFile(currentFilename);
      const remainingTexts = findChineseText(updatedCode, currentFilename);
      const sortRemaining = _.sortBy(remainingTexts, obj => -obj.range.start);
      if (sortRemaining.length > 0) {
        console.log(
          `${currentFilename} 发现 ${highlightText(sortRemaining.length)} 处嵌套中文，进行第 ${depth + 2} 轮提取...`
        );
        await extractAndReplace(currentFilename, sortRemaining, depth + 1);
      }
    }
  };

  // 对当前文件进行文案key生成和替换
  const generateKeyAndReplace = async item => {
    const currentFilename = item.file;
    console.log(`${currentFilename} 替换中...`);
    await extractAndReplace(currentFilename, item.texts);
  };

  allTargetStrs
    .reduce((prev, current) => {
      return prev.then(() => {
        return generateKeyAndReplace(current);
      });
    }, Promise.resolve())
    .then(() => {
      successInfo('全部替换完成！');
    })
    .catch((e: any) => {
      failInfo(e.message);
    });
}

export { extractAll };
