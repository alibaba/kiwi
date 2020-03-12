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
import { tsvFormatRows } from 'd3-dsv';
import { getAllMessages, getProjectConfig } from './utils';
import * as _ from 'lodash';

function exportMessages(file?: string, lang?: string) {
  const CONFIG = getProjectConfig();
  const langs = lang ? [lang] : CONFIG.distLangs;

  langs.map(lang => {
    const allMessages = getAllMessages(CONFIG.srcLang);
    const existingTranslations = getAllMessages(
      lang,
      (message, key) => !/[\u4E00-\u9FA5]/.test(allMessages[key]) || allMessages[key] !== message
    );
    const messagesToTranslate = Object.keys(allMessages)
      .filter(key => !existingTranslations.hasOwnProperty(key))
      .map(key => {
        let message = allMessages[key];
        message = JSON.stringify(message).slice(1, -1);
        return [key, message];
      });

    if (messagesToTranslate.length === 0) {
      console.log('All the messages have been translated.');
      return;
    }

    const content = tsvFormatRows(messagesToTranslate);
    const sourceFile = file || `./export-${lang}`;
    fs.writeFileSync(sourceFile, content);
    console.log(`Exported ${messagesToTranslate.length} message(s).`);
  });
}

export { exportMessages };
