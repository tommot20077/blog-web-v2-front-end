import { ref } from 'vue';

// Toast 類型（使用 as const object 取代 enum）
const TOAST_TYPE = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info',
} as const;

type ToastType = (typeof TOAST_TYPE)[keyof typeof TOAST_TYPE];

interface ToastAction {
  label: string;
  onClick: () => void;
}

interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
  duration: number;
  /** 選用：toast 附帶的動作按鈕（例如「重新整理」） */
  action?: ToastAction;
  /** 選用：去重 key。同 key 的 toast 同時最多一則，新的取代舊的（例如 429 限流提示） */
  key?: string;
}

const MAX_TOASTS = 5;

// 全域 ID 計數器
let idCounter = 0;

// 模組級狀態（所有 consumer 共享同一個 reactive array）
const toasts = ref<ToastMessage[]>([]);

// 管理 timer 清理
const timers = new Map<string, ReturnType<typeof setTimeout>>();

export function useToast() {
  const showToast = (
    message: string,
    type: ToastType = 'info',
    duration = 4000,
    action?: ToastAction,
    key?: string,
  ) => {
    // 同 key 先移除舊的（連同計時器），再加入新的
    if (key !== undefined) {
      toasts.value.filter(t => t.key === key).forEach(t => removeToast(t.id));
    }
    const id = `toast-${++idCounter}`;
    const toast: ToastMessage = {
      id, message, type, duration,
      ...(action ? { action } : {}),
      ...(key !== undefined ? { key } : {}),
    };

    toasts.value.push(toast);

    // 超過上限時移除最舊的
    while (toasts.value.length > MAX_TOASTS) {
      const oldest = toasts.value.shift();
      if (oldest) {
        const timer = timers.get(oldest.id);
        if (timer) {
          clearTimeout(timer);
          timers.delete(oldest.id);
        }
      }
    }

    // 自動消失
    const timer = setTimeout(() => {
      removeToast(id);
    }, duration);
    timers.set(id, timer);
  };

  const removeToast = (id: string) => {
    const timer = timers.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.delete(id);
    }
    toasts.value = toasts.value.filter(t => t.id !== id);
  };

  return {
    toasts,
    showToast,
    removeToast,
    TOAST_TYPE,
  };
}

export type { ToastType, ToastMessage, ToastAction };
