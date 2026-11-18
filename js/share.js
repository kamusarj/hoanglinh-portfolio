import { TextRoom, MAX_TEXT_LENGTH, MAX_HISTORY, formatCode, normalizeCode } from './text-room.mjs';

const $ = (id) => document.getElementById(id);
const room = new TextRoom();
const themes = ['sky', 'grape', 'mint', 'sunset', 'cyber', 'forest'];
let sending = false;
let previousMessageIds = '';
let copyTimer;

function setupTheme() {
    const root = document.documentElement;
    if (!themes.includes(root.dataset.theme)) root.dataset.theme = themes[0];
    const label = () => { $('themeToggle').textContent = `[ ${root.dataset.theme.toUpperCase()} ]`; };
    label();
    $('themeToggle').addEventListener('click', () => {
        root.dataset.theme = themes[(themes.indexOf(root.dataset.theme) + 1) % themes.length];
        label();
        try { localStorage.setItem('pixel-theme', root.dataset.theme); } catch { /* Theme still works for this visit. */ }
    });
}

function updateComposer() {
    const ready = ['waiting', 'connected'].includes(room.status);
    $('textInput').disabled = !ready;
    $('sendText').disabled = !ready || sending || !$('textInput').value.trim();
    $('characterCount').textContent = `${$('textInput').value.length.toLocaleString('vi-VN')} / ${MAX_TEXT_LENGTH.toLocaleString('vi-VN')} ký tự`;
    $('sendText').textContent = sending ? '[ DANG GUI… ]' : '[ GUI TEXT ]';
    $('composeHelp').textContent = !ready
        ? 'Tạo hoặc vào phòng để bắt đầu. Ctrl / ⌘ + Enter để gửi.'
        : room.status === 'waiting'
            ? 'Chưa có thiết bị khác. Text sẽ hiện khi thiết bị đó vào phòng.'
            : 'Ctrl / ⌘ + Enter để gửi. Nội dung đang soạn chỉ được chia sẻ khi bạn bấm Gửi.';
}

function renderMessages() {
    const ids = room.entries.map((entry) => entry.id).join(',');
    if (ids === previousMessageIds) return;
    previousMessageIds = ids;
    $('messageList').replaceChildren();
    $('emptyMessages').hidden = room.entries.length > 0;
    $('messageCount').textContent = `${room.entries.length} đoạn${room.entries.length === MAX_HISTORY ? ' gần nhất' : ''}`;
    for (const entry of [...room.entries].reverse()) {
        const article = document.createElement('article');
        article.className = 'text-message';
        const header = document.createElement('div');
        header.className = 'message-meta';
        const sender = document.createElement('span');
        sender.textContent = entry.author === room.selfId ? 'Bạn' : 'Thiết bị khác';
        const time = document.createElement('time');
        time.dateTime = new Date(entry.timestamp).toISOString();
        time.textContent = new Date(entry.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
        sender.append(time);
        const copy = document.createElement('button');
        copy.type = 'button';
        copy.className = 'utility-button';
        copy.textContent = 'Sao chép';
        copy.addEventListener('click', () => copyText(entry.text, 'Đã sao chép văn bản.', copy));
        const text = document.createElement('pre');
        // Never interpret received text as HTML, even when it contains markup.
        text.textContent = entry.text;
        header.append(sender, copy);
        article.append(header, text);
        $('messageList').append(article);
    }
}

function render() {
    const statuses = {
        idle: 'Chưa kết nối', connecting: 'Đang kết nối…', waiting: 'Chờ thiết bị khác',
        connected: 'Đã kết nối', error: 'Chưa kết nối được',
    };
    $('connectionStatus').textContent = statuses[room.status];
    $('statusDot').dataset.state = room.status;
    $('setupPanel').hidden = Boolean(room.code);
    $('roomPanel').hidden = !room.code;
    $('roomCode').textContent = formatCode(room.code);
    $('deviceCount').textContent = room.devices ? `${room.devices} thiết bị trong phòng` : 'Đang tìm thiết bị…';
    $('deviceCount').hidden = room.status === 'error';
    $('retryRoom').hidden = room.status !== 'error';
    $('connectionError').textContent = room.error;
    $('connectionError').hidden = !room.error;
    $('copyCode').disabled = $('copyLink').disabled = !['waiting', 'connected'].includes(room.status);
    $('roomHint').textContent = room.role === 'host'
        ? 'Giữ trang này mở để duy trì phòng. Gửi mã hoặc link cho thiết bị khác để kết nối.'
        : 'Bạn đã vào phòng trên thiết bị tạo phòng. Giữ trang mở ở cả hai phía.';
    $('leaveRoom').textContent = room.role === 'host' ? 'Đóng phòng' : 'Rời phòng';
    if (room.code) history.replaceState(null, '', `#room=${room.code}`);
    renderMessages();
    updateComposer();
}

function showError(message) {
    $('connectionError').textContent = message;
    $('connectionError').hidden = false;
}

async function copyText(text, message, button) {
    try {
        await navigator.clipboard.writeText(text);
    } catch {
        // Works in browsers without Clipboard API permission, including HTTP previews.
        const helper = document.createElement('textarea');
        helper.value = text;
        helper.style.cssText = 'position:fixed;top:0;left:-9999px;font-size:16px';
        document.body.append(helper);
        helper.select();
        let copied = false;
        try { copied = document.execCommand('copy'); } catch { /* Show a useful fallback below. */ }
        helper.remove();
        button?.focus();
        if (!copied) {
            $('copyStatus').textContent = 'Trình duyệt chưa cho sao chép. Chọn văn bản và sao chép thủ công.';
            return;
        }
    }
    $('copyStatus').textContent = message;
    clearTimeout(copyTimer);
    copyTimer = setTimeout(() => { $('copyStatus').textContent = ''; }, 4000);
}

$('createRoom').addEventListener('click', () => {
    try { room.create(); } catch (error) { showError(error.message); }
});
$('joinForm').addEventListener('submit', (event) => {
    event.preventDefault();
    try { room.join($('roomInput').value); } catch (error) { showError(error.message); }
});
$('retryRoom').addEventListener('click', () => {
    try { room.retry(); } catch (error) { showError(error.message); }
});
$('leaveRoom').addEventListener('click', () => {
    room.leave();
    history.replaceState(null, '', location.pathname + location.search);
    $('sendStatus').textContent = '';
    $('copyStatus').textContent = '';
});
$('copyCode').addEventListener('click', (event) => copyText(formatCode(room.code), 'Đã sao chép mã phòng.', event.currentTarget));
$('copyLink').addEventListener('click', (event) => copyText(`${location.origin}${location.pathname}#room=${room.code}`, 'Đã sao chép link. Mở link này trên thiết bị khác rồi bấm Vào phòng.', event.currentTarget));
$('textInput').addEventListener('input', updateComposer);
$('textInput').addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && (event.ctrlKey || event.metaKey) && !event.isComposing) {
        event.preventDefault();
        if (!$('sendText').disabled) $('sendForm').requestSubmit();
    }
});
$('sendForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    if (sending || $('sendText').disabled) return;
    sending = true;
    const text = $('textInput').value;
    $('sendStatus').textContent = '';
    updateComposer();
    try {
        await room.send(text);
        // Incoming messages never replace an in-progress draft.
        if ($('textInput').value === text) $('textInput').value = '';
        $('sendStatus').textContent = room.status === 'waiting'
            ? 'Đã giữ trong phòng. Thiết bị vào sau sẽ nhận được khi trang này còn mở.'
            : 'Đã chia sẻ text vào phòng.';
    } catch (error) {
        $('sendStatus').textContent = error.message;
    } finally {
        sending = false;
        updateComposer();
    }
});

room.addEventListener('change', render);
window.addEventListener('pagehide', () => room.leave());
// Browsers can restore a page from the back-forward cache after destroying its peer.
window.addEventListener('pageshow', (event) => { if (event.persisted) render(); });

setupTheme();
const linkedCode = normalizeCode(new URLSearchParams(location.hash.slice(1)).get('room'));
if (linkedCode) {
    $('roomInput').value = formatCode(linkedCode);
    $('roomInputHelp').textContent = 'Mã đã điền từ link. Bấm Vào phòng để kết nối.';
}
render();
if (!window.isSecureContext || !window.RTCPeerConnection) {
    $('createRoom').disabled = $('joinRoom').disabled = true;
    showError('Cần mở trang qua HTTPS bằng trình duyệt hỗ trợ WebRTC. Bạn có thể dùng link Vercel của portfolio.');
}
