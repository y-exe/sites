function initializeSite() {
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
            lenis.scrollTo(targetId, {
                duration: 1.5,
                easing: (t) => t === 1 ? 1 : 1 - Math.pow(2, -10 * t),
            });
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
    
    const animationCallback = (entries, observer) => {
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
        rootMargin: "0px 0px -100px 0px"
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
}

try {
    document.addEventListener('DOMContentLoaded', initializeSite);
} catch (e) {
    console.error("サイトの初期化中にエラーが発生しました:", e);
    const loadingScreen = document.getElementById('loading');
    if(loadingScreen) loadingScreen.style.display = 'none';
}

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
    const userId = '1413106295686561846';
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

async function fetchGithubProjects(observer) {
    const username = 'y-exe';
    const projectsGrid = document.querySelector('.projects-grid');
    if (!projectsGrid || !observer) return;

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
            
            projectsGrid.querySelectorAll('[data-reveal]').forEach(el => observer.observe(el));
        }
    } catch (error) {
        console.error('GitHubプロジェクトの読み込みに失敗しました:', error);
        projectsGrid.innerHTML = '<p data-reveal="up">プロジェクトの読み込みに失敗しました。</p>';
    }
    if (projectsGrid.querySelector('[data-reveal]')) {
        observer.observe(projectsGrid.querySelector('[data-reveal]'));
    }
                                                  }
