const formatters = new Map<string, Intl.DateTimeFormat>()
const formatter = (zone: string, dateOnly = false) => {
  const key = `${zone}:${dateOnly}`
  if (!formatters.has(key)) formatters.set(key, new Intl.DateTimeFormat(dateOnly ? 'ja-JP' : 'en-GB', dateOnly
    ? { timeZone: zone, year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' }
    : { timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' }))
  return formatters.get(key)!
}
const parts = (date: Date, zone: string) => Object.fromEntries(formatter(zone).formatToParts(date).filter(part => part.type !== 'literal').map(part => [part.type, Number(part.value)])) as Record<'year' | 'month' | 'day' | 'hour' | 'minute' | 'second', number>
const wallTime = (value: ReturnType<typeof parts>) => Date.UTC(value.year, value.month - 1, value.day, value.hour, value.minute, value.second)
const clockText = (value: ReturnType<typeof parts>) => [value.hour, value.minute, value.second].map(number => String(number).padStart(2, '0')).join(':')
export const getTimeDetails = (date: Date, deviceZone = Intl.DateTimeFormat().resolvedOptions().timeZone) => {
  const japan = parts(date, 'Asia/Tokyo'), local = parts(date, deviceZone)
  const differenceMinutes = (wallTime(japan) - wallTime(local)) / 60000
  const distance = Math.abs(differenceMinutes), hours = Math.floor(distance / 60), minutes = distance % 60
  const duration = `${hours ? `${hours}時間` : ''}${minutes ? `${minutes}分` : ''}`
  return {
    japanTime: clockText(japan), japanDate: formatter('Asia/Tokyo', true).format(date),
    localTime: clockText(local), localDate: formatter(deviceZone, true).format(date), deviceZone,
    differenceMinutes, differenceLabel: differenceMinutes ? `日本は${duration}${differenceMinutes > 0 ? '先' : '前'}です` : '端末と同じ時間です',
    hands: { hour: (japan.hour % 12) * 30 + japan.minute / 2 + japan.second / 120, minute: japan.minute * 6 + japan.second / 10, second: japan.second * 6 }
  }
}
