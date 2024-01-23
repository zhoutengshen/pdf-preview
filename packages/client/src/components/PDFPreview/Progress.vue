<template>
  <div class="progress"></div>
</template>
  
<script setup lang='ts'>
defineProps<{
  progress: number
}>()
</script>
  
<style lang="scss" scoped>
.progress {
  --height: 4px;
  width: 100%;
  height: var(--height);
  border-radius: var(--height);
  overflow: hidden;
  z-index: 1;

  &::after {
    content: '';
    display: block;
    width: calc(v-bind(progress) * 100%);
    height: 100%;
    background-color: var(--primary-color, #409eff);
    transition: width 0.3s;
    border-radius: var(--height);
  }
}
</style>