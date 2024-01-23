<script lang="ts" setup>
import * as pdfjsLib from 'pdfjs-dist'
import * as workerSrc from 'pdfjs-dist/build/pdf.worker'
import { usePdfProgress } from './hooks'
import type { PDFDocumentProxy } from 'pdfjs-dist'
import { ref, onMounted } from 'vue'
import { createExposureObserver } from '@/utils/index'


pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc

const scaleFactor = 1.5
enum RenderStatus {
  RENDERING = 'rendering',
  RENDERED = 'rendered',
  WAITING = 'waiting',
  Error = 'error'
}

const props = withDefaults(defineProps<{
  url: string
  maxHeight: string
}>(), {
  url: 'http://localhost:8080/preview-pdf',
  maxHeight: '100vh'
})

var loadingTask = pdfjsLib.getDocument({
  url: props.url,
  disableAutoFetch: true,
  disableStream: true,
  // 指定最小加载字节数
  rangeChunkSize: 66 * 1024,
})
const { progress } = usePdfProgress(loadingTask)
const pageListRef = ref<HTMLElement | null>(null)
let pdfDocument: PDFDocumentProxy | null = null
let observer: IntersectionObserver | null = null;


onMounted(() => {
  // 注册交叉观察者，用于按需渲染页面
  observer = createExposureObserver(0.5, (entry) => {
    const target = entry.target as HTMLElement
    const pageNumber = target.dataset?.pageNumber
    const renderStatus = target.dataset?.renderStatus as RenderStatus
    preRenderPage(Number(pageNumber), renderStatus)
  }, {
    root: document.querySelector('.pdf-container'),
    rootMargin: '0px',
    threshold: 0.1
  })
  loadingTask.promise.then(function (pdf) {
    pdfDocument = pdf
    // 初始化渲染，用于渲染第一个页面和创建所有的空页面
    initRender(pdf)
  }, function (reason) {
    // PDF loading error
    console.error(reason)
  })
})

// 创建空的 canvas 标签
function insertEmptyCanvas(
  numPages: number | number[],
  parentEl: HTMLElement | null,
  created: (canvas: HTMLCanvasElement) => void = () => { }
) {
  if (parentEl === null) {
    return
  }
  const pageIndexList = Array.isArray(numPages) ? numPages : Array.from({ length: numPages }, (_, i) => i + 1)

  if (parentEl instanceof HTMLElement) {
    if (!parentEl.id) {
      parentEl.id = 'page-list'
    }
    if (!parentEl.className) {
      parentEl.className = 'page-list'
    }
  }
  pageIndexList.forEach(pageIndex => {
    const canvas = document.createElement('canvas')
    const divTag = document.createElement('div')
    divTag.appendChild(canvas)
    // 用于渲染
    canvas.id = pageIdGenerator(pageIndex)
    // 用于渲染
    canvas.dataset.pageNumber = String(pageIndex)
    // 用于页码
    divTag.dataset.pageNumber = String(pageIndex)
    // 用于加载loading
    divTag.dataset.renderStatus = RenderStatus.WAITING
    divTag.classList.add('page-list__item')
    canvas.className = 'page-list__item--canvas'
    canvas.dataset.renderStatus = RenderStatus.WAITING
    parentEl.appendChild(divTag)
    created(canvas)
  })
}

function renderPage(pdf: PDFDocumentProxy, num: number, selector: string) {
  const canvas = document.querySelector(selector) as HTMLCanvasElement
  const canvasParent = canvas.parentElement as HTMLElement
  if (!canvas) {
    return Promise.reject('canvas not found')
  }
  return new Promise<HTMLCanvasElement>((resolve, reject) => {
    pdf.getPage(num).then(page => {
      const viewport = page.getViewport({ scale: scaleFactor })
      page.getTextContent().then((textContent) => {
        if (textContent.items.length <= 0) {
          return
        }
        const textLayerDiv = document.createElement('div')
        textLayerDiv.className = 'textLayer'
        pdfjsLib.renderTextLayer({
          textContentSource: textContent,
          container: textLayerDiv,
          viewport,
          textDivs: [],
        })
        canvasParent.appendChild(textLayerDiv)
      })
      const ctx = canvas.getContext('2d')

      canvas.height = viewport.height
      canvas.width = viewport.width
      canvas.dataset.renderStatus = RenderStatus.RENDERING
      page.render({
        canvasContext: ctx as any,
        viewport
      }).promise.then(() => {
        resolve(canvas)
        // 获取父亲元素
        const parent = canvas.parentElement as HTMLElement
        parent.dataset.renderStatus = RenderStatus.RENDERED
        canvas.dataset.renderStatus = RenderStatus.RENDERED
      }).catch(reject)
    })
  })
}


/**
 *  提前渲染前后两个Page
 * @param pageNumber 
 * @param renderStatus 
 */
function preRenderPage(
  pageNumber: number,
  renderStatus: RenderStatus,
) {
  if (!pdfDocument) {
    return
  }
  const isNeedRender = (checked: RenderStatus) => {
    return ![RenderStatus.RENDERED, RenderStatus.RENDERING].includes(checked)
  }
  // 计算三屏幕内的页面：TOOD: 优化
  if (isNeedRender(renderStatus)) {
    // 当前页面
    renderPage(pdfDocument, pageNumber, `#${pageIdGenerator(pageNumber)}`).then((v) => {
      observer?.unobserve(v)
    })
  }
  const nextCanvasId = pageIdGenerator(pageNumber + 1)
  const nextCanvas = document.querySelector(`#${nextCanvasId}`) as HTMLElement
  if (nextCanvas) {
    const nextRenderStatus = nextCanvas.dataset?.renderStatus as RenderStatus
    if (isNeedRender(nextRenderStatus)) {
      renderPage(pdfDocument, pageNumber + 1, `#${nextCanvasId}`).then((v) => {
        observer?.unobserve(v)
      })
    }
  }
  const preCanvasId = pageIdGenerator(pageNumber - 1)
  const preCanvas = document.querySelector(`#${preCanvasId}`) as HTMLElement
  if (preCanvas) {
    const preRenderStatus = preCanvas.dataset?.renderStatus as RenderStatus
    if (isNeedRender(preRenderStatus)) {
      renderPage(pdfDocument, pageNumber - 1, `#${preCanvasId}`).then((v) => {
        observer?.unobserve(v)
      })
    }
  }
}

function initRender(pdf: PDFDocumentProxy) {
  // 插入并渲染第一个页面
  const initFirstPage = (pdf: PDFDocumentProxy) => {
    return new Promise<HTMLCanvasElement>((resolve, reject) => {
      insertEmptyCanvas([1], pageListRef.value, () => {
        renderPage(pdf, 1, `#${pageIdGenerator(1)}`).then(resolve).catch(reject)
      })
    })
  }
  const numPages = pdf.numPages
  // 所有的页面下标
  const pageIndexList = Array.from({ length: numPages }, (_, i) => i + 1)
  // 以第一个页面为基础，生成后面的页面
  initFirstPage(pdf).then(initCanvas => {
    // 获取初始元素的父亲元素宽高
    const parent = initCanvas.parentElement as HTMLElement
    const parentWidth = parent.clientWidth
    const parentHeight = parent.clientHeight
    insertEmptyCanvas(pageIndexList.slice(1), pageListRef.value, (canvas) => {
      canvas.height = parentHeight
      canvas.width = parentWidth
      observer?.observe(canvas as HTMLElement)
    })
  })
}

/**
 * id 选择器生成函数
 * @param num 
 */
function pageIdGenerator(num: number) {
  return `PAGE_${num}`
}
</script>

<template>
  <div class="pdf-container" :style="{
    '--scale-factor': scaleFactor,
  }">
    <div class="progress"></div>
    <div class="page-list" ref="pageListRef"></div>
  </div>
</template>

<style lang="scss">
@import url(./textLayer.scss);

.pdf-container {
  max-height: v-bind(maxHeight);
  overflow-y: scroll;
  box-sizing: border-box;
  --primary-color: #409eff;

  .progress {
    position: sticky;
    top: 8px;
    left: 0;
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
      background-color: var(--primary-color);
      transition: width 0.3s;
      border-radius: var(--height);
    }
  }

  .page-list {
    height: 100%;
    padding: 32px;
    display: flex;
    flex-direction: column;
    align-items: center;
    // --item-width: 50%;

    &__item {
      position: relative;
      // width: var(--item-width);
      padding-bottom: 32px;
      margin-bottom: 32px;
      border: 1px solid #eee;
      box-shadow: 1px 1px 8px rgba(0, 0, 0, 0.2);

      &--canvas {
        width: 100%;
        height: auto;
      }

      // 页码
      &::after {
        content: attr(data-page-number);
        position: absolute;
        width: 100%;
        background-color: var(--primary-color);
        color: #ffe6e6;
        font-size: 24px;
        bottom: 0;
        left: 50%;
        transform: translate(-50%, 0);
        height: 32px;
        line-height: 32px;
        text-align: center;
      }

      @mixin page-loading {
        &::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          @include loading-icon($progress-color: var(--primary-color),
            $color: rgba(255, 255, 255, 0.8), $size: 64px);
          opacity: 0.7;
        }

      }

      // 选中 rendering 或者 waiting
      &[data-render-status='rendering'],
      &[data-render-status='waiting'] {
        @include page-loading;
      }

    }
  }
}
</style>