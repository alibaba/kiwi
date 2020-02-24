import * as babel from '@babel/core';
import { DOUBLE_BYTE_REGEX } from './const';
function transerI18n(code, filename) {
  let arr = [];
  let visitor = {
    StringLiteral(path) {
      if (path.node.value.match(DOUBLE_BYTE_REGEX)) {
        arr.push(path.node.value);
      }
    }
  };
  let arrayPlugin = { visitor };
  babel.transform(code.toString(), {
    filename,
    plugins: [arrayPlugin]
  });
  return arr;
}
export { transerI18n };
