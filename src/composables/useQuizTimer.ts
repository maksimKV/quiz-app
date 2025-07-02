import { ref, computed, onBeforeUnmount } from 'vue'

export function useQuizTimer(initialTime: number = 0, onTimeUp?: () => void) {
  const timeLeft = ref(initialTime)
  let timerInterval: any = null

  const minutes = computed(() => Math.floor(timeLeft.value / 60))
  const seconds = computed(() => timeLeft.value % 60)
  const isRunning = computed(() => !!timerInterval)

  function start() {
    if (timerInterval) return
    timeLeft.value = initialTime
    timerInterval = setInterval(() => {
      if (timeLeft.value > 0) {
        timeLeft.value--
      } else {
        stop()
        if (onTimeUp) onTimeUp()
      }
    }, 1000)
  }

  function stop() {
    if (timerInterval) {
      clearInterval(timerInterval)
      timerInterval = null
    }
  }

  function reset() {
    stop()
    timeLeft.value = initialTime
  }

  onBeforeUnmount(() => {
    stop()
  })

  return {
    timeLeft,
    minutes,
    seconds,
    isRunning,
    start,
    stop,
    reset
  }
} 