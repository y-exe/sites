import assert from 'node:assert/strict'
import { test } from 'node:test'
import { effectScope, nextTick, ref } from 'vue'
import { useProjectResults } from '../composables/useProjectResults.ts'

test('failed refresh keeps the last list, while a successful empty response clears it', async t => {
  const scope = effectScope()
  t.after(() => scope.stop())
  const data = ref<{ id: number }[]>([])
  const status = ref('error')
  const results = scope.run(() => useProjectResults(data, status))!
  assert.deepEqual(results.value, [])
  data.value = [{ id: 1 }]; status.value = 'success'
  await nextTick()
  status.value = 'pending'
  await nextTick()
  data.value = []; status.value = 'error'
  await nextTick()
  assert.deepEqual(results.value, [{ id: 1 }])
  status.value = 'success'
  await nextTick()
  assert.deepEqual(results.value, [])
  status.value = 'error'
  await nextTick()
  assert.deepEqual(results.value, [])
})
