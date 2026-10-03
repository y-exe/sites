export const useSiteToast = () => {
  const toast = useState('site-toast', () => ({ show: false, message: '' }))
  const copy = async (value: string, message = 'コピーしました') => {
    try { await navigator.clipboard.writeText(value); toast.value = { show: true, message }; return true }
    catch { toast.value = { show: true, message: 'コピーできませんでした。文字を選択してコピーしてください。' }; return false }
  }
  return { toast, copy }
}
