# 🐤 kiwi cli

Kiwi 的 CLI 工具

## 如何使用

> yarn global add kiwi-clis

> 推荐与[🐤 Kiwi-国际化全流程解决方案](https://github.com/alibaba/kiwi)结合使用

## CLI 参数

### kiwi `--init` 
初始化项目，生成 kiwi 的配置文件 `kiwi-config.json`，并生成kiwi文件夹和相关导出文件

```shell script 
# --init [type] 指定kiwi文件夹下导出文件的文件类型，js或ts，默认ts 
kiwi --init [type]
```
生成`kiwi-config.json`默认配置如下：
```js
{
  // kiwi文件根目录，用于放置提取的langs文件
  "kiwiDir": "./.kiwi",
  // kiwi目录生成文件类型，ts或者js，默认ts
  "fileType": "ts",
  // 配置文件目录，若调整配置文件，此处可手动修改
  "configFile": "./.kiwi/kiwi-config.json",

  // 语言目录名，注意连线和下划线
  "srcLang": "zh-CN",
  "distLangs": ["en-US", "zh-TW"],

  // googleApiKey
  "googleApiKey": "",

  // baiduApiKey
  "baiduApiKey":
    "appId": '',
    "appKey": ''
  },

  // 百度翻译的语种代码映射 详情见官方文档 https://fanyi-api.baidu.com/doc/21
  "baiduLangMap": {
    "en-US": 'en',
    "zh-TW": 'cht'
  },

  // 批量提取文案时生成key值时的默认翻译源, Google/Baidu/Pinyin
  "defaultTranslateKeyApi": 'Pinyin',

  // import 语句，不同项目请自己配置
  "importI18N": "",

  // 可跳过的文件夹名或者文加名，比如docs、mock等，只需要匹配部分路径即可
  // 如实际文件目录是 /src/components/layouts
  // 可以配置 ignoreDir: '/src/components/layouts' 或者 ['/src/components/layouts']
  // 路径以 / 连接，ignoreFile 也是相同匹配规则
  "ignoreDir": [],
  "ignoreFile": []
}
```

### kiwi `--extract`

1. 一键批量替换指定文件夹下的所有文案

```shell script
# --extract [dirPath] 指定文件夹路径 
# --prefix [prefix] 指定文案前缀 I18N.xxxx
kiwi --extract [dirPath] --prefix [prefix]
```

2. commit 提交时自动增量提取，在 precommit 脚本内添加如下指令

```shell script
# 检测提交中是否存在ts或tsx文件
TS_CHANGED=$(git diff --cached --numstat --diff-filter=ACM | grep -F '.ts' | wc -l)

# 对提交的代码中存在未提取的中文文案统一处理
if [ "$TS_CHANGED" -gt 0 ]
then
  TS_FILES_LIST=($(git diff --cached --name-only --diff-filter=ACM | grep -F '.ts'))
  TS_FILES=''
  delim=''
  for item in ${TS_FILES_LIST[@]};do
    TS_FILES=$TS_FILES$delim$item;
    delim=','
  done
  echo "\033[33m 正在检测未提取的中文文案，请稍后 \033[0m"
  kiwi --extract $TS_FILES || exit 1
fi
```

![批量替换](https://raw.githubusercontent.com/alibaba/kiwi/master/kiwi-cli/public/extract.gif)

### kiwi `--import`

导入翻译文案，将翻译人员翻译的文案，导入到项目中

```shell script
# 导入送翻后的文案
kiwi --import [filePath] en-US
```

### kiwi `--export`

导出未翻译的文案

```shell script
# 导出指定语言的文案，lang取值为配置中distLangs值，如en-US导出还未翻译成英文的中文文案
kiwi --export [filePath] en-US
```

### kiwi `--sync`

同步各种语言的文案，同步未翻译文件

### kiwi `--mock`

使用 Google 翻译，翻译未翻译的文案
如果同时配置 baiduApiKey 与 baiduApiKey 则命令行可手动选择翻译源

### kiwi `--translate`

全量翻译未翻译的中文文案，翻译结果自动导入 en-US zh-TW 等目录

```shell script
kiwi --translate
```
