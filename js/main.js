// ===== PIXEL PORTFOLIO — renders js/data.js and wires up the interactions =====
(() => {
    'use strict';

    const DATA = window.PORTFOLIO;
    const SECTIONS = ['hero', 'projects', 'about', 'stats', 'contact'];
    const THEMES = [
        { key: 'sky', label: 'SKY' },
        { key: 'grape', label: 'GRAPE' },
        { key: 'mint', label: 'MINT' },
        { key: 'sunset', label: 'SUNSET' },
        { key: 'cyber', label: 'CYBER' },
        { key: 'forest', label: 'FOREST' },
    ];
    const THEME_KEY = 'pixel-theme';
    const ACTIVITY_KEY = 'gh-activity-v1';
    const ACTIVITY_TTL = 15 * 60 * 1000;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // ---------- helpers ----------

    // Tiny DOM builder: h('a', { href: '#x', class: 'btn' }, 'label', childNode, [moreChildren]).
    // Strings become text nodes, so API data never reaches innerHTML.
    function h(tag, props = {}, ...children) {
        const element = document.createElement(tag);
        for (const [key, value] of Object.entries(props)) {
            if (value === null || value === undefined || value === false) continue;
            if (key === 'class') element.className = value;
            else element.setAttribute(key, value === true ? '' : value);
        }
        const nodes = children.flat(Infinity).filter((child) => child !== null && child !== undefined && child !== false && child !== '');
        element.append(...nodes);
        return element;
    }

    function externalLink(url, label, className) {
        return h('a', { href: url, class: className, target: '_blank', rel: 'noopener noreferrer' }, label);
    }

    function readJSON(key) {
        try {
            return JSON.parse(localStorage.getItem(key));
        } catch (error) {
            return null;
        }
    }

    function writeJSON(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            // Storage can be full or blocked (private mode); caching is only an optimisation.
        }
    }

    const formatMonth = (value) => new Intl.DateTimeFormat('en', { month: 'short', year: 'numeric' }).format(new Date(value));
    const formatDay = (value) => new Intl.DateTimeFormat('en', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(value));
    const formatNumber = (value) => Number(value).toLocaleString('en-US');

    // ---------- hero ----------

    function renderHero() {
        const { profile, heroStats } = DATA;
        const thirdButton = profile.cv
            ? h('a', { href: profile.cv, class: 'btn btn-primary', download: true }, '[ DOWNLOAD CV ]')
            : externalLink(`https://github.com/${DATA.github.user}`, '[ GITHUB ]', 'btn btn-primary');

        document.getElementById('heroContent').append(
            h('div', { class: 'avatar-frame' },
                h('img', {
                    src: profile.avatar,
                    alt: profile.avatarAlt,
                    width: 160,
                    height: 160,
                    class: profile.avatarPixelated ? 'pixelated' : null,
                })),
            h('div', { class: 'hero-text' },
                h('h1', { class: 'hero-title' }, profile.heroTitle),
                h('p', { class: 'hero-tagline' }, profile.tagline),
                h('p', { class: 'hero-intro' }, profile.intro),
                h('div', { class: 'cta' },
                    h('a', { href: '#projects', class: 'btn btn-primary' }, '[ VIEW WORK ]'),
                    h('a', { href: '#contact', class: 'btn btn-secondary' }, '[ GET IN TOUCH ]'),
                    thirdButton)),
        );

        document.getElementById('heroStats').append(...heroStats.map((stat) => h('div', { class: 'stat-item' },
            h('div', {
                class: 'stat-number',
                'data-target': stat.value,
                'data-suffix': stat.suffix || '',
                'data-live': stat.live,
            }, '0'),
            h('p', { class: 'stat-label' }, stat.label))));
    }

    function animateCounters() {
        const counters = [...document.querySelectorAll('.stat-number[data-target]')];
        const show = (element, value) => {
            element.textContent = `${formatNumber(value)}${element.dataset.suffix}`;
        };
        let finished = false;
        const finish = () => {
            if (finished) return;
            finished = true;
            counters.forEach((element) => {
                show(element, element.dataset.target);
                element.dataset.done = 'true';
            });
        };
        if (reduceMotion) {
            finish();
            return;
        }
        const start = performance.now();
        const duration = 1400;
        const tick = (now) => {
            if (finished) return;
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - (1 - progress) ** 3;
            counters.forEach((element) => show(element, Math.round(element.dataset.target * eased)));
            if (progress < 1) requestAnimationFrame(tick);
            else finish();
        };
        requestAnimationFrame(tick);
        // rAF is paused in background tabs; make sure the real numbers still land.
        setTimeout(finish, duration + 200);
    }

    // ---------- projects ----------

    function renderProjects() {
        document.getElementById('projectsGrid').append(...DATA.projects.map((project) => h('article', { class: 'project-card' },
            h('div', { class: 'project-thumb' },
                h('img', {
                    src: project.image,
                    alt: project.imageAlt,
                    width: 160,
                    height: 90,
                    loading: 'lazy',
                    decoding: 'async',
                    class: 'pixelated',
                })),
            h('p', { class: 'project-kind' }, project.kind),
            h('h3', {}, project.title),
            h('p', { class: 'project-desc' }, project.description),
            project.metric && h('p', { class: 'project-metric' }, project.metric),
            h('div', { class: 'tags' }, project.tags.map((tag) => h('span', { class: 'tag' }, tag))),
            h('div', { class: 'project-links' }, project.links.map((link) => externalLink(link.url, link.label, 'link-btn'))),
        )));

        const more = DATA.moreRepos;
        if (!more || !more.items.length) return;
        document.getElementById('moreRepos').append(
            h('div', { class: 'more-heading' },
                h('h3', {}, more.title),
                externalLink(more.allUrl, 'All repositories', 'link-btn')),
            h('div', { class: 'more-grid' }, more.items.map((repo) => h('a', {
                class: 'repo-row',
                href: repo.url,
                target: '_blank',
                rel: 'noopener noreferrer',
            },
            h('span', { class: 'repo-row-head' },
                h('strong', {}, repo.name),
                h('span', { class: 'repo-lang' }, repo.lang)),
            h('p', {}, repo.description)))),
        );
    }

    // ---------- about ----------

    function skillBar(level) {
        const filled = Math.round(level / 10);
        return h('div', { class: 'skill-bar', role: 'img', 'aria-label': `${level} out of 100` },
            Array.from({ length: 10 }, (_, index) => h('i', { class: index < filled ? 'on' : null })));
    }

    function renderAbout() {
        const { about } = DATA;
        document.getElementById('aboutGrid').append(
            h('div', { class: 'panel bio' },
                h('h3', {}, 'Who Am I?'),
                about.bio.map((paragraph) => h('p', {}, paragraph)),
                h('h4', {}, 'What I Do:'),
                h('ul', { class: 'focus-list' }, about.focus.map((item) => h('li', {}, item)))),
            h('div', { class: 'panel' },
                h('h3', {}, 'Tech Stack'),
                about.skills.map((skill) => h('div', { class: 'skill' },
                    h('div', { class: 'skill-head' },
                        h('span', {}, skill.label),
                        h('span', { 'aria-hidden': 'true' }, `${skill.level}%`)),
                    skillBar(skill.level)))),
            h('div', { class: 'panel' },
                h('h3', {}, 'Journey'),
                h('ol', { class: 'timeline' }, about.journey.map((step) => h('li', {},
                    h('span', { class: 'year' }, step.year),
                    h('h4', {}, step.title),
                    step.detail && h('p', {}, step.detail))))),
            h('div', { class: 'panel' },
                h('h3', {}, 'Highlights'),
                h('ul', { class: 'highlights' }, about.highlights.map((item) => h('li', {}, item)))),
        );
    }

    // ---------- stats & live GitHub activity ----------

    function renderNumbers() {
        document.getElementById('numbersGrid').append(...DATA.numbers.map((item) => h('div', { class: 'number-card' },
            h('strong', {}, item.value),
            h('p', {}, item.label))));
    }

    function commitRow(commit) {
        const { user } = DATA.github;
        const repoName = commit.repo.startsWith(`${user}/`) ? commit.repo.slice(user.length + 1) : commit.repo;
        return h('tr', {},
            h('td', {}, externalLink(`https://github.com/${commit.repo}`, repoName)),
            h('td', {}, externalLink(`https://github.com/${commit.repo}/commit/${commit.sha}`, commit.sha.slice(0, 7), 'sha')),
            h('td', {}, commit.message),
            h('td', {}, formatDay(commit.date)));
    }

    function renderActivity(data, status) {
        const metrics = [
            [formatNumber(data.publicRepos), 'Public repos'],
            [formatNumber(data.commitsTotal), 'Public commits'],
            [formatNumber(data.contributions), `${data.contributionsYear} contributions`],
            [formatNumber(data.hfModels), 'HF models'],
            [data.lastPush ? formatMonth(data.lastPush) : '—', 'Last commit'],
        ];
        document.getElementById('githubSummary').replaceChildren(...metrics.map(([value, label]) => h('div', { class: 'metric' },
            h('span', {}, value),
            h('small', {}, label))));

        const rows = data.commits.length
            ? data.commits.map(commitRow)
            : [h('tr', {}, h('td', { class: 'commit-empty', colspan: 4 }, 'No recent public commits are available.'))];
        document.getElementById('commitTableBody').replaceChildren(...rows);
        document.getElementById('githubStatus').textContent = status;

        document.querySelectorAll('.stat-number[data-live]').forEach((element) => {
            const value = data[element.dataset.live];
            if (!Number.isFinite(value)) return;
            element.dataset.target = value;
            if (element.dataset.done) element.textContent = `${formatNumber(value)}${element.dataset.suffix}`;
        });
    }

    async function fetchJSON(url, headers) {
        const response = await fetch(url, { headers });
        if (!response.ok) throw new Error(`${response.status} from ${url}`);
        return response.json();
    }

    // Each source can fail on its own (rate limits, CORS hiccups); keep whatever succeeded.
    async function fetchLiveActivity() {
        const { user, huggingface } = DATA.github;
        const github = { Accept: 'application/vnd.github+json' };
        const year = new Date().getFullYear();
        const [profile, search, calendar, models] = await Promise.allSettled([
            fetchJSON(`https://api.github.com/users/${user}`, github),
            fetchJSON(`https://api.github.com/search/commits?q=author:${user}&sort=author-date&order=desc&per_page=6`, github),
            fetchJSON(`https://github-contributions-api.jogruber.de/v4/${user}?y=${year}`),
            huggingface
                ? fetchJSON(`https://huggingface.co/api/models?author=${huggingface}&limit=100`)
                : Promise.reject(new Error('No Hugging Face account configured')),
        ]);

        const live = {};
        if (profile.status === 'fulfilled') {
            live.publicRepos = profile.value.public_repos;
        }
        if (search.status === 'fulfilled') {
            const items = search.value.items || [];
            live.commitsTotal = search.value.total_count;
            live.commits = items.map((item) => ({
                repo: item.repository.full_name,
                sha: item.sha,
                message: item.commit.message.split('\n')[0],
                date: item.commit.author.date,
            }));
            if (items.length) live.lastPush = items[0].commit.author.date;
        }
        const total = calendar.status === 'fulfilled' ? calendar.value.total?.[year] : undefined;
        if (Number.isInteger(total)) {
            live.contributions = total;
            live.contributionsYear = year;
        }
        if (models.status === 'fulfilled' && Array.isArray(models.value)) {
            live.hfModels = models.value.length;
        }
        if (!Object.keys(live).length) throw new Error('Every activity request failed');
        return { live, complete: [profile, search, calendar, models].every((result) => result.status === 'fulfilled') };
    }

    async function loadActivity() {
        const { user, snapshot } = DATA.github;
        document.getElementById('githubTitle').textContent = `@${user} Activity`;
        document.getElementById('githubProfileLink').href = `https://github.com/${user}`;

        const cached = readJSON(ACTIVITY_KEY);
        if (cached && cached.user === user && Date.now() - cached.savedAt < ACTIVITY_TTL) {
            renderActivity({ ...snapshot, ...cached.live }, 'Live public activity · cached for 15 min');
            return;
        }

        renderActivity(snapshot, 'Loading live activity...');
        try {
            const { live, complete } = await fetchLiveActivity();
            writeJSON(ACTIVITY_KEY, { user, savedAt: Date.now(), live });
            renderActivity(
                { ...snapshot, ...live },
                complete ? 'Live public activity · refreshed automatically' : 'Partly live · some APIs are rate-limited',
            );
        } catch (error) {
            console.warn('Could not load live GitHub activity.', error);
            renderActivity(snapshot, `GitHub API unavailable · snapshot from ${snapshot.savedAt}`);
        }
    }

    // ---------- contact ----------

    function formGroup(id, label, control) {
        return h('div', { class: 'form-group' }, h('label', { for: id }, `${label}:`), control);
    }

    function renderContact() {
        const { profile, contact } = DATA;
        const info = h('div', { class: 'panel' },
            h('h3', {}, "Let's Connect"),
            h('p', { class: 'contact-blurb' }, contact.blurb),
            h('div', { class: 'info-row' },
                h('strong', {}, 'Email:'),
                h('a', { href: `mailto:${profile.email}` }, profile.email)),
            h('div', { class: 'info-row' }, h('strong', {}, 'Location:'), profile.location),
            h('div', { class: 'info-row' }, h('strong', {}, 'Status:'), h('span', { class: 'status' }, profile.status)),
            h('div', { class: 'socials' },
                h('h4', {}, 'Social Links'),
                h('div', { class: 'social-buttons' }, profile.socials.map((social) => externalLink(social.url, `[ ${social.label} ]`)))));

        const form = h('form', { class: 'panel contact-form' },
            formGroup('contactName', 'Name', h('input', {
                id: 'contactName', name: 'name', type: 'text', required: true, autocomplete: 'name', placeholder: 'Your name',
            })),
            formGroup('contactSubject', 'Subject', h('input', {
                id: 'contactSubject', name: 'subject', type: 'text', required: true, placeholder: 'Project topic',
            })),
            formGroup('contactMessage', 'Message', h('textarea', {
                id: 'contactMessage', name: 'message', rows: 8, required: true, placeholder: 'Tell me about your project...',
            })),
            h('button', { type: 'submit', class: 'btn btn-primary' }, '[ SEND MESSAGE ]'),
            h('p', { class: 'form-note' }, 'Opens your email app with the message filled in.'));

        form.addEventListener('submit', (event) => {
            event.preventDefault();
            const fields = new FormData(form);
            const subject = fields.get('subject').trim();
            const body = `From: ${fields.get('name').trim()}\n\n${fields.get('message').trim()}`;
            window.location.href = `mailto:${profile.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
            form.reset();
        });

        document.getElementById('contactGrid').append(info, form);
    }

    // ---------- navigation, theme, decorations ----------

    function setupNav() {
        const links = new Map([...document.querySelectorAll('.nav-link[href^="#"]')].map((link) => [link.hash.slice(1), link]));
        const setActive = (id) => links.forEach((link, key) => {
            link.classList.toggle('is-active', key === id);
            if (key === id) link.setAttribute('aria-current', 'location');
            else link.removeAttribute('aria-current');
        });

        const observer = new IntersectionObserver((entries) => {
            entries.filter((entry) => entry.isIntersecting).forEach((entry) => setActive(entry.target.id));
        }, { rootMargin: '-40% 0px -55% 0px' });
        SECTIONS.forEach((id) => observer.observe(document.getElementById(id)));

        // Keys 1–5 jump between sections, except while typing in the contact form.
        document.addEventListener('keydown', (event) => {
            if (event.ctrlKey || event.metaKey || event.altKey) return;
            if (event.target instanceof Element && event.target.closest('input, textarea, select, [contenteditable]')) return;
            const id = SECTIONS[Number(event.key) - 1];
            if (!id) return;
            document.getElementById(id).scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
            history.replaceState(null, '', `#${id}`);
        });
    }

    function setupTheme() {
        const button = document.getElementById('themeToggle');
        const root = document.documentElement;
        const apply = (key, persist) => {
            const theme = THEMES.find((item) => item.key === key) || THEMES[0];
            root.dataset.theme = theme.key;
            button.textContent = `[ THEME: ${theme.label} ]`;
            if (!persist) return;
            try {
                localStorage.setItem(THEME_KEY, theme.key);
            } catch (error) {
                // Theme still changes for this visit.
            }
        };
        apply(root.dataset.theme, false);
        button.addEventListener('click', () => {
            const index = THEMES.findIndex((item) => item.key === root.dataset.theme);
            apply(THEMES[(index + 1) % THEMES.length].key, true);
        });
    }

    function scatterStars() {
        const spots = [[9, 4], [18, 93], [27, 15], [36, 82], [48, 3], [58, 96], [66, 22], [74, 88], [86, 8], [92, 70]];
        document.getElementById('stars').append(...spots.map(([top, left], index) => h('span', {
            class: 'star',
            style: `top:${top}%;left:${left}%;animation-delay:${(index * 0.37).toFixed(2)}s`,
        })));
    }

    // ---------- boot ----------

    renderHero();
    renderProjects();
    renderAbout();
    renderNumbers();
    renderContact();
    setupTheme();
    setupNav();
    scatterStars();
    animateCounters();
    loadActivity();
    document.getElementById('currentYear').textContent = new Date().getFullYear();
    document.getElementById('footerName').textContent = DATA.profile.name;

    console.log('%c▶ PIXEL PORTFOLIO ◀  press 1–5 to jump between sections', 'font-family: monospace; font-weight: bold;');
})();
