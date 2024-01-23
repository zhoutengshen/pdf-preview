import type { PDFDocumentLoadingTask } from "pdfjs-dist";
import { computed, ref } from "vue";

export const usePdfProgress = (loadingTask?: PDFDocumentLoadingTask) => {
  const total = ref(0);
  const loaded = ref(0);
  const init = (loadingTask: PDFDocumentLoadingTask) => {
    loadingTask.onProgress = (progressData: any) => {
      total.value = progressData.total;
      loaded.value = progressData.loaded;
    };
  }
  if (loadingTask) {
    init(loadingTask);
  }

  return {
    total,
    loaded,
    progress: computed(() => Number(((loaded.value / total.value) || 0))),
    initPdfProgress: init,
  };
}