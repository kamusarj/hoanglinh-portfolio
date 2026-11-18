import test from 'node:test';
import assert from 'node:assert/strict';
import { generateCode, normalizeCode, formatCode, parsePacket, MAX_TEXT_LENGTH, MAX_HISTORY } from '../js/text-room.mjs';

const entry = () => ({ id: crypto.randomUUID(), author: 'device-123', text: 'Xin chào 👋\n<script>alert(1)</script>', timestamp: Date.now() });

test('room codes require exactly six digits and preserve leading zeroes', () => {
    assert.equal(normalizeCode(' 001234 '), '001234');
    assert.equal(normalizeCode('000000'), '000000');
    assert.equal(formatCode('001234'), '001234');
    for (const invalid of ['12345', '1234567', '123ABC', '123-456', '１２３４５６', '<script>xxx</script>', null, 123456]) {
        assert.equal(normalizeCode(invalid), '');
    }
    for (let i = 0; i < 1000; i++) assert.match(generateCode(), /^\d{6}$/);
});

test('code generation covers leading zeroes and rejects biased random samples', (t) => {
    const samples = [0, 42, 999999, 4_294_000_000, 123456];
    t.mock.method(crypto, 'getRandomValues', (array) => {
        array[0] = samples.shift();
        return array;
    });
    assert.equal(generateCode(), '000000');
    assert.equal(generateCode(), '000042');
    assert.equal(generateCode(), '999999');
    assert.equal(generateCode(), '123456');
    assert.equal(samples.length, 0);
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
