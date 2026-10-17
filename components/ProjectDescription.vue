<script setup lang="ts">
import { renderProjectDescription } from '~/utils/project-description'

const props = defineProps<{ source: string }>()
const html = computed(() => renderProjectDescription(props.source))
</script>

<template>
  <div class="project-description-markdown" v-html="html"></div>
</template>

<style scoped>
.project-description-markdown { overflow-wrap: anywhere; }
.project-description-markdown :deep(> :first-child) { margin-top: 0; }
.project-description-markdown :deep(> :last-child) { margin-bottom: 0; }
.project-description-markdown :deep(p) { margin: 0 0 .85em; }
.project-description-markdown :deep(a) { color: var(--active-text); text-decoration: underline; text-underline-offset: 3px; }
.project-description-markdown :deep(img) { display: inline-block; max-width: 100%; height: auto; vertical-align: middle; }
.project-description-markdown :deep(:is(h1, h2, h3, h4, h5, h6)) { margin: 1.2em 0 .5em; color: var(--active-text); font-size: 1.1em; font-weight: 700; text-align: left; letter-spacing: normal; }
.project-description-markdown :deep(:is(ul, ol)) { margin: .7em 0; padding-left: 1.5em; }
.project-description-markdown :deep(ul) { list-style-type: disc; }
.project-description-markdown :deep(ol) { list-style-type: decimal; }
.project-description-markdown :deep(.task-list-item) { list-style: none; }
.project-description-markdown :deep(.task-list-item-checkbox) { margin-right: .4em; }
.project-description-markdown :deep(blockquote) { margin: .8em 0; padding-left: 1em; border-left: 3px solid var(--card-border-color); }
.project-description-markdown :deep(code) { padding: .1em .3em; border-radius: 4px; background: var(--pill-bg-color); font-size: .9em; }
.project-description-markdown :deep(pre) { max-width: 100%; overflow-x: auto; padding: .8em; border-radius: 8px; background: var(--pill-bg-color); }
.project-description-markdown :deep(pre code) { padding: 0; background: transparent; }
.project-description-markdown :deep(table) { display: block; max-width: 100%; overflow-x: auto; border-collapse: collapse; margin: .8em 0; }
.project-description-markdown :deep(:is(th, td)) { padding: .4em .7em; border: 1px solid var(--card-border-color); }
.project-description-markdown :deep(hr) { margin: 1em 0; border: 0; border-top: 1px solid var(--card-border-color); }
</style>
