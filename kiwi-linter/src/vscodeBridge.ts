import * as vscode from 'vscode';
import * as fs from 'fs-extra';
import * as _ from 'lodash';

import { findPositionInCode as findPositionInCodeUtil } from './utils';
import { generateNewLangFile, addImportToMainLangFile ,prettierFile} from './file';
import { LANG_PREFIX } from './const';
import { getLangData } from './getLangData';

export function findPositionInCode(text: string, code: string) {
    const { lineNum, chNum } = findPositionInCodeUtil(text, code);
    return new vscode.Position(lineNum, chNum);
}


export function updateLangFiles(
    lang: string,
    text: string,
    validateDuplicate: boolean
) {
    if (!lang.startsWith('I18N.')) {
        return;
    }

    const [, filename, ...restPath] = lang.split('.');
    const fullKey = restPath.join('.');
    const targetFilename = `${LANG_PREFIX}${filename}.ts`;

    if (!fs.existsSync(targetFilename)) {
        fs.writeFileSync(targetFilename, generateNewLangFile(fullKey, text));
        addImportToMainLangFile(filename);
        vscode.window.showInformationMessage(`成功新建语言文件 ${targetFilename}`);
    } else {
        // 清除 require 缓存，解决手动更新语言文件后再自动抽取，导致之前更新失效的问题
        const mainContent = getLangData(targetFilename);
        const obj = mainContent;

        if (Object.keys(obj).length === 0) {
            vscode.window.showWarningMessage(
                `${filename} 解析失败，该文件包含的文案无法自动补全`
            );
        }

        if (validateDuplicate && _.get(obj, fullKey) !== undefined) {
            vscode.window.showErrorMessage(
                `${targetFilename} 中已存在 key 为 \`${fullKey}\` 的翻译，请重新命名变量`
            );
            throw new Error('duplicate');
        }
        // \n 会被自动转义成 \\n，这里转回来
        text = text.replace(/\\n/gm, '\n');
        _.set(obj, fullKey, text);
        fs.writeFileSync(
            targetFilename,
            prettierFile(`export default ${JSON.stringify(obj, null, 2)}`)
        );
    }
}

