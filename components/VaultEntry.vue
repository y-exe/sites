<script setup lang="ts">
const props = withDefaults(defineProps<{ label?: string; value?: string }>(), { label: '年号の数字を回す', value: String(new Date().getFullYear()) })
const characters = ref(props.value.split('')), touched = ref(false), opened = ref(false)
const code = ref('0420'), note = ref('見つけたね。ここに好きなひとことをしまっておけます。'), message = ref('')
const audio = useToyAudio()
let gesture: { id: number; index: number; y: number; value: number; host: HTMLElement } | null = null
watch(() => props.value, value => { if (!touched.value) characters.value = value.split('') })
onMounted(() => { try { const saved = JSON.parse(localStorage.getItem('yexe-play-vault') || 'null'); if (saved && /^\d{4}$/.test(saved.code)) { code.value = saved.code; note.value = String(saved.note).slice(0, 240) } } catch {} })
const turn = (index: number, delta: number) => {
  touched.value = true
  characters.value[index] = String((Number(characters.value[index]) + delta % 10 + 10) % 10)
  void audio.note(48 + Number(characters.value[index]), .05, 'triangle', .04)
  if (characters.value.filter(char => /\d/.test(char)).join('').slice(0, 4) === code.value) { opened.value = true; void audio.note(76, .4) }
}
const start = (event: PointerEvent, index: number) => {
  if (event.button !== 0 || !event.isPrimary) return
  const host = event.currentTarget as HTMLElement
  gesture = { id: event.pointerId, index, y: event.clientY, value: Number(characters.value[index]), host }
  host.setPointerCapture(event.pointerId)
}
const move = (event: PointerEvent) => {
  if (!gesture || gesture.id !== event.pointerId) return
  const next = ((gesture.value + Math.round((gesture.y - event.clientY) / 18)) % 10 + 10) % 10
  if (next !== Number(characters.value[gesture.index])) turn(gesture.index, next - Number(characters.value[gesture.index]))
}
const end = () => { const previous = gesture; gesture = null; if (previous?.host.hasPointerCapture(previous.id)) previous.host.releasePointerCapture(previous.id) }
const save = () => { try { localStorage.setItem('yexe-play-vault', JSON.stringify({ code: code.value, note: note.value.slice(0, 240) })); message.value = 'しまいました' } catch { message.value = 'この端末では保存できません' } }
const restore = () => { end(); opened.value = false; touched.value = false; characters.value = props.value.split(''); message.value = '' }
onUnmounted(end)
</script>
<template>
  <span class="inline-vault" :style="{ width: `${characters.length}ch` }">
    <span class="vault-numbers" role="group" :aria-label="label">
      <template v-for="(char, index) in characters" :key="index">
        <button v-if="/\d/.test(char)" class="vault-entry" type="button" :aria-label="`${label}：${index + 1}文字目 ${char}`" data-tooltip="上下になぞって回す（初期番号 0420）" @pointerdown.prevent="start($event, index)" @pointermove.prevent="move" @pointerup="end" @pointercancel="end" @lostpointercapture="end" @keydown.up.prevent="turn(index, 1)" @keydown.down.prevent="turn(index, -1)"><Transition name="dial-roll"><span :key="char">{{ char }}</span></Transition></button>
        <span v-else>{{ char }}</span>
      </template>
    </span>
    <Transition name="vault-door"><span v-if="opened" class="inline-vault-inside"><label>しまっておくひとこと<textarea v-model="note" rows="3" maxlength="240"/></label><span class="toy-actions"><button type="button" @click="save">しまう</button><button type="button" @click="restore">鍵をかける</button></span><span class="toy-message" role="status">{{ message }}</span></span></Transition>
  </span>
</template>
