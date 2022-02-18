/**
 * @author linhuiw
 * @desc 查找所有 I18N 值
 */
import * as vscode from 'vscode';
import * as fs from 'fs-extra';
import * as path from 'path';
import { getI18N } from './getLangData';
import { Item } from './define';
import { LANG_PREFIX } from './const';
import { findPositionInCode, getTargetLangPath } from './utils';
import { findInHtmls } from './findInHtmls';
import { findI18NPositions } from './findI18NPositions';
import { transformPosition } from './lineAnnotation';

function extractObject(obj, keys = [] as string[]): Array<Item> {
  if (typeof obj === 'string') {
    return [
      {
        keys,
        value: obj
      }
    ];
  }
  const objKeys = Object.keys(obj);

  return objKeys
    .map(key => {
      const value = obj[key];
      const currKeys = [...keys, key];

      return extractObject(value, currKeys);
    })
    .reduce((pre, next) => pre.concat(...next), []);
}

/**
 * 查找所有 I18N
 */
export function findAllI18N() {
  const I18NText = getI18N();
  const allItems = extractObject(I18NText);
  const langPrefix = getTargetLangPath(vscode.window.activeTextEditor.document.uri.path) || LANG_PREFIX;

  const getDesc = (item: Item) => item.value + ' I18N.' + item.keys.join('.');

  vscode.window.showQuickPick(allItems.map(getDesc)).then(async selected => {
    const foundItem = allItems.find(item => getDesc(item) === selected);

    if (!foundItem) {
      return;
    }

    const [target, ...restKeys] = foundItem.keys;
    const uri = vscode.Uri.file(path.join(langPrefix, target + '.ts'));
    const content = (await fs.readFile(path.join(langPrefix, target + '.ts'))).toString('utf8');

    const preCodeContent = '"' + restKeys[restKeys.length - 1] + '"';
    const newCodeContent = ' ' + restKeys[restKeys.length - 1] + ':';
    let pos = findPositionInCode(preCodeContent, content);

    if (!pos) {
      pos = findPositionInCode(newCodeContent, content);
    }

    await vscode.workspace.openTextDocument(uri);

    try {
      const tsLocations = await vscode.commands.executeCommand<vscode.Location[]>(
        'vscode.executeReferenceProvider',
        uri,
        pos
      );

      const templateLocations = await findInHtmls('I18N.' + foundItem.keys.join('.'));
      const locations = [...tsLocations.slice(1), ...templateLocations];

      if (locations.length === 1) {
        const uri = locations[0].uri;
        const range = locations[0].range;

        const doc = await vscode.workspace.openTextDocument(uri);
        await vscode.window.showTextDocument(doc);

        vscode.window.activeTextEditor.selection = new vscode.Selection(range.start, range.end);
        vscode.window.activeTextEditor.revealRange(range, vscode.TextEditorRevealType.InCenter);
      } else if (locations.length > 1) {
        vscode.window
          .showQuickPick(
            locations.map(real => path.relative(vscode.workspace.workspaceFolders[0].uri.fsPath, real.uri.fsPath))
          )
          .then(async item => {
            const index = locations.findIndex(real => real.uri.fsPath.includes(item));

            const uri = locations[index].uri;
            const range = locations[index].range;
            const doc = await vscode.workspace.openTextDocument(uri);
            await vscode.window.showTextDocument(doc);

            vscode.window.activeTextEditor.selection = new vscode.Selection(range.start, range.end);
            vscode.window.activeTextEditor.revealRange(range, vscode.TextEditorRevealType.InCenter);
          });
      } else {
        vscode.window.showInformationMessage('未被使用！');
      }
    } catch (e) {
      debugger;
    }
  });
}

/**
 * 查找 I18N
 */
export function findI18N() {
  const document = vscode.window.activeTextEditor.document;
  const code = document.getText();
  const positions = findI18NPositions(code);

  vscode.window.showQuickPick(positions.map(pos => `${pos.cn}  ${pos.code}`)).then(item => {
    const foundPos = positions.find(pos => `${pos.cn}  ${pos.code}` === item);

    const range = transformPosition(foundPos, code);
    vscode.window.activeTextEditor.selection = new vscode.Selection(range.start, range.end);
    vscode.window.activeTextEditor.revealRange(range, vscode.TextEditorRevealType.InCenter);
  });
}
