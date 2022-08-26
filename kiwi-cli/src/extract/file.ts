/**
 * @author doubledream
 * @desc 文件处理方法
 */

import * as path from 'path';
import * as _ from 'lodash';
import * as fs from 'fs';

/**
 * 获取文件夹下符合要求的所有文件
 * @function getSpecifiedFiles
 * @param  {string} dir 路径
 * @param {ignoreDirectory} 忽略文件夹 {ignoreFile} 忽略的文件
 */
function getSpecifiedFiles(dir, ignoreDirectory = [], ignoreFile = []) {
  const standardIgnoreDirectory = Array.isArray(ignoreDirectory) ? ignoreDirectory : [ignoreDirectory];
  const standardIgnoreFile = Array.isArray(ignoreFile) ? ignoreFile : [ignoreFile];

  return fs.readdirSync(dir).reduce((files, file) => {
    const name = path.join(dir, file);

    const isDirectory = fs.statSync(name).isDirectory();
    const isFile = fs.statSync(name).isFile();

    if (isDirectory) {
      return files.concat(getSpecifiedFiles(name, standardIgnoreDirectory, standardIgnoreFile));
    }

    const isIncludeDirectory =
      !(standardIgnoreDirectory || []).length ||
      !(standardIgnoreDirectory || []).some(ignoreDir => {
        return path
          .dirname(name)
          .split(path.sep)
          .join('/')
          .includes(ignoreDir);
      });

    const isIncludeFile =
      !(standardIgnoreFile || []).length ||
      !(standardIgnoreFile || []).some(filename =>
        name
          .split(path.sep)
          .join('/')
          .includes(filename)
      );

    if (isFile && isIncludeDirectory && isIncludeFile) {
      return files.concat(name);
    }
    return files;
  }, []);
}

/**
 * 读取文件
 * @param fileName
 */
function readFile(fileName) {
  if (fs.existsSync(fileName)) {
    return fs.readFileSync(fileName, 'utf-8');
  }
}

/**
 * 读取文件
 * @param fileName
 */
function writeFile(filePath, file) {
  if (fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, file);
  }
}

/**
 * 判断是文件
 * @param path
 */
function isFile(path) {
  return fs.statSync(path).isFile();
}

/**
 * 判断是文件夹
 * @param path
 */
function isDirectory(path) {
  return fs.statSync(path).isDirectory();
}

export { getSpecifiedFiles, readFile, writeFile, isFile, isDirectory };
