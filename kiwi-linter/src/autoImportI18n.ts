/**
 * @author zwj
 * @desc 自动导入I18N
 */

import * as vscode from 'vscode';
import * as ts from 'typescript';
import * as _ from 'lodash';

export class AutoImportI18NFixer {
  private importI18nPath;
  private autoImportI18n;
  private doubleQuotes = false;
  private spacesBetweenBraces = true;
  private semicolon = true;

  constructor() {
    let config = vscode.workspace.getConfiguration('vscode-i18n-linter');

    this.importI18nPath = config.get<boolean>('importI18nPath');
    this.autoImportI18n = config.get<boolean>('autoImportI18n');
  }

  public fix(document) {
    if (/\.(ts|tsx|js|jsx)$/.test(document.fileName) && this.autoImportI18n) {
      let edit = this.getTextEdit(document);

      vscode.workspace.applyEdit(edit);
    }
  }

  public getTextEdit(document: vscode.TextDocument) {
    const edit: vscode.WorkspaceEdit = new vscode.WorkspaceEdit();
    const fileContent = document.getText();
    const importStatementText = this.importI18nPath + '\n';
    const ast = ts.createSourceFile('', fileContent, ts.ScriptTarget.ES2015, true, ts.ScriptKind.TSX);
    let importNodes: ts.Node[] = [];
    if (this.alreadyResolved(ast, importNodes)) {
      return edit;
    }

    // 自动导入
    // 找到最后一行
    if (importNodes.length > 0) {
      const lastImportNodeStart = importNodes[importNodes.length - 1].getStart();
      const insertPosition: vscode.Position = document.positionAt(lastImportNodeStart).translate(1, 0);
      edit.insert(document.uri, insertPosition, importStatementText);
    } else {
      // 没有导入
      const firstTwoLetters = fileContent.trim().substr(0, 2);
      // 识别首行注释
      if (firstTwoLetters === '/*') {
        const matchEnd = fileContent.match(/\n\s?(\*){1,2}\/\n/);
        if (matchEnd && matchEnd.index > 0) {
          // 如果是文件头注释 插入到文件头下方
          edit.insert(
            document.uri,
            document.positionAt(matchEnd.index + 1).translate(1, 0),
            '\n' + importStatementText
          );
        } else {
          edit.insert(document.uri, new vscode.Position(0, 0), importStatementText);
        }
      } else {
        edit.insert(document.uri, new vscode.Position(0, 0), importStatementText);
      }
    }

    return edit;
  }

  private alreadyResolved(ast: ts.SourceFile, importNodes: ts.Node[]) {
    let hasImportI18N = false;

    function visit(node) {
      if (node.kind === ts.SyntaxKind.ImportDeclaration) {
        importNodes.push(node);
        const importClause = node.importClause;

        // import I18N from 'src/utils/I18N';
        if (_.get(importClause, 'kind') === ts.SyntaxKind.ImportClause) {
          if (importClause.name) {
            if (importClause.name.escapedText === 'I18N') {
              hasImportI18N = true;
            }
          } else {
            const namedBindings = importClause.namedBindings;
            // import { I18N } from 'src/utils/I18N';
            if (namedBindings.kind === ts.SyntaxKind.NamedImports) {
              namedBindings.elements.forEach(element => {
                if (element.kind === ts.SyntaxKind.ImportSpecifier && _.get(element, 'name.escapedText') === 'I18N') {
                  hasImportI18N = true;
                }
              });
            }
            // import * as I18N from 'src/utils/I18N';
            if (namedBindings.kind === ts.SyntaxKind.NamespaceImport) {
              if (_.get(namedBindings, 'name.escapedText') === 'I18N') {
                hasImportI18N = true;
              }
            }
          }
        }
      }
    }

    ts.forEachChild(ast, visit);

    return hasImportI18N;
  }

  private createImportStatement(
    imp: string,
    path: string,
    endline: boolean = false,
    isDefault: boolean = false
  ): string {
    let formattedPath = path.replace(/\"/g, '').replace(/\'/g, '');
    const quoteSymbol = this.doubleQuotes ? `"` : `'`;
    const importStr = [
      'import ',
      isDefault ? '' : this.spacesBetweenBraces ? '{ ' : '{',
      imp,
      isDefault ? '' : this.spacesBetweenBraces ? ' }' : '}',
      ' from ',
      quoteSymbol + formattedPath + quoteSymbol,
      this.semicolon ? ';' : '',
      endline ? '\r\n' : ''
    ].join('');
    return importStr;
  }
}
