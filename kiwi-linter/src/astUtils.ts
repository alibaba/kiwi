/**
 * @author linhuiw
 * @desc AST 处理相关帮助方法
 */
import * as ts from 'typescript';

/**
 * 去掉文件中的注释
 * @param code
 * @param fileName
 */
export function removeFileComment(code: string, fileName: string) {
  const printer: ts.Printer = ts.createPrinter({ removeComments: true });
  const sourceFile: ts.SourceFile = ts.createSourceFile(
    '',
    code,
    ts.ScriptTarget.ES2015,
    true,
    fileName.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS
  );
  return printer.printFile(sourceFile);
}

export type Traverse = (node: ts.Node, cb: (n: ts.Node) => boolean | void) => boolean;

/**
 * TS AST forEach dfs
 * @param node 待遍历节点
 * @param cb 回调函数，返回 true 那么会提前停止 dfs，不返回或者返回 false 那么会继续 dfs
 */
export const traverse: Traverse = (node, cb) => {
  const isCbStop = cb(node);
  if (isCbStop) {
    return true;
  }
  return ts.forEachChild<boolean>(node, node => {
    const isStop = traverse(node, cb);
    if (isStop) {
      return true;
    }
    return false;
  });
};

/**
 * 解析 ts 文件字符串，获取对象字符串
 * @param tsStr js 字符串
 * @return 对象字符串
 */
export const getObjectLiteralExpression = (tsStr: string) => {
  const sourceFile = ts.createSourceFile('', tsStr, ts.ScriptTarget.ESNext, true);
  let result: string = '';
  traverse(sourceFile, node => {
    if (ts.isObjectLiteralExpression(node)) {
      result = node.getText();
      return true;
    }
  });
  return result;
};
