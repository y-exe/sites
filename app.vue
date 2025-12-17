<script setup>
import Lenis from '@studio-freight/lenis';

const isScrolledEnough = ref(false);
const isDarkMode = ref(false);
const projects = ref([]);
const projectsLoading = ref(true);

function toggleDarkMode(event) {
    const newIsDark = !isDarkMode.value;
    const update = () => {
        isDarkMode.value = newIsDark;
        document.body.classList.toggle('dark-mode', newIsDark);
        localStorage.setItem('theme', newIsDark ? 'dark' : 'light');
    };
    if (!document.startViewTransition) { update(); return; }
    document.documentElement.style.setProperty('--clip-x', event.clientX + 'px');
    document.documentElement.style.setProperty('--clip-y', event.clientY + 'px');
    document.startViewTransition(update);
}

async function fetchGithubProjectsVue(revealObserver) {
    const username = 'y-exe';
    const apiUrl = `https://api.github.com/users/${username}/repos?sort=updated&per_page=9`;
    projectsLoading.value = true;
    try {
        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error(`GitHub API error: ${response.status}`);
        const repos = await response.json();
        projects.value = repos.filter(repo => !repo.fork);
    } catch (error) {
        console.error('GitHubプロジェクトの読み込みに失敗しました:', error);
        projects.value = [];
    } finally {
        projectsLoading.value = false;
        await nextTick();
        document.querySelectorAll('.projects-grid [data-reveal]').forEach(el => revealObserver.observe(el));
    }
}

const getLangColor = (lang) => {
    const languageColors = {'JavaScript':'#f1e05a','TypeScript':'#3178c6','HTML':'#e34c26','CSS':'#563d7c','Python':'#3572A5','Java':'#b07219','C++':'#f34b7d','C#':'#178600','PHP':'#4F5D95','Go':'#00ADD8','Rust':'#dea584','Ruby':'#701516','Shell':'#89e051'};
    return languageColors[lang] || '#ccc';
};


onMounted(() => {
    if (history.scrollRestoration) {
        history.scrollRestoration = 'manual';
    }
    window.scrollTo(0, 0);

    let isInitialLoad = true;

    const lenis = new Lenis();
    lenis.scrollTo(0, { immediate: true }); 

    lenis.stop();
    function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }
    requestAnimationFrame(raf);

    lenis.on('scroll', (e) => {
        isScrolledEnough.value = e.scroll > 300;
        const scrollThreshold = 50;
        const isScrolledDown = e.scroll > scrollThreshold;
        document.querySelectorAll('.header-fixed-item').forEach(item => item?.classList.toggle('hidden', isScrolledDown));
        document.getElementById('top-nav')?.classList.toggle('visible', isScrolledDown);
    });

    function setupSplitText() {
        document.querySelectorAll('[data-split-text]').forEach(el => {
            if (el.classList.contains('is-ready')) return;
            const text = el.innerHTML;
            const regex = /(<span class="gradient-text">.*?<\/span>)|(.)/gs;
            let newHTML = '';
            let charCount = 0;
            (text.match(regex) || []).forEach(part => {
                const delay = charCount * 50;
                if (part.startsWith('<span')) {
                    newHTML += `<span class="char" style="--char-delay: ${delay}ms">${part}</span>`;
                } else {
                    newHTML += `<span class="char" style="--char-delay: ${delay}ms">${part === ' ' ? '&nbsp;' : part}</span>`;
                }
                charCount++;
            });
            el.innerHTML = newHTML;
            el.classList.add('is-ready');
        });
    }

    const scrollTrigger = document.getElementById('scroll-trigger');
    if (scrollTrigger) {
        const themeObserver = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    const isPastTrigger = entry.boundingClientRect.top < 0;
                    document.body.classList.toggle('theme-2', isPastTrigger);
                });
            }, { rootMargin: "0px 0px 0px 0px", threshold: 0 }
        );
        themeObserver.observe(scrollTrigger);
    }
    
    const revealObserver = new IntersectionObserver((entries) => {
        if (isInitialLoad) return;
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
            } else {
                entry.target.classList.remove('is-visible');
            }
        });
    }, { rootMargin: "0px 0px -20px 0px" });

    const textObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
            } else {
                entry.target.classList.remove('is-visible');
            }
        });
    }, { threshold: 0.2 });


    if (localStorage.getItem('theme') === 'dark') {
        isDarkMode.value = true;
        document.body.classList.add('dark-mode');
    }

    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            
            if (targetId === '#top' || targetId === '#') {
                lenis.scrollTo(0, {
                    duration: 1.5,
                    easing: (t) => t === 1 ? 1 : 1 - Math.pow(2, -10 * t),
                });
            } else {
                const targetElement = document.querySelector(targetId);
                if (targetElement) {
                    lenis.scrollTo(targetElement, {
                        duration: 1.5,
                        easing: (t) => t === 1 ? 1 : 1 - Math.pow(2, -10 * t),
                    });
                }
            }
        });
    });

    const pgpKeyText = `-----BEGIN PGP PUBLIC KEY BLOCK-----\nxjMEaGdxTRYJKwYBBAHaRw8BAQdAmdRPek5wM0eBSZtgyL88XDlUZYT+HEh8\ndwSFlrpoH9PNK3kuZXhlLjEyMDFAcHJvdG9uLm1lIDx5LmV4ZS4xMjAxQHBy\nb3Rvbi5tZT7CwBEEExYKAIMFgmhncU0DCwkHCZB7z88Mctdlk0UUAAAAAAAc\nACBzYWx0QG5vdGF0aW9ucy5vcGVucGdwanMub3JnU3uwCjmthf09U+JiFj+T\nubdnHgGRVlV00HAsiTvI3NgDFQoIBBYAAgECGQECmwMCHgEWIQTUw+BBkMUe\nQHr8ZRR7z88MctdlkwAATvgBANKYeQXWaJyBNPwNC6BkY2v3exEJXQU4en/J\nyGTalTEDAQCSsYmdveGEHSW+KRk42wlj+AE6BUj6HXD7PA99R4TqDs44BGhn\ncU0SCisGAQQBl1UBBQEBB0D26VCAcdqoJ3jql5m/0IY+BlO+CnhIeGTvODbh\nWNUlOwMBCAfCvgQYFgoAcAWCaGdxTQmQe8/PDHLXZZNFFAAAAAAAHAAgc2Fs\ndEBub3RhdGlvbnMub3BlbnBncGpzLm9yZ84HzviMRoHCUnvpjmbRGJfpjfmt\n/FJ77rJLKbWt9dMSApsMFiEE1MPgQZDFHkB6/GUUe8/PDHLXZZMAAKQऽAP9A\nXQXIOtNybkLCm/6/ezbr1w2KyXXzmvkwo1Fbqy0xTAD7BN8nz8vDwVOXa+E8\nl3vt8HcNWaH+4Ob5YpDq7BzHIAI=\n=tWhX\n-----END PGP PUBLIC KEY BLOCK-----`;
    const pgpModal = document.getElementById('pgp-modal');
    document.getElementById('pgp-key-text').textContent = pgpKeyText;
    document.getElementById('pgp-link')?.addEventListener('click', e => { e.preventDefault(); pgpModal?.classList.add('visible'); });
    pgpModal?.addEventListener('click', e => { if (e.target === pgpModal || e.target.classList.contains('modal-close-btn')) pgpModal.classList.remove('visible'); });
    document.getElementById('pgp-copy-btn')?.addEventListener('click', () => { navigator.clipboard.writeText(pgpKeyText).then(() => showToast('PGPキーをコピーしました')); });
    const pgpDownloadLink = document.getElementById('pgp-download-link');
    if (pgpDownloadLink) {
        const blob = new Blob([pgpKeyText], { type: 'text/plain' });
        pgpDownloadLink.href = URL.createObjectURL(blob);
        pgpDownloadLink.download = 'y.exe_pgp_key.asc';
    }
    document.getElementById('email-link')?.addEventListener('click', e => { e.preventDefault(); navigator.clipboard.writeText('y.exe.1201@proton.me').then(() => showToast('メールアドレスをコピーしました')); });
    document.getElementById('about-icon')?.addEventListener('click', (e) => {
        e.currentTarget.classList.add('jiggle');
        setTimeout(() => { e.currentTarget.classList.remove('jiggle'); }, 500);
    });

    const loadingScreen = document.getElementById('loading');
    let progress = 0;
    const interval = setInterval(() => {
        progress = Math.min(100, progress + 1);
        document.getElementById('loading-percentage').textContent = `${progress}%`;
        if (progress >= 100) {
            clearInterval(interval);
            loadingScreen.classList.add('fade-out');
            loadingScreen.addEventListener('transitionend', async () => {
                loadingScreen.style.display = 'none';
                lenis.start();

                setupSplitText();
                
                document.querySelectorAll('[data-reveal]').forEach(el => revealObserver.observe(el));
                document.querySelectorAll('[data-split-text]').forEach(el => textObserver.observe(el));
                
                const initialElements = document.querySelectorAll('.header-fixed-item[data-reveal], .main [data-reveal], .main [data-split-text]');
                initialElements.forEach((el, index) => {
                    const threshold = 8;
                    let delay = 0;
                    if (index < threshold) {
                        delay = index * 50; 
                    } else {
                        delay = (threshold * 50) + ((index - threshold) * 100);
                    }
                    setTimeout(() => {
                        el.classList.add('is-visible');
                    }, delay);
                });
                
                setTimeout(() => { isInitialLoad = false; }, initialElements.length * 100 + 1000);

                setTimeout(() => {
                    fetchDiscordStatus();
                    fetchGithubProjectsVue(revealObserver);
                }, 500);
                updateCurrentTime();
                setInterval(updateCurrentTime, 1000);
            }, { once: true });
        }
    }, 20);
});

function showToast(message) {
    const toast = document.getElementById('toast-notification');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => { toast.classList.remove('show'); }, 3000);
}
function updateCurrentTime() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('ja-JP', { hour12: false });
    const currentTimeEl = document.getElementById('current-time');
    if (currentTimeEl) currentTimeEl.textContent = timeString;
    const jstTime = now.toLocaleTimeString('en-US', { timeZone: 'Asia/Tokyo', hour: '2-digit', minute: '2-digit', hour12: true });
    const aboutTimeEl = document.getElementById('about-time');
    if(aboutTimeEl) aboutTimeEl.innerHTML = `<i class="fa-solid fa-clock"></i> JST - ${jstTime}`;
}
async function fetchDiscordStatus() {
    const userId = '1438769007636385914';
    const statusIndicator = document.getElementById('discord-status-indicator');
    const statusBubble = document.getElementById('custom-status-bubble');
    const statusTextSpan = document.getElementById('custom-status-text');
    if (!statusIndicator || !statusBubble || !statusTextSpan) return;
    try {
        const response = await fetch(`https://api.lanyard.rest/v1/users/${userId}`);
        if (!response.ok) return;
        const { data } = await response.json();
        if (data) {
            statusIndicator.className = 'status-indicator ' + (data.discord_status || 'offline');
            const customStatus = data.activities.find(activity => activity.type === 4);
            if (customStatus && customStatus.state) {
                let emojiHtml = '';
                if (customStatus.emoji) {
                    if (customStatus.emoji.id) {
                        const emojiUrl = `https://cdn.discordapp.com/emojis/${customStatus.emoji.id}.${customStatus.emoji.animated ? 'gif' : 'png'}`;
                        emojiHtml = `<img src="${emojiUrl}" alt="emoji" class="custom-status-emoji">`;
                    } else { emojiHtml = `<span>${customStatus.emoji.name}</span>`; }
                }
                statusTextSpan.innerHTML = `${emojiHtml} ${customStatus.state}`;
                statusBubble.classList.add('visible');
            } else { statusBubble.classList.remove('visible'); }
        }
    } catch (error) { console.error("Lanyard APIの読み込みに失敗しました:", error); }
}
</script>

<template>
  <div id="loading">
      <span id="loading-percentage">0%</span>
      <div id="loading-text">ま、こんなサイトなんもないんですけどね()</div>
  </div>
  
  <div class="stalker"></div>
  <div class="stalker"></div>
  <div class="stalker"></div>
  
  <div class="header-fixed-item shields-container" data-reveal="down">
      <img class="shields-badge" src="https://img.shields.io/github/last-commit/y-exe/sites" alt="Last Commit">
      <a href="https://github.com/y-exe/sites"><img class="shields-badge" src="https://img.shields.io/badge/Github-y_exe-blue?style=flat-square" alt="Github"></a>
      <a href="https://x.com/y__exe"><img class="shields-badge" src="https://img.shields.io/badge/Twitter(X)-@y__exe-blue?style=flat-square" alt="Twitter(X)"></a>
  </div>
  <div id="getloli-counter" class="header-fixed-item" data-reveal="down">
      <img src="https://count.getloli.com/@yexe.net?theme=rule34" alt=":counter" />
      <span id="getloli-counter-text">アクセス感謝～</span>
  </div>
  <div id="now" class="header-fixed-item" data-reveal="down">現在時刻：<span id="current-time"></span></div>
  <div id="hayane" class="header-fixed-item" data-reveal="down">はよ寝ろ</div>

  <nav id="top-nav">
      <div class="nav-links">
          <a href="#top">Home</a>
          <a href="#projects">Projects</a>
          <a href="#about">About</a>
      </div>
      <button id="dark-mode-toggle" title="Toggle Dark Mode" @click="toggleDarkMode">
          <i class="fa-solid" :class="isDarkMode ? 'fa-sun' : 'fa-moon'"></i>
      </button>
  </nav>
  
  <main>
      <section class="section main">
          <header class="hero-text">
              <p class="text-line-1" data-split-text>(*'▽')</p>
              <p class="text-line-2" data-split-text>I'm <span class="gradient-text">Hentai</span></p>
              <p class="text-line-3" data-split-text>現在活動停止中かもしれない。</p>
          </header>
          <div class="quick-nav-buttons" data-reveal="up">
              <a href="#projects" class="quick-nav-btn btn-primary">Projects <i class="fa-solid fa-arrow-right"></i></a>
              <a href="#about" class="quick-nav-btn btn-secondary">About <i class="fa-solid fa-arrow-right"></i></a>
          </div>
          
          <div class="contact-section">
              <div class="contact-links">
                  <a href="https://discord.com/users/1438769007636385914" target="_blank" class="contact-item discord" data-reveal="up">
                      <div class="discord-banner">
                           <video autoplay loop muted playsinline src="/Discord.webm"></video>
                      </div>
                      <div class="discord-pfp">
                          <div class="discord-pfp-wrapper">
                              <img src="/icon.webp" alt="PFP">
                              <span id="discord-status-indicator" class="status-indicator"></span>
                          </div>
                      </div>
                      <div class="discord-text">
                          <div id="custom-status-bubble" class="custom-status-bubble">
                              <span id="custom-status-text" class="custom-status-text"></span>
                          </div>
                          <span class="discord-display-name">(*'▽')</span>
                          <span class="discord-username">@y_xyz</span>
                      </div>
                      <i class="fa-brands fa-discord discord-icon"></i>
                  </a>
                  
                  <a href="https://x.com/y__exe" target="_blank" class="contact-item" data-reveal="up">
                      <div class="contact-info-left"><i class="fa-brands fa-twitter"></i><span class="contact-name">Twitter</span></div>
                      <span class="contact-username-pill">@y__exe</span>
                  </a>
                  <a href="https://github.com/y-exe" target="_blank" class="contact-item" data-reveal="up">
                      <div class="contact-info-left"><i class="fa-brands fa-github"></i><span class="contact-name">GitHub</span></div>
                      <span class="contact-username-pill">@y-exe</span>
                  </a>
                  <a href="https://t.me/h_exe" target="_blank" class="contact-item" data-reveal="up">
                      <div class="contact-info-left"><i class="fa-brands fa-telegram"></i><span class="contact-name">Telegram</span></div>
                      <span class="contact-username-pill">@h_exe</span>
                  </a>
                  <a href="https://signal.me/#eu/coWGpls-QtNkrqZ8-wohlyrkC35mfWNncnTFRuoU_q6P9mXTqnpDp4h1g05dWLTY" target="_blank" class="contact-item" data-reveal="up">
                      <div class="contact-info-left"><i class="fa-brands fa-signal-messenger"></i><span class="contact-name">Signal</span></div>
                      <span class="contact-username-pill">@yexe.77</span>
                  </a>
                  <a href="#" id="email-link" class="contact-item" data-reveal="up">
                      <div class="contact-info-left"><i class="fa-solid fa-envelope"></i><span class="contact-name">Email</span></div>
                      <span class="contact-username-pill">y.exe.1201</span>
                  </a>
                  <a href="#" id="pgp-link" class="contact-item" data-reveal="up">
                      <div class="contact-info-left"><i class="fa-solid fa-key"></i><span class="contact-name">PGP</span></div>
                      <span class="contact-username-pill">Public Key</span>
                  </a>
                  
                  <div class="server-status" data-reveal="up">
                      <h3 class="hover-highlight" data-split-text>起動状況</h3>
                      <div class="shields-group">
                          <img src="https://img.shields.io/endpoint?url=https%3A%2F%2Fhealthchecks.io%2Fb%2F3%2F2511f393-7539-4092-9170-0f0c4d5809ac.shields" alt="Server1">
                          <img src="https://img.shields.io/endpoint?url=https%3A%2F%2Fhealthchecks.io%2Fb%2F3%2F9dabb00b-609f-4519-9193-dac9575a3953.shields" alt="Server2">
                      </div>
                  </div>
              </div>
          </div>
          <a href="#projects" id="scroll-down-container" aria-label="Scroll to Projects" data-reveal="up">
              <span class="scroll-down-text">Projects</span>
              <i class="fa-solid fa-chevron-down scroll-down-icon"></i>
          </a>
          <div id="scroll-trigger"></div>
      </section>

      <section id="projects" class="section projects-section">
          <h2 class="section-title hover-highlight" data-split-text>Projects</h2>
          <div class="projects-grid">
              <p v-if="projectsLoading" data-reveal="up">プロジェクトを読み込んでいます...</p>
              <p v-else-if="projects.length === 0" data-reveal="up">公開されているプロジェクトはありません。</p>
              <a v-else v-for="repo in projects" :key="repo.id" :href="repo.html_url" target="_blank" class="project-card" data-reveal="up">
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

      <section id="about" class="section about-section">
          <div class="about-container">
              <div class="about-card">
                  <img src="/icon.webp" alt="y_exe icon" id="about-icon" data-reveal="up">
                  <h2 class="section-title hover-highlight" data-split-text>Hello, I'm (*'▽')</h2>
                  <p class="hover-highlight" data-split-text>I am a 16 year old developer-wannabe.</p>
                  <div class="info-pills" data-reveal="up">
                      <span><i class="fa-solid fa-user"></i> He/Him</span>
                      <span id="about-time"><i class="fa-solid fa-clock"></i> JST - ...</span>
                      <span><i class="fa-solid fa-location-dot"></i> JAPAN</span>
                  </div>
              </div>
              <div class="about-card">
                  <div class="tech-category" data-reveal="up">
                      <h3 class="hover-highlight" data-split-text>IDEs</h3>
                      <div class="tech-pills">
                          <span><i class="fa-solid fa-code"></i> VSCode</span>
                          <span><i class="fa-solid fa-code"></i> IntelliJ IDEA</span>
                      </div>
                  </div>
                  <div class="tech-category" data-reveal="up">
                      <h3 class="hover-highlight" data-split-text>Backend</h3>
                      <div class="tech-pills">
                          <span><i class="fa-brands fa-python"></i> Python</span>
                          <span><i class="fa-brands fa-java"></i> Java</span>
                          <span><i class="fa-solid fa-k"></i> Kotlin</span>
                          <span><i class="fa-brands fa-js"></i> TypeScript</span>
                          <span><i class="fa-brands fa-js"></i> JavaScript</span>
                          <span><i class="fa-brands fa-node-js"></i> Node.js</span>
                      </div>
                  </div>
                  <div class="tech-category" data-reveal="up">
                      <h3 class="hover-highlight" data-split-text>Frontend</h3>
                      <div class="tech-pills">
                          <span><i class="fa-brands fa-js"></i> TypeScript</span>
                          <span><i class="fa-brands fa-js"></i> JavaScript</span>
                          <span><i class="fa-solid fa-code"></i> Next.js</span>
                      </div>
                  </div>
              </div>
          </div>
           <footer class="footer">
              <p class="footer-logo" data-reveal="up">yexe.net</p>
              <p class="footer-copyright" data-reveal="up">Copyright © 2025 yexe</p>
          </footer>
      </section>
  </main>

  <div id="pgp-modal" class="modal-overlay">
      <div class="modal-content">
          <div class="modal-header">
              <h2>PGP Public Key</h2>
              <button class="modal-close-btn">×</button>
          </div>
          <pre id="pgp-key-text" class="pgp-key-block"></pre>
          <div class="pgp-fingerprint">
              <strong>Fingerprint :</strong> d4c3e04190c51e407afc65147bcfcf0c72d76593
          </div>
          <div class="modal-actions">
              <button id="pgp-copy-btn">クリップボードにコピー</button>
              <a id="pgp-download-link" href="#">キーファイルをダウンロード</a>
          </div>
      </div>
  </div>
  
  <div id="toast-notification"></div>

  <a href="#top" id="back-to-top" title="Back to Top" :class="{ 'visible': isScrolledEnough }">
      <i class="fa-solid fa-arrow-up"></i>
  </a>
</template>