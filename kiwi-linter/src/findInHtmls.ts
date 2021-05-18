/**
 * @author linhuiw
 * @desc 在 HTML 中查找
 */
import * as fs from 'fs-extra';
import * as path from 'path';
import * as vscode from 'vscode';
import { findPositionInCode } from './utils';

export async function findInHtmls(
  text: string,
  fsPath = path.join(vscode.workspace.workspaceFolders[0].uri.fsPath, 'src')
): Promise<Array<vscode.Location>> {
  const info = await fs.lstat(fsPath);

  if (!info.isDirectory()) {
    if (path.extname(fsPath) !== '.html') {
      return [];
    }

    const content = (await fs.readFile(fsPath)).toString('utf8');

    if (content.includes(text)) {
      const location = new vscode.Location(vscode.Uri.file(fsPath), findPositionInCode(text, content));
      return [location];
    }

    return [];
  }

  const paths = await fs.readdir(fsPath);
  const locationses = await Promise.all(paths.map(currPath => findInHtmls(text, path.join(fsPath, currPath))));

  return locationses.reduce((pre, next) => pre.concat(next), []);
}
