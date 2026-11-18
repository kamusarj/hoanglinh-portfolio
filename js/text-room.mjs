export const MAX_TEXT_LENGTH = 20_000;
export const MAX_HISTORY = 20;
export const MAX_DEVICES = 6;
const MAX_CODE_ATTEMPTS = 5;
const PREFIX = 'hoanglinh-text-v1-';
const PROTOCOL = 'hoanglinh-text-v1';

export function normalizeCode(value) {
    if (typeof value !== 'string') return '';
    const code = value.trim();
    return /^\d{6}$/.test(code) ? code : '';
}

export function formatCode(value) {
    return normalizeCode(value);
}

export function generateCode() {
    const value = new Uint32Array(1);
    // Reject the incomplete final range so every six-digit code is equally likely.
    do { crypto.getRandomValues(value); } while (value[0] >= 4_294_000_000);
    return String(value[0] % 1_000_000).padStart(6, '0');
}

export function validEntry(entry) {
    return entry !== null && typeof entry === 'object'
        && typeof entry.id === 'string' && /^[a-f\d]{8}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{12}$/i.test(entry.id)
        && typeof entry.author === 'string' && /^[\w-]{1,120}$/.test(entry.author)
        && typeof entry.text === 'string' && entry.text.trim().length > 0
        && entry.text.length <= MAX_TEXT_LENGTH
        && Number.isSafeInteger(entry.timestamp) && entry.timestamp > 0 && entry.timestamp <= 8_640_000_000_000_000;
}

// All remote input crosses this boundary before reaching the room or the DOM.
export function parsePacket(data) {
    if (!data || typeof data !== 'object' || data.v !== 1) return null;
    if (data.type === 'submit' || data.type === 'entry') {
        if (!validEntry(data.entry)) return null;
        const { id, author, text, timestamp } = data.entry;
        return { type: data.type, entry: { id, author, text, timestamp } };
    }
    if (data.type === 'state' || data.type === 'presence') {
        if (!Number.isInteger(data.devices) || data.devices < 1 || data.devices > MAX_DEVICES) return null;
        if (data.type === 'presence') return { type: 'presence', devices: data.devices };
        if (!Array.isArray(data.entries) || data.entries.length > MAX_HISTORY || !data.entries.every(validEntry)) return null;
        const entries = data.entries.map(({ id, author, text, timestamp }) => ({ id, author, text, timestamp }));
        if (new Set(entries.map((entry) => entry.id)).size !== entries.length) return null;
        return { type: 'state', devices: data.devices, entries };
    }
    if (data.type === 'full') return { type: 'full' };
    return null;
}

export class TextRoom extends EventTarget {
    constructor(PeerConstructor = globalThis.Peer, timeout = 20_000) {
        super();
        this.PeerConstructor = PeerConstructor;
        this.timeout = timeout;
        this.status = 'idle';
        this.role = '';
        this.code = '';
        this.error = '';
        this.entries = [];
        this.devices = 0;
        this.selfId = '';
        this.peer = null;
        this.connections = new Set();
        this.admitted = new Set();
        this.pending = new Map();
        this.timers = new Set();
        this.generation = 0;
    }

    emit(type) {
        this.dispatchEvent(new Event(type));
    }

    later(callback, delay = this.timeout) {
        const timer = setTimeout(() => {
            this.timers.delete(timer);
            callback();
        }, delay);
        this.timers.add(timer);
        return timer;
    }

    cancel(timer) {
        clearTimeout(timer);
        this.timers.delete(timer);
    }

    create() {
        this.start('host', generateCode(), [], MAX_CODE_ATTEMPTS - 1);
    }

    join(value) {
        const code = normalizeCode(value);
        if (!code) throw new Error('Mã phòng gồm đúng 6 chữ số, ví dụ 012345. Kiểm tra lại mã trên thiết bị tạo phòng.');
        this.start('guest', code);
    }

    retry() {
        if (!this.code) return;
        const { role, code, entries } = this;
        this.start(role, code, role === 'host' ? entries : []);
    }

    stopTransport() {
        this.generation += 1;
        this.timers.forEach(clearTimeout);
        this.timers.clear();
        this.pending.forEach(({ reject }) => reject(new Error('Kết nối đã đóng. Văn bản chưa gửi vẫn còn trong ô soạn.')));
        this.pending.clear();
        this.connections.forEach((connection) => connection.close());
        this.connections.clear();
        this.admitted.clear();
        this.peer?.destroy();
        this.peer = null;
    }

    leave() {
        this.stopTransport();
        Object.assign(this, { status: 'idle', role: '', code: '', error: '', entries: [], devices: 0, selfId: '' });
        this.emit('change');
    }

    fail(message) {
        this.stopTransport();
        this.status = 'error';
        this.error = message;
        this.devices = 0;
        this.emit('change');
    }

    start(role, code, entries = [], codeRetries = 0) {
        if (typeof this.PeerConstructor !== 'function') {
            throw new Error('Không tải được công cụ kết nối. Tải lại trang rồi thử lại.');
        }
        this.stopTransport();
        const generation = this.generation;
        const current = () => generation === this.generation;
        this.selfId = role === 'host' ? PREFIX + code : PREFIX + 'device-' + crypto.randomUUID();
        Object.assign(this, { status: 'connecting', role, code, error: '', entries, devices: 0 });
        this.emit('change');
        let peer;
        try {
            peer = new this.PeerConstructor(this.selfId, { secure: true, debug: 0 });
            this.peer = peer;
        } catch {
            this.fail('Trình duyệt chưa hỗ trợ kết nối này. Hãy thử Chrome, Safari, Firefox hoặc Edge phiên bản mới.');
            return;
        }
        const startupTimer = this.later(() => {
            if (current()) this.fail('Kết nối quá lâu. Kiểm tra Internet rồi bấm Kết nối lại. Nếu mạng chặn kết nối trực tiếp, thử mạng Wi-Fi khác.');
        });
        peer.on('open', () => {
            if (!current()) return;
            if (role === 'host') {
                this.cancel(startupTimer);
                this.devices = this.openConnections().length + 1;
                this.status = this.devices > 1 ? 'connected' : 'waiting';
                this.error = '';
                this.emit('change');
            } else if (this.status === 'connecting') {
                try {
                    this.attach(peer.connect(PREFIX + code, { reliable: true, metadata: { app: PROTOCOL } }), startupTimer);
                } catch {
                    this.fail('Không mở được kết nối. Thử lại bằng trình duyệt mới hoặc một mạng khác.');
                }
            } else {
                this.error = '';
                this.emit('change');
            }
        });
        peer.on('connection', (connection) => {
            if (!current()) return connection.close();
            if (role !== 'host' || connection.metadata?.app !== PROTOCOL) return connection.close();
            this.attach(connection);
        });
        peer.on('error', (error) => {
            if (!current()) return;
            if (error.type === 'peer-unavailable') {
                this.fail('Không tìm thấy phòng. Kiểm tra mã và giữ trang mở trên thiết bị tạo phòng.');
            } else if (error.type === 'unavailable-id') {
                if (role === 'host' && this.status === 'connecting' && codeRetries > 0) {
                    this.start('host', generateCode(), [], codeRetries - 1);
                    return;
                }
                this.fail('Mã phòng đang được dùng ở phiên khác. Rời phòng rồi tạo một phòng mới.');
            } else if (this.openConnections().length && !peer.destroyed) {
                // Established data channels survive a signaling outage.
                this.error = 'Chưa kết nối được dịch vụ tìm thiết bị. Các thiết bị đang kết nối vẫn có thể gửi text.';
                this.emit('change');
            } else {
                this.fail('Không kết nối được. Kiểm tra Internet, thử tắt VPN hoặc đổi mạng rồi bấm Kết nối lại.');
            }
        });
        peer.on('disconnected', () => {
            if (!current()) return;
            this.error = 'Đang khôi phục kết nối. Giữ trang mở; các thiết bị đã kết nối vẫn có thể gửi text.';
            this.emit('change');
            this.later(() => {
                if (current() && !peer.destroyed && peer.disconnected) {
                    try { peer.reconnect(); } catch { /* The timeout below handles failure. */ }
                    this.later(() => {
                        if (current() && peer.disconnected && !this.openConnections().length) this.fail('Mất kết nối. Bấm Kết nối lại để thử tiếp.');
                    });
                }
            }, 1500);
        });
        peer.on('close', () => {
            if (current()) this.fail('Kết nối đã đóng. Bấm Kết nối lại để thử tiếp.');
        });
    }

    openConnections() {
        return [...this.admitted].filter((connection) => connection.open);
    }

    attach(connection, startupTimer) {
        const generation = this.generation;
        const current = () => generation === this.generation;
        this.connections.add(connection);
        const openTimer = this.later(() => {
            if (!current()) return;
            connection.close();
            this.connections.delete(connection);
        });
        connection.on('open', () => {
            if (!current()) return connection.close();
            this.cancel(openTimer);
            if (this.role === 'host') {
                if (this.openConnections().length >= MAX_DEVICES - 1) {
                    this.transmit(connection, { type: 'full' });
                    this.later(() => connection.close(), 300);
                    return;
                }
                this.admitted.add(connection);
                this.devices = this.openConnections().length + 1;
                this.status = 'connected';
                this.transmit(connection, { type: 'state', entries: this.entries, devices: this.devices });
                this.broadcast({ type: 'presence', devices: this.devices });
                this.emit('change');
            } else {
                this.admitted.add(connection);
            }
            // Guests wait for a valid state snapshot before reporting a connection.
        });
        connection.on('data', (data) => {
            if (!current() || !this.admitted.has(connection)) return;
            const packet = parsePacket(data);
            if (!packet) return;
            if (this.role === 'host' && packet.type === 'submit') {
                const existing = this.entries.find((entry) => entry.id === packet.entry.id);
                if (existing) return this.transmit(connection, { type: 'entry', entry: existing });
                this.accept({ ...packet.entry, author: connection.peer, timestamp: Date.now() });
            } else if (this.role === 'guest') {
                if (packet.type === 'full') return this.fail('Phòng đã đủ 6 thiết bị. Rời phòng hoặc tạo phòng mới.');
                if (packet.type === 'state') {
                    this.cancel(startupTimer);
                    this.entries = packet.entries;
                    this.devices = packet.devices;
                    this.status = 'connected';
                    this.error = '';
                    this.emit('change');
                } else if (packet.type === 'presence' && this.status === 'connected') {
                    this.devices = packet.devices;
                    this.emit('change');
                } else if (packet.type === 'entry' && this.status === 'connected') {
                    this.remember(packet.entry);
                    const pending = this.pending.get(packet.entry.id);
                    if (pending) {
                        this.cancel(pending.timer);
                        this.pending.delete(packet.entry.id);
                        pending.resolve();
                    }
                }
            }
        });
        const closed = () => {
            if (!current() || !this.connections.has(connection)) return;
            this.cancel(openTimer);
            this.connections.delete(connection);
            const wasAdmitted = this.admitted.delete(connection);
            if (this.role === 'guest') {
                this.fail('Thiết bị tạo phòng đã ngắt kết nối. Giữ trang đó mở rồi bấm Kết nối lại.');
            } else if (wasAdmitted) {
                this.devices = this.openConnections().length + 1;
                this.status = this.devices > 1 ? 'connected' : 'waiting';
                this.broadcast({ type: 'presence', devices: this.devices });
                this.emit('change');
            }
        };
        connection.on('close', closed);
        connection.on('error', () => { connection.close(); closed(); });
    }

    transmit(connection, packet) {
        if (!connection.open) return false;
        try {
            const result = connection.send({ v: 1, ...packet });
            // PeerJS's binary serializer can report asynchronous send failures.
            result?.catch?.(() => connection.close());
            return true;
        } catch {
            connection.close();
            return false;
        }
    }

    broadcast(packet) {
        this.openConnections().forEach((connection) => this.transmit(connection, packet));
    }

    remember(entry) {
        if (this.entries.some((item) => item.id === entry.id)) return;
        this.entries = [...this.entries, entry].slice(-MAX_HISTORY);
        this.emit('change');
    }

    accept(entry) {
        this.remember(entry);
        this.broadcast({ type: 'entry', entry });
    }

    async send(text) {
        if (typeof text !== 'string' || !text.trim()) throw new Error('Nhập văn bản trước khi gửi.');
        if (text.length > MAX_TEXT_LENGTH) throw new Error('Mỗi đoạn tối đa 20.000 ký tự. Chia văn bản thành các đoạn nhỏ hơn.');
        if (!['waiting', 'connected'].includes(this.status)) throw new Error('Kết nối với phòng trước khi gửi.');
        const entry = { id: crypto.randomUUID(), author: this.selfId, text, timestamp: Date.now() };
        if (this.role === 'host') {
            this.accept(entry);
            return;
        }
        const connection = this.openConnections()[0];
        if (!connection) throw new Error('Chưa kết nối với phòng. Bấm Kết nối lại.');
        return new Promise((resolve, reject) => {
            const timer = this.later(() => {
                this.pending.delete(entry.id);
                reject(new Error('Chưa nhận được xác nhận từ phòng. Văn bản vẫn còn trong ô soạn; kiểm tra kết nối rồi thử lại.'));
            });
            this.pending.set(entry.id, { resolve, reject, timer });
            if (!this.transmit(connection, { type: 'submit', entry })) {
                this.cancel(timer);
                this.pending.delete(entry.id);
                reject(new Error('Gửi chưa thành công. Kết nối lại rồi thử tiếp.'));
            }
        });
    }
}
