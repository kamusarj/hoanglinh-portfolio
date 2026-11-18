import test from 'node:test';
import assert from 'node:assert/strict';
import { generateCode, normalizeCode, formatCode, parsePacket, MAX_TEXT_LENGTH, MAX_HISTORY } from '../js/text-room.mjs';

const entry = () => ({ id: crypto.randomUUID(), author: 'device-123', text: 'Xin chào 👋\n<script>alert(1)</script>', timestamp: Date.now() });

test('room codes normalize grouping and case without accepting arbitrary IDs', () => {
    assert.equal(normalizeCode('abcd-efgh-jklm'), 'ABCDEFGHJKLM');
    assert.equal(formatCode('ABCDEFGHJKLM'), 'ABCD-EFGH-JKLM');
    for (const invalid of ['ABC', 'ABCD-EFGH-JKLO', 'ABCD-EFGH-JKL0', '<script>xxx</script>', null]) {
        assert.equal(normalizeCode(invalid), '');
    }
    const codes = new Set(Array.from({ length: 1000 }, generateCode));
    assert.equal(codes.size, 1000);
    for (const code of codes) assert.equal(normalizeCode(code), code);
});

test('packets preserve Unicode, whitespace and markup as plain text', () => {
    const message = entry();
    assert.deepEqual(parsePacket({ v: 1, type: 'entry', entry: message }), { type: 'entry', entry: message });
});

test('malformed, empty and oversized remote text never enters the room', () => {
    for (const data of [null, 'hello', {}, { v: 2, type: 'entry', entry: entry() },
        ...[{ text: '' }, { text: '  \n' }, { text: 'a'.repeat(MAX_TEXT_LENGTH + 1) }, { timestamp: NaN },
            { timestamp: Number.MAX_SAFE_INTEGER }, { id: '-'.repeat(36) }, { id: 'invalid' },
            { author: '<script>' }].map((change) => ({ v: 1, type: 'entry', entry: { ...entry(), ...change } }))]) {
        assert.equal(parsePacket(data), null);
    }
    assert.ok(parsePacket({ v: 1, type: 'submit', entry: { ...entry(), text: 'a'.repeat(MAX_TEXT_LENGTH) } }));
});

test('snapshots reject unbounded history, duplicates and impossible device counts', () => {
    const message = entry();
    assert.ok(parsePacket({ v: 1, type: 'state', entries: [message], devices: 2 }));
    assert.equal(parsePacket({ v: 1, type: 'state', entries: [message, message], devices: 2 }), null);
    assert.equal(parsePacket({ v: 1, type: 'state', entries: Array.from({ length: MAX_HISTORY + 1 }, entry), devices: 2 }), null);
    for (const devices of [0, 7, 1.2, '2']) assert.equal(parsePacket({ v: 1, type: 'presence', devices }), null);
});
