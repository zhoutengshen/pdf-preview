<template>
  <div class="tool-bar">
    <div class="local-file">
      <input accept=".pdf" id="file-input" class="input" type="file" @input="handleFileSelected" />
      <label for="file-input" class="label">
        本地文件
      </label>
    </div>
    <div class="zoom">
      <div class="btn" title="缩小" @click="emits('zoomIn')">-</div>
      {{ Number(zoom * 100).toFixed(0) }}%
      <div class="btn" title="放大" @click="emits('zoomOut')">+</div>
    </div>

  </div>
</template>
  
<script setup lang='ts'>
const emits = defineEmits(['zoomIn', 'zoomOut', 'fileSelected'])
defineProps<{
  zoom: number
}>()

function handleFileSelected(event: Event) {
  const file = event?.target?.files?.[0]
  if (file) {
    emits('fileSelected', file)
  }
}
</script>
  
<style lang="scss" scoped>
.tool-bar {
  height: 32px;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 0 16px;
  box-sizing: border-box;



  .local-file {
    .label {
      font-size: 14px;
      color: #409eff;
      padding-right: 16px;
      box-sizing: border-box;
      border-right: 1px solid #eee;
      cursor: pointer;
    }

    .input {
      width: 0;
      height: 0;
    }
  }

  .zoom {
    display: flex;
    align-items: center;
    justify-content: flex-end;

    .btn {
      font-size: 32px;
      padding: 0 16px;
      box-sizing: border-box;

      &:hover {
        cursor: pointer;
        color: #409eff;
      }
    }
  }

}
</style>