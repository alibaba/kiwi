const glob = require('glob');

const getPrettierFiles = () => {
  const tsFiles = glob.sync('**/src/**/*.ts*', { ignore: ['**/node_modules/**', 'build/**', '**/dist/**'] });
  if (!tsFiles.length) {
    return;
  }
  return tsFiles;
};

module.exports = getPrettierFiles;
