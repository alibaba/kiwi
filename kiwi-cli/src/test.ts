import {findTextInVue} from './extract/findChineseText'
import * as path from 'path';
import * as _ from 'lodash';
import * as fs from 'fs';
let a = findTextInVue(fs.readFileSync('/Users/chenlei/work/kiwi/kiwi-demo/src/vuePage.vue', 'utf-8'))
console.log(a)