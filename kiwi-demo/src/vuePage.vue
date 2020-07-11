<template>
    <div>
        <span>vue中文文案测试</span>
        <span attrs='中间'>{{`中文${pageName}`}}</span>
        <span @click='meth("按钮")'>按钮中文</span>
        <span @click='meth("按钮")'>{{`可以的`}}</span>
        `可以的`
        <span @click='meth("按钮")'>{{`可以的`}}</span>
    </div>
</template>
<script>
export default {
    name: 'vuepage',
    data () {
        return {
            pageName: 'vuedata文案测试'
        }
    },
    methods: {
        meth (v) {
            let c = `你说什么${this.pageName}`
            let b = '不顾了haha1'
        }
    }
}
</script>