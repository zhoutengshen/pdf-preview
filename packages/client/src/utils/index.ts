export function createExposureObserver(
  seconds: number,
  exportation: (entry: IntersectionObserverEntry) => void,
  init: IntersectionObserverInit = {
    root: null,
    rootMargin: '0px',
    threshold: 0.1
  }
) {
  const exposureStartTimes = new WeakMap()
  const exposureTimers = new Map();
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        // 记录元素开始曝光的时间
        exposureStartTimes.set(entry.target, Date.now());
        // 设置定时器
        const timer = setTimeout(() => {
          console.log(`元素 ${entry.target.id} 曝光超过 ${seconds} 秒`);
          // 清除开始曝光时间
          exposureStartTimes.delete(entry.target);
          // 清除定时器
          exposureTimers.delete(entry.target);
          exportation(entry);
        }, seconds * 1000);
        exposureTimers.set(entry.target, timer);
      } else {
        // 清除开始曝光时间
        exposureStartTimes.delete(entry.target);
        // 清除定时器
        const timer = exposureTimers.get(entry.target);
        if (timer) {
          clearTimeout(timer);
          exposureTimers.delete(entry.target);
        }
      }
    });
  }, {
    root: null,
    rootMargin: '0px',
    threshold: 0.1,
    ...init
  });

  return observer;
}