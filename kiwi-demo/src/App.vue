<template>
  <div class="app-test">
    <div>测试</div>
  </div>
</template>

<script lang="ts">
export default {
  created() {
    console.log('你好');
  },
  lang() {
    return '简体中文';
  }
};
</script>
<style>
.app-test::after {
  content: '样式';
}
</style>
