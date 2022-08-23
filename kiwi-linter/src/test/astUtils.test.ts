import * as assert from 'assert';
import * as ts from 'typescript';
import { traverse, getObjectLiteralExpression } from '../astUtils';

const objectText = `{
  a: 1,
  b: 2,
}`;
const fileMock = `const obj = ${objectText}`;

const complexObjectText = `{
  c: {
    d: [
      {
        e: 'any string'
      },
      {
        f: 'some string'
      },
    ],
  },
  g: () => ({ h: false }),
}`;
const complexFileMock = `const complexObj = ${complexObjectText};
  ${fileMock};
  export default complexObj
`;

suite('utils/tsAstHelper', () => {
  suite('traverse', () => {
    test('traverse stop', () => {
      const source = ts.createSourceFile('', fileMock, ts.ScriptTarget.ESNext, true);
      let traverseTimes = 0;

      traverse(source, node => {
        traverseTimes++;
        if (ts.isVariableDeclaration(node)) {
          return true;
        }
      });

      assert.strictEqual(traverseTimes, 4);
    });
  });

  suite('getObjectLiteralExpression', () => {
    test('expect get obj', () => {
      const text = getObjectLiteralExpression(fileMock);

      assert.strictEqual(text, objectText);
    });

    test('expect get first complex obj', () => {
      const complexText = getObjectLiteralExpression(complexFileMock);
      assert.strictEqual(complexText, complexObjectText);
    });
  });
});
