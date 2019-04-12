/**
 * @author linhuiw
 * @desc 插件主入口
 */
import * as vscode from 'vscode';
import * as _ from 'lodash';
import * as fs from 'fs-extra';
import * as slash from 'slash2';
import { getSuggestLangObj } from './getLangData';
import { I18N_GLOB, LANG_PREFIX } from './const';
import { findAllI18N, findI18N } from './findAllI18N';
import { findMatchKey } from './utils';
import { triggerUpdateDecorations } from './chineseCharDecorations';
import { TargetStr } from './define';
import { replaceAndUpdate } from './replaceAndUpdate';

/**
 * 主入口文件
 * @param context
 */
export function activate(context: vscode.ExtensionContext) {
  if (!fs.existsSync(LANG_PREFIX)) {
    /** 存在配置文件则开启 */
    return;
  }
  console.log('Congratulations, your extension "kiwi-linter" is now active!');
  context.subscriptions.push(vscode.commands.registerCommand('vscode-i18n-linter.findAllI18N', findAllI18N));
  let targetStrs: TargetStr[] = [];
  let finalLangObj = {};

  let activeEditor = vscode.window.activeTextEditor;
  if (activeEditor) {
    triggerUpdateDecorations(newTargetStrs => {
      targetStrs = newTargetStrs;
    });
  }

  context.subscriptions.push(vscode.commands.registerTextEditorCommand('vscode-i18n-linter.findI18N', findI18N));

  // 监听 langs/ 文件夹下的变化，重新生成 finalLangObj
  const watcher = vscode.workspace.createFileSystemWatcher(I18N_GLOB);
  context.subscriptions.push(watcher.onDidChange(() => (finalLangObj = getSuggestLangObj())));
  context.subscriptions.push(watcher.onDidCreate(() => (finalLangObj = getSuggestLangObj())));
  context.subscriptions.push(watcher.onDidDelete(() => (finalLangObj = getSuggestLangObj())));
  finalLangObj = getSuggestLangObj();

  // 识别到出错时点击小灯泡弹出的操作
  const hasLightBulb = vscode.workspace.getConfiguration('vscode-i18n-linter').get('enableReplaceSuggestion');
  if (hasLightBulb) {
    context.subscriptions.push(
      vscode.languages.registerCodeActionsProvider(
        [
          { scheme: 'file', language: 'typescriptreact' },
          { scheme: 'file', language: 'html' },
          { scheme: 'file', language: 'typescript' },
          { scheme: 'file', language: 'javascriptreact' },
          { scheme: 'file', language: 'javascript' }
        ],
        {
          provideCodeActions: function(document, range, context, token) {
            const targetStr = targetStrs.find(t => range.intersection(t.range) !== undefined);
            if (targetStr) {
              const sameTextStrs = targetStrs.filter(t => t.text === targetStr.text);
              const text = targetStr.text;
              const actions = [];
              for (const key in finalLangObj) {
                if (finalLangObj[key] === text) {
                  actions.push({
                    title: `抽取为 \`I18N.${key}\``,
                    command: 'vscode-i18n-linter.extractI18N',
                    arguments: [
                      {
                        targets: sameTextStrs,
                        varName: `I18N.${key}`
                      }
                    ]
                  });
                }
              }

              return actions.concat({
                title: `抽取为自定义 I18N 变量（共${sameTextStrs.length}处）`,
                command: 'vscode-i18n-linter.extractI18N',
                arguments: [
                  {
                    targets: sameTextStrs
                  }
                ]
              });
            }
          }
        }
      )
    );
  }

  // 点击小灯泡后进行替换操作
  context.subscriptions.push(
    vscode.commands.registerCommand('vscode-i18n-linter.extractI18N', args => {
      return new Promise(resolve => {
        // 若变量名已确定则直接开始替换
        if (args.varName) {
          return resolve(args.varName);
        }

        const currentFilename = activeEditor.document.fileName;
        const suggestPageRegex = /\/pages\/\w+\/([^\/]+)\/([^\/\.]+)/;

        let suggestion = [];
        if (currentFilename.includes('/pages/')) {
          suggestion = currentFilename.match(suggestPageRegex);
        }
        if (suggestion) {
          suggestion.shift();
        }
        /** 如果没有匹配到 Key */
        if (!(suggestion && suggestion.length)) {
          const names = slash(currentFilename).split('/') as string[];
          const fileName = _.last(names);
          const fileKey = fileName.split('.')[0].replace(new RegExp('-', 'g'), '_');
          const dir = names[names.length - 2].replace(new RegExp('-', 'g'), '_');
          if (dir === fileKey) {
            suggestion = [dir];
          } else {
            suggestion = [dir, fileKey];
          }
        }
        // 否则要求用户输入变量名
        return resolve(
          vscode.window.showInputBox({
            prompt: '请输入变量名，格式 `I18N.[page].[key]`，按 <回车> 启动替换',
            value: `I18N.${suggestion.length ? suggestion.join('.') + '.' : ''}`,
            validateInput(input) {
              if (!input.match(/^I18N\.\w+\.\w+/)) {
                return '变量名格式 `I18N.[page].[key]`，如 `I18N.dim.new`，[key] 中可包含更多 `.`';
              }
            }
          })
        );
      }).then((val: string) => {
        // 没有输入变量名
        if (!val) {
          return;
        }
        const finalArgs = Array.isArray(args.targets) ? args.targets : [args.targets];
        return finalArgs
          .reduce((prev: Promise<any>, curr: TargetStr, index: number) => {
            return prev.then(() => {
              const isEditCommon = val.startsWith('I18N.common.');
              return replaceAndUpdate(curr, val, !isEditCommon && index === 0 ? !args.varName : false);
            });
          }, Promise.resolve())
          .then(
            () => {
              vscode.window.showInformationMessage(`成功替换 ${finalArgs.length} 处文案`);
            },
            err => {
              console.log(err, 'err');
            }
          );
      });
    })
  );

  // 使用 cmd + shift + p 执行的公共文案替换
  context.subscriptions.push(
    vscode.commands.registerCommand('vscode-i18n-linter.replaceCommon', () => {
      const commandKeys = Object.keys(finalLangObj).filter(k => k.includes('common.'));
      if (targetStrs.length === 0 || commandKeys.length === 0) {
        vscode.window.showInformationMessage('没有找到可替换的公共文案');
        return;
      }

      const replaceableStrs = targetStrs.reduce((prev, curr) => {
        const key = findMatchKey(finalLangObj, curr.text);
        if (key && key.startsWith('common.')) {
          return prev.concat({
            target: curr,
            key
          });
        }

        return prev;
      }, []);

      if (replaceableStrs.length === 0) {
        vscode.window.showInformationMessage('没有找到可替换的公共文案');
        return;
      }

      vscode.window
        .showInformationMessage(
          `共找到 ${replaceableStrs.length} 处可自动替换的文案，是否替换？`,
          { modal: true },
          'Yes'
        )
        .then(action => {
          if (action === 'Yes') {
            replaceableStrs
              .reduce((prev: Promise<any>, obj) => {
                return prev.then(() => {
                  return replaceAndUpdate(obj.target, `I18N.${obj.key}`, false);
                });
              }, Promise.resolve())
              .then(() => {
                vscode.window.showInformationMessage('替换完成');
              })
              .catch(e => {
                vscode.window.showErrorMessage(e.message);
              });
          }
        });
    })
  );

  // 当 切换文档 的时候重新检测当前文档中的中文文案
  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor(editor => {
      activeEditor = editor;
      if (editor) {
        triggerUpdateDecorations(newTargetStrs => {
          targetStrs = newTargetStrs;
        });
      }
    }, null)
  );

  // 当 文档发生变化时 的时候重新检测当前文档中的中文文案
  context.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument(event => {
      if (activeEditor && event.document === activeEditor.document) {
        triggerUpdateDecorations(newTargetStrs => {
          targetStrs = newTargetStrs;
        });
      }
    }, null)
  );
}
