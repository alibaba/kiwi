/**
 * @author linhuiw
 * @desc CodeLensProvider
 */
import * as vscode from 'vscode';
import { findI18NPositions } from './findI18NPositions';
import { transformPosition } from './lineAnnotation';

export class CodeLensProvider implements vscode.CodeLensProvider {
  public provideCodeLenses(document: vscode.TextDocument, token: vscode.CancellationToken) {
    const code = document.getText();
    const positions = findI18NPositions(code);

    return new Promise<vscode.CodeLens[]>((resolve, reject) => {
      let codeLenses = [];
      if (!document) {
        return reject('No open documents');
      }
      if (token.isCancellationRequested) {
        return resolve(codeLenses);
      }

      codeLenses = (positions || []).map(pos => {
        const range = transformPosition(pos, code);
        return new vscode.CodeLens(range, {
          title: pos.cn,
          command: '',
          tooltip: pos.cn
        });
      });
      return resolve(codeLenses);
    });
  }
}
