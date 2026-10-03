import { computed, shallowRef, watch } from 'vue'
import type { Ref } from 'vue'

export const useProjectResults = <T>(data: Ref<T[] | null>, status: Ref<string>) => {
  const previous = shallowRef<T[]>([])
  watch([data, status], ([projects, value]) => {
    if (value === 'success') previous.value = projects || []
  }, { immediate: true })
  return computed(() => status.value === 'success' ? data.value : previous.value.length ? previous.value : data.value)
}
