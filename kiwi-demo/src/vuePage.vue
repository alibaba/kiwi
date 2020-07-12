<template>
    <div>
        <span>{{I18N.src.vuePage.chineseCopywriting}}</span>
        <span attrs='中间'>{{I18N.template(I18N.src.vuePage.chinese, { val1: pageName })}}</span>
        <span @click='meth("按钮")'>{{I18N.src.vuePage.buttonChinese}}</span>
        <span @click='meth("按钮")'>{{I18N.template(I18N.src.vuePage.ok, { val1: pageName })}}</span>
        <span @click='meth("按钮")'>{{I18N.common.test}}{{this.pageName}}{{I18N.src.vuePage.translation}}</span>
    </div>
</template>
<script>
import I18N from 'src/utils/I18N';

export default {
    name: 'vuepage',
    data () {
        return {
            pageName: I18N.src.vuePage.copyTest
        }
    },
    methods: {
        meth (v) {
            let c = I18N.template(I18N.src.vuePage.whatDidYouSay, { val1: this.pageName })
            let b = I18N.src.vuePage.ignore
        }
    }
}
</script>