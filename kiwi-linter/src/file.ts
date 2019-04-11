/**
 * @author linhuiw
 * @desc 文件相关操作
 */
import * as fs from 'fs-extra';
import * as _ from 'lodash';
import * as prettier from 'prettier';
import { LANG_PREFIX } from './const';

/**
 * 使用 Prettier 格式化文件
 * @param fileContent
 */
export function prettierFile(fileContent) {
  try {
    return prettier.format(fileContent, {
      parser: 'typescript',
      trailingComma: 'all',
      singleQuote: true
    });
  } catch (e) {
    console.error(`代码格式化报错！${e.toString()}\n代码为：${fileContent}`);
    return fileContent;
  }
}

export function generateNewLangFile(key: string, value: string) {
  const obj = _.set({}, key, value);

  return prettierFile(`export default ${JSON.stringify(obj, null, 2)}`);
}

export function addImportToMainLangFile(newFilename: string) {
  let mainContent = fs.readFileSync(`${LANG_PREFIX}index.ts`, 'utf8');
  mainContent = mainContent.replace(
    /^(\s*import.*?;)$/m,
    `$1\nimport ${newFilename} from './${newFilename}';`
  );
  if (/\,\n(}\);)/.test(mainContent)) {
    /** 最后一行包含,号 */
    mainContent = mainContent.replace(/(}\);)/, `  ${newFilename},\n$1`);
  } else {
    /** 最后一行不包含,号 */
    mainContent = mainContent.replace(/\n(}\);)/, `,\n  ${newFilename},\n$1`);
  }
  fs.writeFileSync(`${LANG_PREFIX}index.ts`, mainContent);
}
