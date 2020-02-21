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
function getSpecifiedFiles(dir, ignoreDirectory = '', ignoreFile = '') {
  return fs.readdirSync(dir).reduce((files, file) => {
    const name = path.join(dir, file);
    const isDirectory = fs.statSync(name).isDirectory();
    const isFile = fs.statSync(name).isFile();

    if (isDirectory) {
      return files.concat(getSpecifiedFiles(name, ignoreDirectory, ignoreFile));
    }

    const isIgnoreDirectory =
      !ignoreDirectory ||
      (ignoreDirectory &&
        !path
          .dirname(name)
          .split('/')
          .includes(ignoreDirectory));
    const isIgnoreFile = !ignoreFile || (ignoreFile && path.basename(name) !== ignoreFile);

    if (isFile && isIgnoreDirectory && isIgnoreFile) {
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

export { getSpecifiedFiles, readFile, writeFile };
