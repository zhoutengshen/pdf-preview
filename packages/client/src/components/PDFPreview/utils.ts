export function getLocalFileUrl(file: Blob) {
  return URL.createObjectURL(file)
}

export function getLocalFileStream(file: Blob) {
  return new Promise((resolve, reject) => {
    // 创建一个新的 FileReader 对象
    const reader = new FileReader()
    // 当文件读取完成时
    reader.onload = function (event) {
      // 使用 fetch API 获取 PDF 数据
      fetch(event.target.result)
        .then(response => {
          // 获取 PDF 数据流
          const reader = response.body.getReader()
          return new ReadableStream({
            start(controller) {
              return pump()
              function pump() {
                return reader.read().then(({ done, value }) => {
                  // 当没有更多数据时
                  if (done) {
                    controller.close()
                    return
                  }
                  // 获取数据块
                  controller.enqueue(value)
                  return pump()
                })
              }
            }
          })
        })
        .then(resolve).catch(reject)
    }
    // 读取本地文件
    reader.readAsDataURL(file)
  })
}