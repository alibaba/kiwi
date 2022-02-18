/**
 * @author linhuiw
 * @desc 插件主入口
 */
import * as vscode from 'vscode';
import * as _ from 'lodash';
import * as fs from 'fs-extra';
import { UI } from './ui';
import { getSuggestLangObj } from './getLangData';
import { DIR_ADAPTOR } from './const';
import { findAllI18N, findI18N } from './findAllI18N';
import { triggerUpdateDecorations } from './chineseCharDecorations';
import { TargetStr } from './define';
import { replaceAndUpdate } from './replaceAndUpdate';
import {
  findMatchKey,
  getConfiguration,
  getConfigFile,
  translateText,
  getKiwiLinterConfigFile,
  getCurrActivePageI18nKey,
  getTranslateAPiList
} from './utils';

/**
 * 主入口文件
 * @param context
 */
export function activate(context: vscode.ExtensionContext) {
  /** 存在配置文件则开启 */
  if (!getKiwiLinterConfigFile() && !getConfigFile() && !fs.existsSync(DIR_ADAPTOR)) {
    vscode.window.showErrorMessage('请执行 kiwi --init 指令进行初始化！');
    return;
  }
  // 检测配置文件中的翻译源
  const translateApiList = getTranslateAPiList();
  const ui = new UI();
  let translateApi = translateApiList[translateApiList.length - 1].label;
  ui.init(translateApi);

  vscode.commands.registerCommand('vscode-i18n-linter.switchTranslateApi', () => {
    if (translateApiList.length > 1) {
      vscode.window.showQuickPick(translateApiList).then(val => {
        ui.init(val.label);
        translateApi = val.label;
      });
    } else {
      vscode.window.showInformationMessage('无其他翻译源可供切换，请配置！');
    }
  });

  console.log('Congratulations, your extension "kiwi-linter" is now active!');
  context.subscriptions.push(vscode.commands.registerCommand('vscode-i18n-linter.findAllI18N', findAllI18N));
  let targetStrs: TargetStr[] = [];
  let finalLangObj = {};
  let suggestion = [];

  let activeEditor = vscode.window.activeTextEditor;
  if (activeEditor) {
    triggerUpdateDecorations(newTargetStrs => {
      targetStrs = newTargetStrs;
    });
    suggestion = getCurrActivePageI18nKey();
  }
  context.subscriptions.push(vscode.commands.registerTextEditorCommand('vscode-i18n-linter.findI18N', findI18N));

  // 识别到出错时点击小灯泡弹出的操作
  const hasLightBulb = getConfiguration('enableReplaceSuggestion');
  if (hasLightBulb) {
    context.subscriptions.push(
      vscode.languages.registerCodeActionsProvider(
        [
          { scheme: 'file', language: 'typescriptreact' },
          { scheme: 'file', language: 'html' },
          { scheme: 'file', language: 'typescript' },
          { scheme: 'file', language: 'javascriptreact' },
          { scheme: 'file', language: 'javascript' },
          { scheme: '*', language: 'vue' }
        ],
        {
          provideCodeActions: function(document, range, context, token) {
            const targetStr = targetStrs.find(t => range.intersection(t.range) !== undefined);
            if (targetStr) {
              const sameTextStrs = targetStrs.filter(t => t.text === targetStr.text);
              const text = targetStr.text;
              const actions = [];
              finalLangObj = getSuggestLangObj();
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
          .reverse()
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
              .reverse()
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

  // 一键替换所有中文
  context.subscriptions.push(
    vscode.commands.registerCommand('vscode-i18n-linter.kiwigo', () => {
      // 将嵌套的模板字符串情况移除，只替换最外层的文案，内部中文保留
      const newTargetStrs = targetStrs.filter((item, i) => {
        if (i > 0) {
          const beforeStrs = targetStrs.slice(0, i);
          const curRange = item.range;
          const [curStartLine, curEndLine] = [curRange['_start']['_line'], curRange['_end']['_line']];
          const [curStart, curEnd] = [curRange['_start']['_character'], curRange['_end']['_character']];
          const include = beforeStrs.some(str => {
            const preRange = str.range;
            const [preStartLine, preEndLine] = [preRange['_start']['_line'], preRange['_end']['_line']];
            const [preStart, preEnd] = [preRange['_start']['_character'], preRange['_end']['_character']];
            // 当前字符的范围包含在已提取的文案的范围内
            return !(
              curEndLine < preStartLine ||
              curStartLine > preEndLine ||
              (curStartLine === preEndLine && curStart > preEnd) ||
              (curEndLine === preStartLine && curEnd < preStart)
            );
          });
          return !include;
        }
        return true;
      });
      if (newTargetStrs.length === 0) {
        vscode.window.showInformationMessage('没有找到可替换的文案');
        return;
      }
      vscode.window
        .showInputBox({
          prompt: '请调整文案抽取后的位置，格式 `I18N.[page]`，不修改即默认',
          value: `I18N.${suggestion.length ? suggestion.join('.') : ''}`,
          validateInput(input) {
            if (!input.match(/^I18N\.\w+/)) {
              return '变量名格式 `I18N.[page]`，如 `I18N.dim`，[page] 中可包含更多 `.`';
            }
          }
        })
        .then((path: string) => {
          if (!path) {
            return;
          }
          const virtualMemory = {};
          finalLangObj = getSuggestLangObj();
          // 根据在文件中的位置进行排序，防止后续生成key和文案位置错位
          const sortTargetStrs: any = _.sortBy(newTargetStrs, item => {
            return item.range['_start']['_line'];
          });
          // 翻译中文文案
          const translateTexts = sortTargetStrs.reduce((prev, curr, i) => {
            // 避免翻译的字符里包含数字或者特殊字符等情况，只过滤出汉字和字母
            const reg = /[a-zA-Z\u4e00-\u9fa5]+/g;
            const findText = curr.text.match(reg) || [];
            const transText = findText.join('').slice(0, 4) || '中文符号';
            if (i === 0) {
              return transText;
            }
            return `${prev}$${transText}`;
          }, '');
          console.log('key值翻译原文：', translateTexts);

          translateText(translateTexts, translateApi)
            .then(translateTexts => {
              console.log('翻译后：', translateTexts);
              const replaceableStrs = sortTargetStrs.reduce((prev, curr, i) => {
                const key = findMatchKey(finalLangObj, curr.text);
                if (!virtualMemory[curr.text]) {
                  if (key) {
                    virtualMemory[curr.text] = key;
                    return prev.concat({
                      target: curr,
                      key: `${key}`
                    });
                  }
                  const transText = translateTexts[i] && _.camelCase(translateTexts[i]);
                  const newPath = path
                    .split('.')
                    .slice(1)
                    .join('.');
                  let transKey = `${newPath + '.'}${transText}`;
                  let occurTime = 1;
                  // 防止出现前四位相同但是整体文案不同的情况
                  while (
                    finalLangObj[transKey] !== curr.text &&
                    _.keys(finalLangObj).includes(`${transKey}${occurTime >= 2 ? occurTime : ''}`)
                  ) {
                    occurTime++;
                  }
                  if (occurTime >= 2) {
                    transKey = `${transKey}${occurTime}`;
                  }
                  virtualMemory[curr.text] = transKey;
                  finalLangObj[transKey] = curr.text;
                  return prev.concat({
                    target: curr,
                    key: transKey
                  });
                } else {
                  return prev.concat({
                    target: curr,
                    key: virtualMemory[curr.text]
                  });
                }
              }, []);

              replaceableStrs
                .reverse()
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
            })
            .catch(err => {
              vscode.window.showErrorMessage(err);
            });
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
        suggestion = getCurrActivePageI18nKey();
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
