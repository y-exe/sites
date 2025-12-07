<script setup>
import { onMounted } from 'vue';
import Lenis from '@studio-freight/lenis';
import SplitText from './components/SplitText.vue'; 

onMounted(() => {
    
    let isInitialLoad = true;

    const lenis = new Lenis();
    lenis.stop();

    function raf(time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    const stalkers = document.querySelectorAll('.stalker');
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    if (isTouchDevice) {
        stalkers.forEach(el => el.style.display = 'none');
    } else if (stalkers.length > 0) {
        const stalkerPos = Array.from({ length: stalkers.length }, () => ({ x: 0, y: 0 }));
        let mousePos = { x: -100, y: -100 };
        window.addEventListener('mousemove', e => {
            mousePos.x = e.clientX;
            mousePos.y = e.clientY;
        });
        const updateStalker = () => {
            stalkerPos.forEach((pos, i) => {
                const targetPos = i === 0 ? mousePos : stalkerPos[i - 1];
                pos.x += (targetPos.x - pos.x) * 0.25;
                pos.y += (targetPos.y - pos.y) * 0.25;
                stalkers[i].style.transform = `translate(${pos.x}px, ${pos.y}px)`;
            });
            requestAnimationFrame(updateStalker);
        };
        updateStalker();
    }
    
    const loadingScreen = document.getElementById('loading');
    const pgpLink = document.getElementById('pgp-link');
    const pgpModal = document.getElementById('pgp-modal');
    const emailLink = document.getElementById('email-link');
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    const darkModeIcon = darkModeToggle ? darkModeToggle.querySelector('i') : null;
    
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
    
    const headerItems = document.querySelectorAll('.header-fixed-item');
    const topNav = document.getElementById('top-nav');
    const backToTopBtn = document.getElementById('back-to-top');
    
    lenis.on('scroll', (e) => {
        const scrollThreshold = 50;
        const isScrolledDown = e.scroll > scrollThreshold;
        headerItems.forEach(item => item && item.classList.toggle('hidden', isScrolledDown));
        topNav && topNav.classList.toggle('visible', isScrolledDown);
        backToTopBtn && backToTopBtn.classList.toggle('visible', e.scroll > 300);
    });

    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if(targetId === '#top' || targetId === '#') {
                 lenis.scrollTo(0, { duration: 1.5 });
            } else {
                const targetElement = document.querySelector(targetId);
                if(targetElement){
                     lenis.scrollTo(targetElement, {
                        duration: 1.5,
                        easing: (t) => t === 1 ? 1 : 1 - Math.pow(2, -10 * t),
                    });
                }
            }
        });
    });

    const aboutIcon = document.getElementById('about-icon');
    if (aboutIcon) {
        aboutIcon.addEventListener('click', () => {
            aboutIcon.classList.add('jiggle');
            setTimeout(() => { aboutIcon.classList.remove('jiggle'); }, 500);
        });
    }

    const pgpKeyText = `-----BEGIN PGP PUBLIC KEY BLOCK-----
xjMEaGdxTRYJKwYBBAHaRw8BAQdAmdRPek5wM0eBSZtgyL88XDlUZYT+HEh8
dwSFlrpoH9PNK3kuZXhlLjEyMDFAcHJvdG9uLm1lIDx5LmV4ZS4xMjAxQHBy
b3Rvbi5tZT7CwBEEExYKAIMFgmhncU0DCwkHCZB7z88Mctdlk0UUAAAAAAAc
ACBzYWx0QG5vdGF0aW9ucy5vcGVucGdwanMub3JnU3uwCjmthf09U+JiFj+T
ubdnHgGRVlV00HAsiTvI3NgDFQoIBBYAAgECGQECmwMCHgEWIQTUw+BBkMUe
QHr8ZRR7z88MctdlkwAATvgBANKYeQXWaJyBNPwNC6BkY2v3exEJXQU4en/J
yGTalTEDAQCSsYmdveGEHSW+KRk42wlj+AE6BUj6HXD7PA99R4TqDs44BGhn
cU0SCisGAQQBl1UBBQEBB0D26VCAcdqoJ3jql5m/0IY+BlO+CnhIeGTvODbh
WNUlOwMBCAfCvgQYFgoAcAWCaGdxTQmQe8/PDHLXZZNFFAAAAAAAHAAgc2Fs
dEBub3RhdGlvbnMub3BlbnBncGpzLm9yZ84HzviMRoHCUnvpjmbRGJfpjfmt
/FJ77rJLKbWt9dMSApsMFiEE1MPgQZDFHkB6/GUUe8/PDHLXZZMAAKQऽAP9A
XQXIOtNybkLCm/6/ezbr1w2KyXXzmvkwo1Fbqy0xTAD7BN8nz8vDwVOXa+E8
l3vt8HcNWaH+4Ob5YpDq7BzHIAI=
=tWhX
-----END PGP PUBLIC KEY BLOCK-----`;
    
    const pgpKeyTextElement = document.getElementById('pgp-key-text');
    if (pgpKeyTextElement) pgpKeyTextElement.textContent = pgpKeyText;

    if (localStorage.getItem('theme') === 'dark' && darkModeIcon) {
        document.body.classList.add('dark-mode');
        darkModeIcon.classList.replace('fa-moon', 'fa-sun');
    }
    
    function setupSplitText() {
        document.querySelectorAll('[data-split-text]').forEach(el => {
            if (el.classList.contains('is-ready')) return;
            const text = el.innerHTML;
            const regex = /(<span class="gradient-text">.*?<\/span>)|(.)/gs;
            let newHTML = '';
            let charCount = 0;
            let match;
            while ((match = regex.exec(text)) !== null) {
                 const part = match[0];
                 const delay = charCount * 50;
                 if (part.startsWith('<span')) {
                    newHTML += `<span class="char" style="--char-delay: ${delay}ms">${part}</span>`;
                } else {
                    newHTML += `<span class="char" style="--char-delay: ${delay}ms">${part === ' ' ? '&nbsp;' : part}</span>`;
                }
                charCount++;
            }
            if(charCount === 0 && text.length > 0) {
                 newHTML = text.split('').map((char, i) => {
                     const delay = i * 50;
                     return `<span class="char" style="--char-delay: ${delay}ms">${char === ' ' ? '&nbsp;' : char}</span>`
                 }).join('');
            }

            el.innerHTML = newHTML;
            el.classList.add('is-ready');
        });
    }
    
    const animationCallback = (entries) => {
        if (isInitialLoad) return;
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
            } else {
                entry.target.classList.remove('is-visible');
            }
        });
    };

    const revealObserver = new IntersectionObserver(animationCallback, { 
        rootMargin: "0px 0px -20px 0px"
    });

    const textObserver = new IntersectionObserver(animationCallback, { threshold: 0.2 });
    
    setupSplitText();
    document.querySelectorAll('[data-reveal]').forEach(el => revealObserver.observe(el));
    document.querySelectorAll('[data-split-text]').forEach(el => textObserver.observe(el));

    let progress = 0;
    const interval = setInterval(() => {
        progress = Math.min(100, progress + 1);
        const loadingPercentageEl = document.getElementById('loading-percentage');
        if (loadingPercentageEl) loadingPercentageEl.textContent = `${progress}%`;
        if (progress >= 100) {
            clearInterval(interval);
            loadingScreen.classList.add('fade-out');
            loadingScreen.addEventListener('transitionend', () => {
                loadingScreen.style.display = 'none';
                lenis.start();
                
                const initialElements = document.querySelectorAll(
                    '.header-fixed-item[data-reveal], .main [data-reveal], .main [data-split-text]'
                );

                initialElements.forEach((el, index) => {
                    setTimeout(() => {
                        el.classList.add('is-visible');
                    }, index * 180);
                });

                setTimeout(() => {
                    isInitialLoad = false;
                }, initialElements.length * 180);

                setTimeout(() => {
                    fetchDiscordStatus();
                    fetchGithubProjects(revealObserver);
                }, 500);
                updateCurrentTime();
                setInterval(updateCurrentTime, 1000);
            }, { once: true });
        }
    }, 20);

    darkModeToggle?.addEventListener('click', (event) => {
        if (!document.startViewTransition) {
            document.body.classList.toggle('dark-mode');
            updateTheme();
            return;
        }
        document.documentElement.style.setProperty('--clip-x', event.clientX + 'px');
        document.documentElement.style.setProperty('--clip-y', event.clientY + 'px');
        document.startViewTransition(() => {
            document.body.classList.toggle('dark-mode');
            updateTheme();
        });
    });
    
    function updateTheme() {
        const isDarkNow = document.body.classList.contains('dark-mode');
        localStorage.setItem('theme', isDarkNow ? 'dark' : 'light');
        if (darkModeIcon) {
            darkModeIcon.classList.replace(isDarkNow ? 'fa-moon' : 'fa-sun', isDarkNow ? 'fa-sun' : 'fa-moon');
        }
    }

    if(pgpLink) pgpLink.addEventListener('click', e => { e.preventDefault(); pgpModal.classList.add('visible'); });
    if(pgpModal) pgpModal.addEventListener('click', e => { if (e.target === pgpModal || e.target.classList.contains('modal-close-btn')) pgpModal.classList.remove('visible'); });
    document.getElementById('pgp-copy-btn')?.addEventListener('click', () => { navigator.clipboard.writeText(pgpKeyText).then(() => showToast('PGPキーをコピーしました')); });
    const pgpDownloadLink = document.getElementById('pgp-download-link');
    if(pgpDownloadLink) {
        const blob = new Blob([pgpKeyText], { type: 'text/plain' });
        pgpDownloadLink.href = URL.createObjectURL(blob);
        pgpDownloadLink.download = 'y.exe_pgp_key.asc';
    }
    if(emailLink) emailLink.addEventListener('click', e => { e.preventDefault(); navigator.clipboard.writeText('y.exe.1201@proton.me').then(() => showToast('メールアドレスをコピーしました')); });
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
    } catch (error) { console.error("Lanyard API error:", error); }
}

async function fetchGithubProjects(observer) {
    const username = 'y-exe';
    const projectsGrid = document.querySelector('.projects-grid');
    if (!projectsGrid) return;

    const apiUrl = `https://api.github.com/users/${username}/repos?sort=updated&per_page=9`;
    const languageColors = {'JavaScript':'#f1e05a','TypeScript':'#3178c6','HTML':'#e34c26','CSS':'#563d7c','Python':'#3572A5','Java':'#b07219','C++':'#f34b7d','C#':'#178600','PHP':'#4F5D95','Go':'#00ADD8','Rust':'#dea584','Ruby':'#701516','Shell':'#89e051'};
    try {
        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error(`GitHub API error: ${response.status}`);
        const repos = await response.json();
        const originalRepos = repos.filter(repo => !repo.fork);
        if (originalRepos.length === 0) {
            projectsGrid.innerHTML = '<p data-reveal="up">公開されているプロジェクトはありません。</p>';
        } else {
            projectsGrid.innerHTML = originalRepos.map(repo => {
                const langColor = languageColors[repo.language] || '#ccc';
                return `<a href="${repo.html_url}" target="_blank" class="project-card" data-reveal="up">
                    <h3>${repo.name}</h3>
                    <p>${repo.description || '説明がありません。'}</p>
                    <div class="project-meta">
                        <span>${repo.language ? `<span class="language-color" style="background-color: ${langColor};"></span> ${repo.language}` : ''}</span>
                        <span><i class="fa-regular fa-star"></i> ${repo.stargazers_count}</span>
                    </div>
                </a>`;
            }).join('');
            
            if(observer) {
                projectsGrid.querySelectorAll('[data-reveal]').forEach(el => observer.observe(el));
            }
        }
    } catch (error) {
        console.error('GitHub fetch error:', error);
        projectsGrid.innerHTML = '<p data-reveal="up">プロジェクトの読み込みに失敗しました。</p>';
    }
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
        <button id="dark-mode-toggle" title="Toggle Dark Mode"><i class="fa-solid fa-moon"></i></button>
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
                             <video autoplay loop muted playsinline src="https://raw.githubusercontent.com/y-exe/sites/refs/heads/main/file/Discord.webm"></video>
                        </div>
                        <div class="discord-pfp">
                            <div class="discord-pfp-wrapper">
                                <img src="https://raw.githubusercontent.com/y-exe/sites/refs/heads/main/file/icon.webp" alt="PFP">
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
            <div class="projects-grid"></div>
        </section>

        <section id="about" class="section about-section">
            <div class="about-container">
                <div class="about-card">
                    <img src="https://raw.githubusercontent.com/y-exe/sites/refs/heads/main/file/icon.webp" alt="y_exe icon" id="about-icon" data-reveal="up">
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

    <a href="#top" id="back-to-top" title="Back to Top"><i class="fa-solid fa-arrow-up"></i></a>
</template>