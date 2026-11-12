import { useToast } from '../../composables/useToast'
import { copyToClipboard } from './clipboard'

// 分享文章連結：優先用 Web Share API（手機原生分享面板）；
// 不支援、使用者取消（AbortError）或分享本身失敗時，一律靜默退回複製連結到剪貼簿。
// 只有「複製連結」這一步失敗才顯示錯誤 toast —— 取消分享本身絕不視為錯誤。
export async function shareArticle(url: string): Promise<void> {
  const { showToast } = useToast()

  if (typeof navigator.share === 'function') {
    try {
      await navigator.share({ url })
      return
    } catch {
      // 使用者取消或分享失敗，退回 clipboard fallback，不在此顯示任何錯誤
    }
  }

  const copied = await copyToClipboard(url)
  if (copied) {
    showToast('連結已複製到剪貼簿', 'success')
  } else {
    showToast('分享失敗，請稍後再試', 'error')
  }
}
