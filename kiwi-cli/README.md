# kiwi-clis 使用文档

Kiwi 国际化全流程解决方案的命令行工具，提供中文文案提取、翻译、导入导出、同步等一站式能力。

> 推荐与[🐤 Kiwi-国际化全流程解决方案](https://github.com/alibaba/kiwi)结合使用

## 安装

```bash
# 推荐全局安装
npm install -g kiwi-clis
# 或
yarn global add kiwi-clis
```

## 前置条件

所有命令需要在**项目根目录**下执行（即 `kiwi-config.json` 所在目录）。

如果没有配置文件，工具会使用默认配置（`kiwiDir: ./.kiwi`，`srcLang: zh-CN`）。

---

## 配置文件

执行 `kiwi --init` 后会在项目根目录生成 `kiwi-config.json`：

```json
{
  "kiwiDir": "./.kiwi",
  "fileType": "ts",
  "srcLang": "zh-CN",
  "distLangs": ["en-US", "zh-TW"],
  "googleApiKey": "",
  "baiduApiKey": {
    "appId": "",
    "appKey": ""
  },
  "baiduLangMap": {
    "en-US": "en",
    "zh-TW": "cht"
  },
  "translateOptions": {
    "concurrentLimit": 10,
    "requestOptions": {}
  },
  "defaultTranslateKeyApi": "Pinyin",
  "importI18N": "import I18N from 'src/utils/I18N';",
  "ignoreDir": [],
  "ignoreFile": []
}
```

### 配置项说明

| 字段 | 类型 | 说明 |
|------|------|------|
| `kiwiDir` | string | kiwi 语言文件存放目录 |
| `fileType` | string | 语言文件类型，`ts` 或 `js` |
| `srcLang` | string | 源语言目录名 |
| `distLangs` | string[] | 目标翻译语言列表 |
| `googleApiKey` | string | Google 翻译 API Key |
| `baiduApiKey` | object | 百度翻译 API 配置 `{ appId, appKey }` |
| `baiduLangMap` | object | 百度翻译语种代码映射 |
| `translateOptions` | object | 翻译请求选项 |
| `defaultTranslateKeyApi` | string | 提取文案时生成 key 的翻译源：`Pinyin` / `Google` / `Baidu` |
| `importI18N` | string | 自动插入的 import 语句 |
| `ignoreDir` | string[] | 提取时忽略的目录路径 |
| `ignoreFile` | string[] | 提取时忽略的文件路径 |

---

## 命令详解

### `kiwi --init [type]`

**作用**：初始化项目，生成配置文件和语言文件目录结构。

**参数**：
| 参数 | 必填 | 说明 |
|------|------|------|
| `type` | 否 | 语言文件类型，可选 `ts` 或 `js`，默认 `ts` |

**交互流程**：
1. 提示是否已存在 kiwi 目录
2. 如果已存在，输入目录路径
3. 如果不存在，自动创建 `.kiwi/zh-CN/` 目录及初始文件

**输出**：
- 生成 `kiwi-config.json` 配置文件
- 生成 `.kiwi/zh-CN/index.ts` 和 `.kiwi/zh-CN/common.ts`

**示例**：
```bash
# 默认初始化（ts 格式）
kiwi --init

# 指定 js 格式
kiwi --init js

# 指定 ts 格式
kiwi --init ts
```

---

### `kiwi --extract [dirPath] --prefix [prefix]`

**作用**：扫描指定目录下的代码文件，自动识别中文文案，生成国际化 key 并替换源代码。

**参数**：
| 参数 | 必填 | 说明 |
|------|------|------|
| `dirPath` | 否 | 要扫描的目录路径，默认 `./` |
| `--prefix` | 否 | 指定生成 key 的前缀，格式 `I18N.xxx.xxx` |

**支持的文件类型**：`.ts`、`.tsx`、`.js`、`.jsx`、`.vue`

**禁用规则**：
```typescript
/* kiwi-disable-file */        // 整个文件跳过提取

// kiwi-disable-next-line      // 这行跳过抽取
const msg = '不会被提取';

/* kiwi-disable-next-line */   // 同上，块注释形式
const msg2 = '不会被提取';
```

HTML/Vue 模板中：
```html
<!-- kiwi-disable-file -->     <!-- 整个文件跳过 -->
<!-- kiwi-disable-next-line -->
<span>不会被提取</span>
```

**输出**：
- 将源代码中的中文替换为 `I18N.xxx.xxx` 引用
- 在语言文件中新增对应的 key-value
- 自动添加 `import I18N` 语句

**示例**：
```bash
# 扫描 src 目录下所有文件
kiwi --extract src

# 扫描指定子目录
kiwi --extract src/pages/Home

# 指定 key 前缀
kiwi --extract src/pages/Home --prefix I18N.home

# 提取 git 提交中变更的文件（用于 pre-commit hook）
kiwi --extract src/pages/Home/PageA.tsx,src/pages/Home/PageB.tsx
```

**替换效果**：
```typescript
// 替换前
const title = '首页';

// 替换后
import I18N from 'src/utils/I18N';
const title = I18N.home.shouYe;
```

---

### `kiwi --translate`

**作用**：全量翻译所有未翻译的中文文案，翻译结果自动写入目标语言目录。

**参数**：无

**前置条件**：
- 需要配置 `googleApiKey` 或 `baiduApiKey`
- 如果两者都配置了，会提示选择翻译源

**执行流程**：
1. 先执行 `sync` 同步文件结构
2. 检测可用的翻译 API
3. 对所有未翻译的文案调用翻译 API
4. 翻译结果自动导入目标语言目录

**输出**：
- 更新 `distLangs` 中各语言目录下的翻译文件（如 `.kiwi/en-US/common.ts`）
- 生成临时 TSV 文件（翻译记录）

**示例**：
```bash
kiwi --translate
# 输出：
# ✔ 使用 Baidu 翻译成功
```

---

### `kiwi --mock`

**作用**：使用翻译 API 生成 mock 翻译文件，用于开发阶段预览翻译效果，不会修改正式语言文件。

**参数**：无

**前置条件**：同 `--translate`

**输出**：
- 在各目标语言目录下生成 `mock.ts` 文件（如 `.kiwi/en-US/mock.ts`）
- 只包含未翻译的文案及其翻译结果

**示例**：
```bash
kiwi --mock
# 输出：
# ✔ 使用 Google 翻译成功
```

**生成的 mock 文件内容**：
```typescript
// .kiwi/en-US/mock.ts
export default {
  "common.test": "Test",
  "home.title": "Home Page"
}
```


---

### `kiwi --sync`

**作用**：同步源语言的文件结构到所有目标语言目录，确保各语言目录的文件结构一致。

**参数**：无

**执行流程**：
1. 读取源语言目录（`zh-CN`）下的所有 `.ts` 文件
2. 对每个目标语言目录，保留已有翻译，补充缺失的 key（使用源语言文案占位）
3. 复制 `index.ts` 到各目标语言目录

**输出**：
- 更新目标语言目录下的文件，保持结构与源语言一致

**示例**：
```bash
kiwi --sync
# 输出：
# ✔ 文案同步成功
```

---

### `kiwi --export [file] [lang]`

**作用**：导出未翻译的文案为 TSV 文件，供翻译人员使用。

**参数**：
| 参数 | 必填 | 说明 |
|------|------|------|
| `file` | 否 | 导出文件路径，默认 `./export-{lang}` |
| `lang` | 否 | 指定导出的目标语言，默认导出所有 `distLangs` |

**输出**：
- 生成 TSV 格式文件，每行包含 `key\t中文文案`
- 只导出尚未翻译的文案（目标语言中不存在或与中文相同的条目）

**示例**：
```bash
# 导出所有语言的未翻译文案
kiwi --export

# 导出英文未翻译文案到指定文件
kiwi --export ./untranslated-en.tsv en-US

# 导出繁体中文未翻译文案
kiwi --export ./untranslated-tw.tsv zh-TW
```

**导出文件内容示例**（TSV 格式）：
```
common.test	测试
home.title	首页标题
home.desc	这是一段描述
```

---

### `kiwi --import [file] [lang]`

**作用**：将翻译人员完成的翻译文件导入到项目对应的语言目录中。

**参数**：
| 参数 | 必填 | 说明 |
|------|------|------|
| `file` | 是 | 翻译文件路径（TSV 格式） |
| `lang` | 是 | 目标语言（如 `en-US`） |

**输入文件格式**：TSV，每行 `key\t翻译文案`

**执行流程**：
1. 读取 TSV 文件中的翻译内容
2. 按文件名分组（key 的第一部分）
3. 将翻译写入对应的语言文件，保留未修改的翻译

**输出**：
- 更新目标语言目录下的对应文件

**示例**：
```bash
# 导入英文翻译
kiwi --import ./translated-en.tsv en-US

# 导入繁体中文翻译
kiwi --import ./translated-tw.tsv zh-TW
```

**输入文件内容示例**：
```
common.test	Test
home.title	Home Page Title
home.desc	This is a description
```

---

### `kiwi --unused`

**作用**：扫描项目源代码，查找并导出所有未被引用的国际化 key。

**参数**：无

**扫描范围**：`./src` 目录（排除 `node_modules`、`build`、`dist`、`.`开头的目录）

**输出**：
- 在控制台打印所有未使用的 key 列表

**示例**：
```bash
kiwi --unused
# 输出：
# [ 'I18N.common.oldKey', 'I18N.home.removedText' ] unUnsedKeys
```

---

## 典型工作流

### 一、初始化

#### 1. 初始化项目

```bash
cd your-project
kiwi --init ts
```

#### 2. 配置翻译 API

编辑 `kiwi-config.json`，填入百度翻译 API 密钥：

```json
{
  "baiduApiKey": {
    "appId": "your-app-id",
    "appKey": "your-app-key"
  },
  "defaultTranslateKeyApi": "Baidu"
}
```

**如何获取 baiduApiKey：**
1. 注册并登录 [百度翻译开放平台](https://fanyi-api.baidu.com/)
2. 开通「通用文本翻译」服务（标准版每月免费 5 万字符）
3. 进入 管理控制台 -> 开发者信息 -> 获取 APP ID 和密钥

---

### 二、提取中文文案

```bash
# 扫描 src 目录，自动识别中文并替换为 I18N.key
kiwi --extract src

# 扫描指定子目录
kiwi --extract src/pages/Home

# 指定 key 前缀
kiwi --extract src/pages/Home --prefix I18N.home

# 多个文件或目录, 英文逗号分隔","
kiwi --extract file1,file2,path1,path2
```

提取完成后，源代码中的中文会被替换为 `I18N.xxx.xxx`，同时在 `.kiwi/zh-CN/` 下生成对应的语言文件。

---

### 三、翻译

根据团队情况选择以下任一方式：

#### 方式 A：直接自动翻译（无需审核）

适用场景：快速迭代，不需要人工审核翻译质量。

```bash
kiwi --translate
```

自动调用百度/Google 翻译 API，将所有未翻译的中文文案翻译并写入目标语言目录（如 `.kiwi/en-US/`）。

#### 方式 B：自动翻译 + 审核后导入

适用场景：需要 PD/产品 审核翻译结果后再正式写入。

```bash
# 1. 执行翻译，会自动生成增量翻译文件（如 .kiwi/en-US/en-US_translate.tsv）
kiwi --translate

# 2. 将 TSV 文件交给 PD/产品 审核校对

# 3. 审核修改完成后，重新导入更新
kiwi --import .kiwi/en-US/en-US_translate.tsv en-US
```

#### 方式 C：导出给专业翻译团队

适用场景：有专门的翻译团队负责多语言翻译。

```bash
# 1. 导出未翻译的文案（TSV 格式，可用 Excel 打开）
kiwi --export ./to-translate-en.tsv en-US
kiwi --export ./to-translate-tw.tsv zh-TW

# 2. 将 TSV 文件交给翻译团队翻译

# 3. 翻译完成后导入
kiwi --import ./translated-en.tsv en-US
kiwi --import ./translated-tw.tsv zh-TW
```

---

### 辅助命令

```bash
# 同步文件结构（确保各语言目录的文件与 zh-CN 一致）
kiwi --sync

# 查找未使用的 key（清理废弃文案）
kiwi --unused
```

---

## 与 Git Pre-commit 集成

在 `pre-commit` 脚本中添加以下内容，实现提交时自动增量提取：

```bash
#!/bin/sh
# 检测提交中是否存在 ts/tsx 文件
TS_CHANGED=$(git diff --cached --numstat --diff-filter=ACM | grep -F '.ts' | wc -l)

if [ "$TS_CHANGED" -gt 0 ]; then
  TS_FILES_LIST=($(git diff --cached --name-only --diff-filter=ACM | grep -F '.ts'))
  TS_FILES=''
  delim=''
  for item in ${TS_FILES_LIST[@]}; do
    TS_FILES=$TS_FILES$delim$item
    delim=','
  done
  echo "\033[33m 正在检测未提取的中文文案，请稍后 \033[0m"
  kiwi --extract $TS_FILES || exit 1
fi
```

---

## 常见问题

### Q: Vue 3 项目安装冲突？
A: 工具内部用的vue-template-compiler，推荐全局安装 `npm i -g kiwi-clis`，全局包的依赖与项目隔离，不会产生版本冲突。

### Q: 如何跳过某些文件或目录？
A: 在 `kiwi-config.json` 中配置 `ignoreDir` 和 `ignoreFile`：
```json
{
  "ignoreDir": ["/src/libs", "/src/vendor"],
  "ignoreFile": ["/src/utils/constants.ts"]
}
```
