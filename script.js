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
/FJ77rJLKbWt9dMSApsMFiEE1MPgQZDFHkB6/GUUe8/PDHLXZZMAAKQ9AP9A
XQXIOtNybkLCm/6/ezbr1w2KyXXzmvkwo1Fbqy0xTAD7BN8nz8vDwVOXa+E8
l3vt8HcNWaH+4Ob5YpDq7BzHIAI=
=tWhX
-----END PGP PUBLIC KEY BLOCK-----`;

function showToast(message) {
    const toast = document.getElementById('toast-notification');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => { toast.classList.remove('show'); }, 3000);
}

async function fetchDiscordStatus() {
    const userId = '1102557945889300480';
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

async function fetchGithubProjects() {
    const username = 'y-exe';
    const projectsGrid = document.querySelector('.projects-grid');
    const apiUrl = `https://api.github.com/users/${username}/repos?sort=updated&per_page=9`;
    const languageColors = {'JavaScript':'#f1e05a','TypeScript':'#3178c6','HTML':'#e34c26','CSS':'#563d7c','Python':'#3572A5','Java':'#b07219','C++':'#f34b7d','C#':'#178600','PHP':'#4F5D95','Go':'#00ADD8','Rust':'#dea584','Ruby':'#701516','Shell':'#89e051'};

    if (!projectsGrid) return;
    
    try {
        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error(`GitHub API error: ${response.status}`);
        const repos = await response.json();
        const originalRepos = repos.filter(repo => !repo.fork);
        if (originalRepos.length === 0) {
            projectsGrid.innerHTML = '<p>公開されているプロジェクトはありません。</p>';
        } else {
            projectsGrid.innerHTML = originalRepos.map(repo => {
                const langColor = languageColors[repo.language] || '#ccc';
                return `<a href="${repo.html_url}" target="_blank" class="project-card fade-in-element"><h3>${repo.name}</h3><p>${repo.description || '説明がありません。'}</p><div class="project-meta"><span>${repo.language ? `<span class="language-color" style="background-color: ${langColor};"></span> ${repo.language}` : ''}</span><span><i class="fa-regular fa-star"></i> ${repo.stargazers_count}</span></div></a>`;
            }).join('');
        }
    } catch (error) {
        console.error('GitHubプロジェクトの読み込みに失敗しました:', error);
        projectsGrid.innerHTML = '<p>プロジェクトの読み込みに失敗しました。</p>';
    } finally {
        const projectCards = document.querySelectorAll('.project-card');
        const viewportWidth = window.innerWidth;
        
        if (viewportWidth > 768) {
            const gridComputedStyle = window.getComputedStyle(projectsGrid);
            const gridColumnCount = gridComputedStyle.getPropertyValue('grid-template-columns').split(' ').length;

            projectCards.forEach((card, index) => {
                const columnIndex = index % gridColumnCount;
                if (gridColumnCount > 1 && columnIndex === 0) {
                    card.classList.add('fade-from-left');
                } else if (gridColumnCount > 1 && columnIndex === gridColumnCount - 1) {
                    card.classList.add('fade-from-right');
                } else {
                    card.classList.add('fade-from-bottom');
                }
            });
        } else {
            projectCards.forEach(card => card.classList.add('fade-from-bottom'));
        }
        
        projectCards.forEach(card => fadeInObserver.observe(card));
    }
}

const fadeInObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry, index) => {
        if (entry.isIntersecting) {
            const delay = entry.target.closest('.about-card') && entry.target.classList.contains('tech-category') ? index * 150 : 0;
            setTimeout(() => {
                entry.target.classList.add('is-visible');
            }, delay);
            observer.unobserve(entry.target);
        }
    });
}, {
    rootMargin: '0px 0px -50px 0px',
    threshold: 0
});

document.addEventListener('DOMContentLoaded', function() {
    const loadingScreen = document.getElementById('loading');
    const pgpLink = document.getElementById('pgp-link');
    const pgpModal = document.getElementById('pgp-modal');
    const emailLink = document.getElementById('email-link');
    const headerItems = document.querySelectorAll('.header-fixed-item');
    const topNav = document.getElementById('top-nav');
    const backToTopBtn = document.getElementById('back-to-top');
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    const darkModeIcon = darkModeToggle.querySelector('i');

    document.getElementById('pgp-key-text').textContent = pgpKeyText;

    document.querySelectorAll('.fade-in-init').forEach(el => {
        el.classList.add('fade-from-bottom');
    });

    let progress = 0;
    const interval = setInterval(() => {
        progress = Math.min(100, progress + (progress < 60 ? 2 : 1));
        const loadingPercentageEl = document.getElementById('loading-percentage');
        if(loadingPercentageEl) {
            loadingPercentageEl.textContent = `${progress}%`;
        }
        if (progress >= 100) {
            clearInterval(interval);
            loadingScreen.classList.add('fade-out');
            setTimeout(() => {
                window.scrollTo(0, 0);

                loadingScreen.style.display = 'none';
                headerItems.forEach(el => el.classList.add('visible'));

                const initialFadeInElements = document.querySelectorAll('.fade-in-init');
                initialFadeInElements.forEach((el, index) => {
                    setTimeout(() => {
                        el.classList.add('is-visible');
                    }, 200 * index);
                });

                fetchDiscordStatus();
                fetchGithubProjects();
                updateCurrentTime();
                setInterval(updateCurrentTime, 1000);
            }, 1000);
        }
    }, 8);

    function updateCurrentTime() {
        const now = new Date();
        const jstTime = now.toLocaleTimeString('en-US', { timeZone: 'Asia/Tokyo', hour: '2-digit', minute: '2-digit', hour12: true });
        const timeString = now.toLocaleTimeString('ja-JP', { hour12: false });
        
        const currentTimeEl = document.getElementById('current-time');
        if (currentTimeEl) currentTimeEl.textContent = timeString;

        const aboutTimeEl = document.getElementById('about-time');
        if(aboutTimeEl) aboutTimeEl.innerHTML = `<i class="fa-solid fa-clock"></i> JST - ${jstTime}`;
    }

    const scrollFadeInElements = document.querySelectorAll('.fade-in-element');
    scrollFadeInElements.forEach(el => {
        if(!el.classList.contains('is-visible')) {
            fadeInObserver.observe(el);
        }
    });

    if(pgpLink) pgpLink.addEventListener('click', e => { e.preventDefault(); pgpModal.classList.add('visible'); });
    if(pgpModal) pgpModal.addEventListener('click', e => { if (e.target === pgpModal || e.target.classList.contains('modal-close-btn')) pgpModal.classList.remove('visible'); });
    const pgpCopyBtn = document.getElementById('pgp-copy-btn');
    if(pgpCopyBtn) pgpCopyBtn.addEventListener('click', () => { navigator.clipboard.writeText(pgpKeyText).then(() => showToast('PGPキーをコピーしました')); });
    
    const pgpDownloadLink = document.getElementById('pgp-download-link');
    if(pgpDownloadLink) {
        const blob = new Blob([pgpKeyText], { type: 'text/plain' });
        pgpDownloadLink.href = URL.createObjectURL(blob);
        pgpDownloadLink.download = 'y.exe_pgp_key.asc';
    }
    
    if(emailLink) emailLink.addEventListener('click', e => { e.preventDefault(); navigator.clipboard.writeText('y.exe.1201@proton.me').then(() => showToast('メールアドレスをコピーしました')); });
    
    darkModeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        if (document.body.classList.contains('dark-mode')) {
            localStorage.setItem('theme', 'dark');
            darkModeIcon.classList.replace('fa-moon', 'fa-sun');
        } else {
            localStorage.setItem('theme', 'light');
            darkModeIcon.classList.replace('fa-sun', 'fa-moon');
        }
    });

    window.addEventListener('scroll', () => {
        const scrollThreshold = 10;
        const isScrolledDown = window.scrollY > scrollThreshold;
        headerItems.forEach(item => item.classList.toggle('hidden', isScrolledDown));
        if(topNav) topNav.classList.toggle('visible', isScrolledDown);
        if(backToTopBtn) backToTopBtn.classList.toggle('visible', isScrolledDown);
    });
});
