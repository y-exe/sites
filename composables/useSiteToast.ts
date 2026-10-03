export const useSiteToast = () => {
  const toast = useState('site-toast', () => ({ show: false, message: '', kind: 'success' as 'success' | 'error' }))
  const copy = async (value: string, message = 'コピーしました') => {
    try { await navigator.clipboard.writeText(value); toast.value = { show: true, message, kind: 'success' }; return true }
    catch { toast.value = { show: true, message: 'コピーできませんでした。文字を選択してコピーしてください。', kind: 'error' }; return false }
  }
  return { toast, copy }
}
