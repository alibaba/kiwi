/**
 * @author linhuiw
 * @desc 查找所有 I18N 值
 */
import * as vscode from 'vscode';
import * as fs from 'fs-extra';
import * as path from 'path';
import { getLangData, getSuggestLangObj, getI18N } from './getLangData';
import { Item } from './define';
import { LANG_PREFIX } from './const';
import { findPositionInCode } from './utils';
import { findInHtmls } from './findInHtmls';
import { findI18NPositions } from './findI18NPositions';
import { transformPosition } from './lineAnnotation';

function extractObject(obj, keys = []as string[]): Array<Item> {
  if (typeof obj === 'string') {
    return [{
      keys,
      value: obj,
    }];
  }
  const objKeys = Object.keys(obj);

  return objKeys.map(key => {
    const value = obj[key];
    const currKeys = [...keys, key];

    return extractObject(value, currKeys);
  }).reduce((pre, next) => pre.concat(...next), []);
}

/**
 * 查找所有 I18N
 */
export function findAllI18N() {
  const I18NText = getI18N();
  const allItems = extractObject(I18NText);

  const getDesc = (item: Item) => item.value + ' I18N.' + item.keys.join('.');

  vscode.window
    .showQuickPick(allItems.map(getDesc))
    .then(async selected => {
      const foundItem = allItems.find(item => getDesc(item) === selected);

      if (!foundItem) {
        return;
      }

      const [target, ...restKeys] = foundItem.keys;
      const uri = vscode.Uri.file(path.join(LANG_PREFIX, target + '.ts'));
      const content = (await fs.readFile(path.join(LANG_PREFIX, target + '.ts'))).toString('utf8');

      const pos = findPositionInCode('"' + restKeys[restKeys.length - 1] + '"', content);
      await vscode.workspace.openTextDocument(uri);

      try {
        const tsLocations = await vscode.commands.executeCommand<vscode.Location[]>('vscode.executeReferenceProvider', uri, pos);
        const templateLocations = await findInHtmls('I18N.' + foundItem.keys.join('.'));
        const locations = [...tsLocations, ...templateLocations];
        const [self, ...reals] = locations;
        if (reals.length === 1) {
          const uri = reals[0].uri;
          const range = reals[0].range;

          const doc = await vscode.workspace.openTextDocument(uri);
          await vscode.window.showTextDocument(doc);

          vscode.window.activeTextEditor.selection = new vscode.Selection(
            range.start,
            range.end
          );
          vscode.window.activeTextEditor.revealRange(
            range,
            vscode.TextEditorRevealType.InCenter
          );
        } else if (reals.length > 1) {
          vscode.window.showQuickPick(reals.map(real => path.relative(vscode.workspace.rootPath, real.uri.fsPath))).then(async item => {
            const index = reals.findIndex(real => real.uri.fsPath.includes(item));

            const uri = reals[index].uri;
            const range = reals[index].range;
            const doc = await vscode.workspace.openTextDocument(uri);
            await vscode.window.showTextDocument(doc);

            vscode.window.activeTextEditor.selection = new vscode.Selection(
              range.start,
              range.end
            );
            vscode.window.activeTextEditor.revealRange(
              range,
              vscode.TextEditorRevealType.InCenter
            );
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

  vscode.window
    .showQuickPick(positions.map(pos => `${pos.cn}  ${pos.code}`))
    .then(item => {
      const foundPos = positions.find(pos => `${pos.cn}  ${pos.code}` === item);

      const range = transformPosition(foundPos, code);
      vscode.window.activeTextEditor.selection = new vscode.Selection(
        range.start,
        range.end
      );
      vscode.window.activeTextEditor.revealRange(
        range,
        vscode.TextEditorRevealType.InCenter
      );
    });
}