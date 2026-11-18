import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { TextRoom, MAX_HISTORY, MAX_DEVICES } from '../js/text-room.mjs';

// A small in-memory wire exercises the real room protocol and lifecycle without
// depending on the public signaling service. Browser QA also uses real WebRTC.
class Wire extends EventEmitter {
    constructor(peer, metadata) {
        super();
        this.peer = peer;
        this.metadata = metadata;
        this.open = false;
        this.dropPackets = false;
    }
    send(data) {
        if (!this.open) throw new Error('Wire is closed');
        const copy = structuredClone(data);
        if (!this.dropPackets) queueMicrotask(() => {
            if (this.other.open) this.other.emit('data', copy);
        });
    }
    close() {
        if (this.closed) return;
        this.closed = true;
        this.open = false;
        queueMicrotask(() => this.emit('close'));
        this.other?.close();
    }
}

function makeNetwork() {
    const peers = new Map();
    return class LocalPeer extends EventEmitter {
        constructor(id) {
            super();
            this.id = id;
            this.wires = new Set();
            this.destroyed = false;
            queueMicrotask(() => {
                if (this.destroyed) return;
                if (peers.has(id)) return this.emit('error', { type: 'unavailable-id' });
                peers.set(id, this);
                this.emit('open', id);
            });
        }
        connect(id, { metadata }) {
            const local = new Wire(id, metadata);
            this.wires.add(local);
            queueMicrotask(() => {
                const remotePeer = peers.get(id);
                if (!remotePeer) return this.emit('error', { type: 'peer-unavailable' });
                const remote = new Wire(this.id, metadata);
                remotePeer.wires.add(remote);
                local.other = remote;
                remote.other = local;
                remotePeer.emit('connection', remote);
                if (remote.closed) return;
                local.open = remote.open = true;
                local.emit('open');
                remote.emit('open');
            });
            return local;
        }
        destroy() {
            this.destroyed = true;
            if (peers.get(this.id) === this) peers.delete(this.id);
            this.wires.forEach((wire) => wire.close());
            this.emit('close');
        }
    };
}

function until(room, condition) {
    if (condition()) return Promise.resolve();
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
            room.removeEventListener('change', changed);
            reject(new Error(`Condition not reached: ${room.status}, ${room.error}`));
        }, 1000);
        function changed() {
            if (!condition()) return;
            clearTimeout(timer);
            room.removeEventListener('change', changed);
            resolve();
        }
        room.addEventListener('change', changed);
    });
}

function roomsFor(t) {
    const Peer = makeNetwork();
    const rooms = [];
    t.after(() => rooms.forEach((room) => room.leave()));
    return () => {
        const room = new TextRoom(Peer, 100);
        rooms.push(room);
        return room;
    };
}

test('late arrivals get bounded history; guest messages relay to all devices in order', async (t) => {
    const make = roomsFor(t);
    const host = make();
    host.create();
    await until(host, () => host.status === 'waiting');
    for (let i = 0; i < MAX_HISTORY + 2; i++) await host.send(`Message ${i}`);
    assert.equal(host.entries.length, MAX_HISTORY);
    assert.equal(host.entries[0].text, 'Message 2');
    const guests = [make(), make()];
    for (const guest of guests) {
        guest.join(host.code);
        await until(guest, () => guest.status === 'connected');
        assert.deepEqual(guest.entries, host.entries);
    }
    await guests[0].send('Tiếng Việt 👋\n  const value = 42;');
    await until(guests[1], () => guests[1].entries.at(-1)?.text.startsWith('Tiếng Việt'));
    for (const guest of guests) assert.deepEqual(guest.entries, host.entries);
    assert.equal(host.devices, 3);
    assert.equal(host.entries.at(-1).author, guests[0].selfId);
});

test('closing the creator disconnects guests; retry succeeds while the creator is open', async (t) => {
    const make = roomsFor(t);
    const host = make();
    host.create();
    await until(host, () => host.status === 'waiting');
    const guest = make();
    guest.join(host.code);
    await until(guest, () => guest.status === 'connected');
    guest.openConnections()[0].close();
    await until(guest, () => guest.status === 'error');
    guest.retry();
    await until(guest, () => guest.status === 'connected');
    await guest.send('After reconnect');
    assert.equal(host.entries.at(-1).text, 'After reconnect');
    host.leave();
    await until(guest, () => guest.status === 'error');
    await assert.rejects(guest.send('Cannot send'), /Kết nối với phòng/);
    guest.leave();
    assert.deepEqual(guest.entries, []);
});

test('a guest needs a host acknowledgement, and leaving rejects an in-flight send', async (t) => {
    const make = roomsFor(t);
    const host = make();
    host.create();
    await until(host, () => host.status === 'waiting');
    const guest = make();
    guest.join(host.code);
    await until(guest, () => guest.status === 'connected');
    guest.openConnections()[0].dropPackets = true;
    await assert.rejects(guest.send('Undelivered'), /Chưa nhận được xác nhận/);
    assert.equal(host.entries.length, 0);
    assert.equal(guest.entries.length, 0);
    const rejected = assert.rejects(guest.send('Leaving'), /Kết nối đã đóng/);
    guest.leave();
    await rejected;
});

test('the device limit excludes pending and rejected connections from presence', async (t) => {
    const make = roomsFor(t);
    const host = make();
    host.create();
    await until(host, () => host.status === 'waiting');
    const guests = [];
    for (let i = 1; i < MAX_DEVICES; i++) {
        const guest = make();
        guest.join(host.code);
        await until(guest, () => guest.status === 'connected');
        guests.push(guest);
    }
    const overflow = make();
    overflow.join(host.code);
    await until(overflow, () => overflow.status === 'error');
    assert.match(overflow.error, /đủ 6 thiết bị/);
    assert.equal(host.devices, MAX_DEVICES);
    guests[0].leave();
    await until(host, () => host.devices === MAX_DEVICES - 1);
    overflow.retry();
    await until(overflow, () => overflow.status === 'connected');
    assert.equal(host.devices, MAX_DEVICES);
});

test('invalid input and stale callbacks cannot change a new room session', async (t) => {
    const make = roomsFor(t);
    const host = make();
    assert.throws(() => host.join('invalid'), /12 chữ hoặc số/);
    host.create();
    await until(host, () => host.status === 'waiting');
    await assert.rejects(host.send('  \n'), /Nhập văn bản/);
    await assert.rejects(host.send('x'.repeat(20_001)), /20.000/);
    const oldPeer = host.peer;
    host.create();
    const newCode = host.code;
    await until(host, () => host.status === 'waiting');
    oldPeer.emit('error', { type: 'server-error' });
    oldPeer.emit('close');
    oldPeer.emit('open');
    assert.equal(host.status, 'waiting');
    assert.equal(host.code, newCode);
});
