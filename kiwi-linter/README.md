# kiwi linter

> Better use with the awesome [kiwi-intl](https://github.com/nefe/kiwi-intl) package

> Vscode extension search `kiwi linter` and install, or visit in [marketplace](https://marketplace.visualstudio.com/items?itemName=undefinedvs.vscode-i18n-linter)

Lint string literals (eg. Chinese) in your `.js(x)` or `.ts(x)` files and provide a quick fix option with one click in VSCode.

![](https://img.alicdn.com/tfs/TB1EYENfTnI8KJjy0FfXXcdoVXa-1006-368.gif)

## Options

### vscode-i18n-linter.i18nFilesPattern

default: `src/**/ts*`

The files to scan, you can specify any [minimatch](https://github.com/isaacs/minimatch) pattern.

### vscode-i18n-linter.markStringLiterals

default: `true`

Whether to mark those non-English letters with border or not.

### vscode-i18n-linter.showOverviewRuler

default: `true`

Show non-English letter position on the overview ruler.

![](https://img.alicdn.com/tfs/TB1CHZRrxGYBuNjy0FnXXX5lpXa-1088-568.png)

### vscode-i18n-linter.markColor

default: `#ff4400`

The color of marked string literals or occurrence on the overview ruler.

### vscode-i18n-linter.enableReplaceSuggestion

default: `true`

Provide a quick fix option (light blub on the left) to extract string literals to I18N variables.

### vscode-i18n-linter.showI18NInPlace

default: `true`

Show I18N values right atop I18N variables.

![](https://img.alicdn.com/tfs/TB1G.8ErStYBeNjSspkXXbU8VXa-1104-226.png)

## Actions

### Find I18N inside Current File

Provides a quick search functionality inside current file for I18N values. The default shortcut is `cmd + ctrl + f`.

![](https://img.alicdn.com/tfs/TB1dzf8rpOWBuNjy0FiXXXFxVXa-1256-700.png)

## Changelog

### 1.1.4

- Feat add inline comment emoji

### 1.1.3

- Feat add inline comment option

### 1.1.2

- Support html file

### 1.1.0

- Feat update i18n key rule

### 1.0.10

- Replace language file require method, use node read file

### 1.0.6

- Fix language file require bug

### 1.0.2

- Fix a issue when manually update lang files get overwrited
- Fix a issue when disable `markStringLiertals` cause `replaceSuggestion` not working
- Add disposables for performance consideration

### 1.0.1

- Add missing `typescript` dependency

### 1.0.0

- Support in-place I18N value display
- Support I18N value search for current file
- Enhance extension options
- Fix new lang file nested key issue
