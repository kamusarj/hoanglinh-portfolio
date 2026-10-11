// ===== NỘI DUNG PORTFOLIO =====
// Toàn bộ chữ, số liệu và danh sách project nằm ở file này; js/main.js chỉ việc render.
// Muốn đổi repo nổi bật: sửa mảng `projects` (ảnh thumbnail nằm ở assets/images/projects/).
// Các dòng có "TODO" là thông tin mình suy ra từ GitHub — hãy kiểm tra lại trước khi public.

window.PORTFOLIO = {
    profile: {
        name: 'Bùi Hoàng Linh',
        // Font tiêu đề (Press Start 2P) không có dấu tiếng Việt nên tên lớn viết không dấu.
        heroTitle: 'HOANG LINH',
        tagline: 'AI Engineer | Agentic AI & Security | Robot Learning',
        intro: 'I build AI systems that run for real: LLM agents and RAG pipelines, anomaly detection for security teams, and Vision-Language-Action policies for robot arms — with Python, FastAPI and TypeScript.',
        // TODO: thay bằng ảnh thật (vd. assets/images/me.jpg) và đặt avatarPixelated: false.
        avatar: 'assets/images/avatar.png',
        avatarAlt: 'Pixel-art robot avatar of Bùi Hoàng Linh',
        avatarPixelated: true,
        location: 'Vietnam', // TODO: thêm thành phố nếu muốn (vd. Hanoi, Vietnam)
        email: '01232106558linh@gmail.com',
        status: 'Building AI products & researching VLA', // TODO
        cv: 'BuiHoangLinh_CV.pdf',
        socials: [
            { label: 'GITHUB', url: 'https://github.com/kamusarj' },
            { label: 'HUGGING FACE', url: 'https://huggingface.co/kamusarj' },
            { label: 'FACEBOOK', url: 'https://www.facebook.com/blinh242004' },
            { label: 'YOUTUBE', url: 'https://www.youtube.com/@hoangbuilinh' },
        ],
    },

    // `live` = cập nhật theo dữ liệu GitHub/Hugging Face lấy được lúc tải trang.
    heroStats: [
        { value: 54, label: 'Repositories', live: 'publicRepos' },
        { value: 4, label: 'AI Products' },
        { value: 5, label: 'VLA Models Evaluated' },
        { value: 20, suffix: '+', label: 'AI20K Labs' },
    ],

    projects: [
        {
            title: 'Deka',
            kind: 'AI PRODUCT',
            image: 'assets/images/projects/deka.png',
            imageAlt: 'Pixel art of a robot assistant next to a generated exam on a clipboard',
            description: 'Helps Vietnamese teachers build complete Natural Science exam packs — matrix, specification, questions, answer key and rubric — from controlled curriculum data instead of letting the LLM improvise.',
            metric: 'RAG: BM25 + vector · RRF · rerank · DOCX export',
            tags: ['FastAPI', 'React + TS', 'RAG', 'ChromaDB'],
            links: [{ label: 'GitHub', url: 'https://github.com/kamusarj/Deka' }],
        },
        {
            title: 'Vespionage UEBA',
            kind: 'AI SECURITY · TEAM PROJECT',
            image: 'assets/images/projects/ueba.png',
            imageAlt: 'Pixel art of a security dashboard flagging a risk spike from endpoint laptops',
            description: 'Detects insider threats and account compromise from endpoint logs: OCSVM anomaly scoring on CERT r4.2, an endpoint agent with 7 collectors, and an LLM analyst chat that explains every alert.',
            metric: 'Top contributor · 104 commits',
            tags: ['OCSVM', 'LLM Agent', 'FastAPI', 'React'],
            links: [{ label: 'GitHub', url: 'https://github.com/kamusarj/Vespionage_deploy' }],
        },
        {
            title: 'VLA Robot Learning',
            kind: 'RESEARCH',
            image: 'assets/images/projects/vla.png',
            imageAlt: 'Pixel art of a robot arm picking up a cup next to an open-loop evaluation chart',
            description: 'Fine-tuning and open-loop evaluation of Vision-Language-Action policies — Octo, GR00T N1.7, TurboVLA, VLA-JEPA, SmolVLA — on UR10e and ALOHA, plus GR00T → GGUF inference in vla.cpp.',
            metric: 'SnapFlow: 1-step SmolVLA, 2.82× faster inference',
            tags: ['PyTorch', 'LeRobot', 'GGUF / C++', 'Robotics'],
            links: [
                { label: 'octo-pytorch', url: 'https://github.com/kamusarj/octo-pytorch' },
                { label: 'vla.cpp', url: 'https://github.com/kamusarj/vla.cpp' },
                { label: 'SnapFlow', url: 'https://github.com/kamusarj/lerobot' },
                { label: 'Hugging Face', url: 'https://huggingface.co/kamusarj' },
            ],
        },
        {
            title: 'GAN Satellite Segmentation',
            kind: 'COMPUTER VISION',
            image: 'assets/images/projects/gan-seg.png',
            imageAlt: 'Pixel art of a satellite above farmland, split into the photo and its land-cover mask',
            description: 'Land-cover segmentation on LoveDA with a DeepLabV3+ (ResNet50) generator and a PatchGAN discriminator, served by a full-stack app with JWT auth, history and admin model switching.',
            metric: '7 classes · mIoU 0.53 · pixel accuracy 70.7%',
            tags: ['PyTorch', 'GAN', 'FastAPI', 'Docker'],
            links: [{ label: 'GitHub', url: 'https://github.com/kamusarj/GAN-segmentation' }],
        },
        {
            title: 'Research System',
            kind: 'KNOWLEDGE BASE',
            image: 'assets/images/projects/research-system.png',
            imageAlt: 'Pixel art of repo, RSS and paper sources feeding a knowledge graph and database',
            description: 'Local-first research knowledge base for AI agents: URL intake with source adapters, approved-only search, a Cytoscape knowledge graph, AI provenance and governed JSONL dataset export.',
            metric: '4 source adapters · graph mode · dataset export',
            tags: ['FastAPI', 'Next.js', 'PostgreSQL', 'Cytoscape'],
            links: [{ label: 'GitHub', url: 'https://github.com/kamusarj/research-system' }],
        },
        {
            title: 'SSH Sentinel',
            kind: 'DEV TOOL',
            image: 'assets/images/projects/ssh-sentinel.png',
            imageAlt: 'Pixel art of a laptop opening an SSH tunnel to a workstation that shows an SSH indicator',
            description: 'GNOME toolkit for juggling SSH hosts: a top-bar manager with host status, terminal / VS Code launch and port tunnels, plus a Sentinel indicator that shows who is connected to your workstation.',
            metric: 'Event-driven via systemd-logind D-Bus, no polling',
            tags: ['GNOME Shell', 'GTK 4', 'Python', 'D-Bus'],
            links: [{ label: 'GitHub', url: 'https://github.com/kamusarj/ssh-sentinal' }],
        },
    ],

    moreRepos: {
        title: 'More on GitHub',
        allUrl: 'https://github.com/kamusarj?tab=repositories',
        items: [
            {
                name: 'stylewarp',
                lang: 'Python',
                description: 'CycleGAN style transfer between landscape photos and Van Gogh paintings, with a Streamlit demo.',
                url: 'https://github.com/kamusarj/stylewarp',
            },
            {
                name: 'DACN',
                lang: 'Python',
                description: 'Age & gender recognition: a CNN trained on UTKFace plus an OpenCV DNN face detector.',
                url: 'https://github.com/kamusarj/DACN',
            },
            {
                name: 'AI20K labs',
                lang: 'Python',
                description: '20+ labs: RAG, GraphRAG on Neo4j, MCP tools, multi-agent A2A, DPO, guardrails, eval, deployment.',
                url: 'https://github.com/kamusarj?tab=repositories&q=Day&type=fork',
            },
        ],
    },

    about: {
        bio: [
            "I'm Bùi Hoàng Linh, an AI engineer from Vietnam and an AI20K (cohort 2) trainee on the AI Engineer track. I like turning AI demos into systems that actually run — with APIs, tests, monitoring and honest evaluation.",
            'Right now I split my time between agentic AI for security (UEBA, log intelligence) and Vision-Language-Action models for robot manipulation.',
        ],
        focus: [
            'Build LLM agents, tool calling and RAG pipelines',
            'Detect anomalies and explain alerts for security teams',
            'Fine-tune and evaluate VLA policies for robot arms',
            'Ship FastAPI backends with React / Next.js frontends',
            'Train vision models: GANs, segmentation, CNNs',
        ],
        // TODO: tự đánh giá lại các mức (0–100).
        skills: [
            { label: 'Python / PyTorch', level: 90 },
            { label: 'LLM Agents / RAG / MCP', level: 85 },
            { label: 'FastAPI / PostgreSQL / Docker', level: 85 },
            { label: 'Computer Vision / GAN', level: 80 },
            { label: 'VLA / LeRobot / Robotics', level: 75 },
            { label: 'React / TypeScript', level: 70 },
        ],
        journey: [
            { year: '2026', title: 'VLA robot-learning research', detail: 'Octo · GR00T N1.7 · TurboVLA · VLA-JEPA · SmolVLA' },
            { year: '2026', title: 'AI20K trainee — AI Engineer track', detail: 'RAG, agents, MCP, eval, guardrails, deployment' },
            { year: '2025–26', title: 'Computer vision projects', detail: 'CNN age/gender, CycleGAN, GAN segmentation' },
            // TODO: thêm mốc học vấn (trường, năm bắt đầu) nếu muốn.
        ],
        highlights: [
            '4 VLA checkpoints published on Hugging Face',
            'Top contributor of the Vespionage UEBA team (104 commits)',
            'Bit-exact PyTorch reference trace for TurboVLA (2,968 tensors)',
            '20+ AI20K labs: RAG, MCP, multi-agent, DPO, guardrails',
        ],
    },

    numbers: [
        { value: '2.82×', label: 'Faster VLA inference with SnapFlow' },
        { value: '99.3%', label: 'Gripper accuracy, open-loop eval' },
        { value: '2,968', label: 'Tensors traced bit-exact' },
        { value: '70.7%', label: 'Pixel accuracy on LoveDA' },
    ],

    github: {
        user: 'kamusarj',
        huggingface: 'kamusarj',
        // Dữ liệu dự phòng (lấy ngày 2026-10-02), hiển thị khi API GitHub bị giới hạn/không truy cập được.
        snapshot: {
            savedAt: '2026-10-02',
            publicRepos: 54,
            commitsTotal: 233,
            contributions: 479,
            contributionsYear: 2026,
            hfModels: 4,
            lastPush: '2026-09-20T15:06:42+07:00',
            commits: [
                { repo: 'kamusarj/Deka', sha: 'b53ecd32b03f08d13c296b9e05846b82ffef47b7', message: 'feat: rebrand public product and release tooling as Deka', date: '2026-09-20T15:06:42+07:00' },
                { repo: 'kamusarj/ssh-sentinal', sha: '553fa876ce7d085fd3d06564cfd6edb778795d5f', message: 'Fix SSH Sentinel timers on GNOME 46', date: '2026-08-10T23:06:12+07:00' },
                { repo: 'kamusarj/ssh-sentinal', sha: '8208053d65e7c4e6c879c08c1e13cec77f729f37', message: 'Use neutral extension IDs and documentation placeholders', date: '2026-08-10T10:57:37+07:00' },
                { repo: 'kamusarj/ssh-sentinal', sha: '4685cc5f2b780e3c161d827a0061b7a2b637fc17', message: 'Add English and Vietnamese setup guides', date: '2026-08-10T10:43:04+07:00' },
                { repo: 'kamusarj/ssh-sentinal', sha: '618b3485f320c702f41e42a4c74a34c25d2f7cb6', message: 'Rename incoming indicator to SSH Sentinel', date: '2026-08-10T10:28:09+07:00' },
                { repo: 'kamusarj/ssh-sentinal', sha: '494753998b6bad5038889fbc9f5813b6fa33e43a', message: 'Add incoming SSH status indicator', date: '2026-08-10T10:15:40+07:00' },
            ],
        },
    },

    contact: {
        blurb: 'Want to build something with AI agents, RAG or robot learning — or just talk tech? My inbox is open.',
    },
};
