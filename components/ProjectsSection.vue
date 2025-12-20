<script setup lang="ts">
// Propsでデータを受け取る（SSRデータを受け継ぐ）
const props = defineProps<{ projects: any[] | null; status: string }>()

const getLangColor = (lang: string) => {
  const colors: Record<string, string> = {'JavaScript':'#f1e05a','TypeScript':'#3178c6','HTML':'#e34c26','CSS':'#563d7c','Python':'#3572A5','Java':'#b07219','C++':'#f34b7d','Go':'#00ADD8','Rust':'#dea584','Shell':'#89e051'};
  return colors[lang] || '#ccc';
}
</script>

<template>
  <section id="projects" class="section projects-section">
    <!-- v-split-textなどはグローバル登録か、このファイルで再定義が必要 -->
    <h2 class="section-title hover-highlight" v-split-text>
      <span v-for="(char, i) in `Projects`.split('')" :key="i" class="char" :style="`--char-delay: ${i*50}ms`">{{ char }}</span>
    </h2>
    <div class="projects-grid">
      <p v-if="status === 'pending'" v-reveal>プロジェクトを読み込んでいます...</p>
      <p v-else-if="!projects || projects.length === 0" v-reveal>公開されているプロジェクトはありません。</p>
      <a v-else v-for="repo in projects" :key="repo.id" :href="repo.html_url" target="_blank" class="project-card" v-reveal>
        <h3>{{ repo.name }}</h3>
        <p>{{ repo.description || '説明がありません。' }}</p>
        <div class="project-meta">
          <span v-if="repo.language">
            <span class="language-color" :style="{ backgroundColor: getLangColor(repo.language) }"></span>
            {{ repo.language }}
          </span>
          <span v-else></span>
          <span><i class="fa-regular fa-star"></i> {{ repo.stargazers_count }}</span>
        </div>
      </a>
    </div>
  </section>
</template>