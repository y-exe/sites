import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'

test('published public key has valid armor, checksum and the displayed fingerprint', async () => {
  const source = await readFile(new URL('../components/PgpModal.vue', import.meta.url), 'utf8')
  const armor = source.match(/const pgpKeyText = `([\s\S]*?)`/)[1]
  const fingerprint = source.match(/const pgpFingerprint = '([a-f0-9]+)'/)[1]
  const lines = armor.split(/\r?\n/)
  assert.equal(lines.shift(), '-----BEGIN PGP PUBLIC KEY BLOCK-----')
  assert.equal(lines.pop(), '-----END PGP PUBLIC KEY BLOCK-----')
  const checksum = lines.pop()
  assert.match(checksum, /^=[A-Za-z0-9+/]{4}$/)
  lines.forEach(line => assert.match(line, /^[A-Za-z0-9+/]+={0,2}$/))
  const encoded = lines.join('')
  assert.equal(encoded.length % 4, 0)
  const bytes = Buffer.from(encoded, 'base64')
  let crc = 0xb704ce
  for (const byte of bytes) {
    crc ^= byte << 16
    for (let bit = 0; bit < 8; bit++) {
      crc <<= 1
      if (crc & 0x1000000) crc ^= 0x1864cfb
    }
  }
  const expectedChecksum = Buffer.from([(crc >> 16) & 255, (crc >> 8) & 255, crc & 255]).toString('base64')
  assert.equal(checksum, `=${expectedChecksum}`)
  assert.equal(bytes[0], 0xc6)
  const length = bytes[1]
  assert.ok(length < 192)
  const body = bytes.subarray(2, 2 + length)
  assert.equal(body[0], 4)
  const prefix = Buffer.from([0x99, length >> 8, length & 255])
  const actualFingerprint = createHash('sha1').update(prefix).update(body).digest('hex')
  assert.equal(actualFingerprint, fingerprint)
})
