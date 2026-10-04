import assert from 'node:assert/strict'
import { test } from 'node:test'
import { getTimeDetails } from '../utils/time-details.ts'

test('Japan midnight stays 00:00 and compares dates across the international date boundary', () => {
  const details = getTimeDetails(new Date('2026-10-03T15:00:00Z'), 'America/New_York')
  assert.equal(details.japanTime, '00:00:00'); assert.equal(details.localTime, '11:00:00')
  assert.equal(details.differenceMinutes, 780)
  assert.equal(details.differenceLabel, '日本は13時間先です')
  assert.deepEqual(details.hands, { hour: 0, minute: 0, second: 0 })
  assert.notEqual(details.japanDate, details.localDate)
})
test('offsets reflect daylight saving and fractional-hour time zones', () => {
  assert.equal(getTimeDetails(new Date('2026-01-15T12:00:00Z'), 'America/New_York').differenceMinutes, 840)
  const date = new Date('2026-10-04T12:34:56Z')
  assert.equal(getTimeDetails(date, 'Asia/Kathmandu').differenceLabel, '日本は3時間15分先です')
  assert.equal(getTimeDetails(date, 'Pacific/Chatham').differenceLabel, '日本は4時間45分前です')
  const same = getTimeDetails(date, 'Asia/Tokyo')
  assert.equal(same.japanTime, same.localTime); assert.equal(same.differenceLabel, '端末と同じ時間です')
})
