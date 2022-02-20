<template>
    <div>
        <span>{{I18N.src.vuePage.wenzi}}</span>
        <span>同文字文案</span>
        <span>vue中文文案测试</span>
        <span :attrs='"中间"'>{{`中文${pageName}`}}</span>
        <span @click='meth("按钮")'>按钮中文</span>
        <span @click='meth("按钮")'>{{`可以${pageName}的`}}</span>
        <span @click='meth("按钮")'>测试{{this.pageName}}翻译</span>
        <div><div>密码验证<span>密码验证2</span></div><div>密码验证1</div></div>
    </div>
</template>
<script>
export default {
    name: 'vuepage',
    // 同文字文案测试案例
    data () {
        return {
            pageName: I18N.src.vuePage.wenan1,
            pageName: 'vuedata文案测试备案',
            anniu: '按钮'
        }
    },
    methods: {
        meth (v) {
            let c = `你说什么${this.pageName}`
            let b = '文案加数字1'
        }
    }
}
</script>