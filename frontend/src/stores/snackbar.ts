import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useSnackbarStore = defineStore('snackbar', () => {
  const show = ref(false)
  const message = ref('')
  const color = ref('success')

  function success(msg: string) {
    message.value = msg
    color.value = 'success'
    show.value = true
  }

  function error(msg: string) {
    message.value = msg
    color.value = 'error'
    show.value = true
  }

  function info(msg: string) {
    message.value = msg
    color.value = 'info'
    show.value = true
  }

  return { show, message, color, success, error, info }
})
