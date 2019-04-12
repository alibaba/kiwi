/**
 * @author linhuiw
 * @desc 导出未翻译文件
 */
require('ts-node').register({
  compilerOptions: {
    module: 'commonjs'
  }
});
import * as fs from 'fs';
import * as path from 'path';
import { tsvFormatRows } from 'd3-dsv';
import { getKiwiDir, getLangDir, traverse, getProjectConfig } from './utils';
import * as _ from 'lodash';

function getLangUnTranslate(lang?: string) {
  const messagesToTranslate = [];
  const srcLangDir = path.resolve(getKiwiDir(), 'zh-CN');
  let files = fs.readdirSync(srcLangDir);
  files = files.filter(file => file.endsWith('.ts') && file !== 'index.ts');

  files.map(file => {
    const srcFile = path.resolve(srcLangDir, file);
    const { default: messages } = require(srcFile);
    const distFile = path.resolve(getLangDir(lang), file);
    let dstMessages;
    if (fs.existsSync(distFile)) {
      dstMessages = require(distFile).default;
    }

    traverse(messages, (text, path) => {
      const distText = _.get(dstMessages, path);
      if (distText === text) {
        messagesToTranslate.push([path, text]);
      }
    });
  });
  return messagesToTranslate;
}

function exportMessages(lang?: string) {
  const CONFIG = getProjectConfig();
  const langs = lang ? [lang] : CONFIG.distLangs;
  langs.map(lang => {
    const unTranslateMessages = getLangUnTranslate(lang);
    if (unTranslateMessages.length === 0) {
      console.log(`${lang} 该语言文件以及全部被翻译`);
    }
    const content = tsvFormatRows(unTranslateMessages);
    fs.writeFileSync(`./export-${lang}`, content);
    console.log(`${lang} 该语言导出 ${unTranslateMessages.length} 未翻译文案.`);
  });
}

export { exportMessages };
