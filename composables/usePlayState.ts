export const playMoods = [
  { face: "(*'▽')", label: 'Hentai' },
  { face: '(´；ω；`)', label: 'Sad...' },
  { face: '(≧▽≦)', label: 'Happy!' },
  { face: '(｀・ω・´)', label: 'Serious.' },
  { face: '(〃ω〃)', label: 'Shy...' },
  { face: '(°ロ°)', label: 'Surprised!' },
  { face: '(－ω－)', label: 'Sleepy...' },
  { face: '(￣ー￣)', label: 'Smug.' },
  { face: '(・_・?)', label: 'Confused?' },
  { face: '(＃｀Д´)', label: 'Angry!' },
  { face: '(๑´ڡ`๑)', label: 'Hungry...' },
  { face: '(～﹃～)', label: 'Melting...' },
  { face: '( ˘ω˘ )', label: 'Chill.' },
  { face: '(☆▽☆)', label: 'Excited!' },
  { face: '(ง •̀ω•́)ง', label: 'Motivated!' },
  { face: '(눈_눈)', label: 'Unimpressed.' },
]

export const usePlayState = () => {
  const mood = useState('play-mood', () => 0)
  const sleeping = useState('play-sleeping', () => false)
  const panel = useState<'letters' | null>('play-panel', () => null)
  const face = computed(() => sleeping.value ? '(－ω－) zzZ' : playMoods[mood.value % playMoods.length]!.face)
  const label = computed(() => sleeping.value ? 'Sleeping...' : playMoods[mood.value % playMoods.length]!.label)
  const burst = useState('play-burst', () => ({ count: 0, last: 0, rareAt: 4 }))
  const react = () => {
    if (sleeping.value) { sleeping.value = false; return }
    const now = Date.now()
    if (now - burst.value.last > 900) { burst.value.count = 0; burst.value.rareAt = 3 + Math.floor(Math.random() * 3) }
    burst.value.last = now
    burst.value.count++
    if (burst.value.count >= burst.value.rareAt) {
      mood.value = 1 + Math.floor(Math.random() * (playMoods.length - 1))
      burst.value.count = 0
      burst.value.rareAt = 3 + Math.floor(Math.random() * 3)
    } else mood.value = 0
  }
  return { mood, sleeping, panel, face, label, react }
}
