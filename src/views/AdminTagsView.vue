<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { adminService } from '../api/adminService'
import { useToast } from '../composables/useToast'
import AdminRail from '../components/layout/AdminRail.vue'
import type { AdminTagResponse } from '../types/editor'

/**
 * AdminTagsView — 標籤管理（`/admin/tags`）
 *
 * Task A8：表格列出標籤（名稱／slug／文章數／顏色／圖示／描述），提供
 * 編輯（僅 color/icon/description，`UpdateTagRequest` 只有這三個欄位，
 * 後端不接受改 name/slug，故編輯表單將 name/slug 唯讀呈現為純文字，不
 * 提供輸入框）與刪除。
 *
 * 刪除防護分兩層：
 * 1. `usageCount > 0` 時該列刪除按鈕預先 disabled（清單已知有文章使用）。
 * 2. 即便通過第一層（usageCount 顯示為 0），後端仍可能因資料過期而回傳
 *    業務錯誤 `TAG_IN_USE`，此時透過 toast 明確呈現訊息，不可靜默失敗。
 */

const { showToast } = useToast()

const tags = ref<AdminTagResponse[]>([])
const isLoading = ref(true)
// 載入失敗需與空狀態區分：清單為 [] 不代表「沒有資料」，也可能是後端掛了，
// 讓管理員誤讀為資料不存在而重建已存在的標籤；此旗標驅動獨立的錯誤狀態與重試入口。
const loadError = ref(false)

// 表單狀態：null = 未開啟；開啟時記錄目前編輯中標籤的 id
const editingId = ref<string | null>(null)
const isSubmitting = ref(false)
const form = reactive({
  name: '',
  slug: '',
  color: '',
  icon: '',
  description: '',
})

// 刪除確認狀態
const deletingId = ref<string | null>(null)

async function fetchTags() {
  isLoading.value = true
  loadError.value = false
  try {
    tags.value = await adminService.getTagsFull()
  } catch (error) {
    loadError.value = true
    showToast(error instanceof Error ? error.message : '載入標籤失敗，請稍後再試', 'error')
  } finally {
    isLoading.value = false
  }
}

function openEditForm(tag: AdminTagResponse) {
  editingId.value = tag.id
  form.name = tag.name
  form.slug = tag.slug
  form.color = tag.color ?? ''
  form.icon = tag.icon ?? ''
  form.description = tag.description ?? ''
}

function closeForm() {
  editingId.value = null
}

async function submitForm() {
  if (!editingId.value) return
  const id = editingId.value
  isSubmitting.value = true
  const payload = {
    color: form.color.trim() || null,
    icon: form.icon.trim() || null,
    description: form.description.trim() || null,
  }

  try {
    await adminService.updateTag(id, payload)
    showToast('標籤已更新', 'success')
    closeForm()
    await fetchTags()
  } catch (error) {
    showToast(error instanceof Error ? error.message : '儲存失敗，請稍後再試', 'error')
  } finally {
    isSubmitting.value = false
  }
}

function openDeleteConfirm(id: string) {
  deletingId.value = id
}

function cancelDelete() {
  deletingId.value = null
}

async function confirmDelete() {
  if (!deletingId.value) return
  const id = deletingId.value

  try {
    await adminService.deleteTag(id)
    deletingId.value = null
    showToast('標籤已刪除', 'success')
    await fetchTags()
  } catch (error) {
    // 後端業務錯誤（例如 TAG_IN_USE：標籤下仍有文章使用中）必須明確呈現
    // 訊息，不可靜默失敗；清單數字（usageCount）可能過期，禁用按鈕只是
    // 第一層防護，這裡是第二層兜底。
    showToast(error instanceof Error ? error.message : '刪除失敗，請稍後再試', 'error')
    deletingId.value = null
  }
}

onMounted(fetchTags)
</script>

<template>
  <div class="shell" data-testid="admin-tags-root">
    <AdminRail active="admin-tags" />

    <main class="shell-main">
      <div class="admin-wrap">
        <h1 class="admin-title">標籤管理</h1>

        <!-- 編輯表單：name/slug 唯讀呈現，僅 color/icon/description 可編輯 -->
        <div v-if="editingId" class="tag-form" data-testid="admin-tags-form">
          <div class="tag-form-row">
            <label>名稱</label>
            <span class="tag-form-readonly" data-testid="admin-tags-form-name">{{ form.name }}</span>
          </div>
          <div class="tag-form-row">
            <label>Slug</label>
            <span class="tag-form-readonly" data-testid="admin-tags-form-slug">{{ form.slug }}</span>
          </div>
          <div class="tag-form-row">
            <label for="tag-form-color">顏色</label>
            <input id="tag-form-color" v-model="form.color" data-testid="admin-tags-form-color" />
          </div>
          <div class="tag-form-row">
            <label for="tag-form-icon">圖示</label>
            <input id="tag-form-icon" v-model="form.icon" data-testid="admin-tags-form-icon" />
          </div>
          <div class="tag-form-row">
            <label for="tag-form-description">描述</label>
            <input
              id="tag-form-description"
              v-model="form.description"
              data-testid="admin-tags-form-description"
            />
          </div>
          <div class="tag-form-actions">
            <button
              type="button"
              class="tag-btn"
              data-testid="admin-tags-form-cancel"
              @click="closeForm"
            >
              取消
            </button>
            <button
              type="button"
              class="tag-btn tag-btn-primary"
              data-testid="admin-tags-form-submit"
              :disabled="isSubmitting"
              @click="submitForm"
            >
              儲存
            </button>
          </div>
        </div>

        <!-- Loading -->
        <div v-if="isLoading" data-testid="loading" class="admin-loading">
          <span class="admin-loading-dot" style="animation-delay:0ms" />
          <span class="admin-loading-dot" style="animation-delay:150ms" />
          <span class="admin-loading-dot" style="animation-delay:300ms" />
        </div>

        <!-- 載入失敗：與空狀態區分，避免管理員誤讀為「資料不存在」 -->
        <div v-else-if="loadError" class="tag-load-error" data-testid="admin-tags-error" role="alert">
          <p>標籤載入失敗，請稍後再試</p>
          <button
            type="button"
            class="tag-btn"
            data-testid="admin-tags-retry-btn"
            @click="fetchTags"
          >
            重新載入
          </button>
        </div>

        <!-- 空狀態 -->
        <div v-else-if="tags.length === 0" class="admin-empty">
          目前沒有標籤
        </div>

        <!-- 標籤表格 -->
        <table v-else class="tag-table" data-testid="admin-tags-table">
          <thead>
            <tr>
              <th>名稱</th>
              <th>Slug</th>
              <th>文章數</th>
              <th>顏色</th>
              <th>圖示</th>
              <th>描述</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="tag in tags"
              :key="tag.id"
              :data-testid="'admin-tags-row-' + tag.id"
            >
              <td>{{ tag.name }}</td>
              <td>{{ tag.slug }}</td>
              <td>{{ tag.usageCount }}</td>
              <td>{{ tag.color || '-' }}</td>
              <td>{{ tag.icon || '-' }}</td>
              <td>{{ tag.description || '-' }}</td>
              <td class="tag-table-actions">
                <button
                  type="button"
                  class="tag-btn"
                  :data-testid="'admin-tags-edit-' + tag.id"
                  @click="openEditForm(tag)"
                >
                  編輯
                </button>
                <button
                  type="button"
                  class="tag-btn tag-btn-danger"
                  :data-testid="'admin-tags-delete-' + tag.id"
                  :disabled="tag.usageCount > 0"
                  :title="tag.usageCount > 0 ? '此標籤仍有文章使用中，無法刪除' : undefined"
                  @click="openDeleteConfirm(tag.id)"
                >
                  刪除
                </button>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- 刪除確認對話框 -->
        <div
          v-if="deletingId"
          class="tag-confirm-overlay"
          data-testid="admin-tags-delete-confirm"
        >
          <div class="tag-confirm-box">
            <p>確定要刪除此標籤嗎？此操作無法復原。</p>
            <div class="tag-confirm-actions">
              <button
                type="button"
                class="tag-btn"
                data-testid="admin-tags-delete-cancel"
                @click="cancelDelete"
              >
                取消
              </button>
              <button
                type="button"
                class="tag-btn tag-btn-danger"
                data-testid="admin-tags-delete-confirm-btn"
                @click="confirmDelete"
              >
                確認刪除
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.tag-btn {
  padding: 8px 18px; border-radius: 20px; font-size: 13px; cursor: pointer;
  transition: opacity .2s; border: 1px solid var(--glass-border); background: var(--glass); color: var(--ink);
}
.tag-btn:hover { opacity: .8; }
.tag-btn:disabled { opacity: .4; cursor: not-allowed; }
.tag-btn-primary { background: var(--accent); color: #fff; border-color: transparent; }
.tag-btn-danger { background: color-mix(in srgb, var(--danger-strong) 10%, transparent); color: var(--danger); border-color: color-mix(in srgb, var(--danger-strong) 20%, transparent); }

.tag-load-error {
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
  padding: 16px 20px; margin-bottom: 8px; border-radius: 12px;
  border: 1px solid color-mix(in srgb, var(--danger-strong) 20%, transparent); background: color-mix(in srgb, var(--danger-strong) 8%, transparent); color: var(--danger);
  font-size: 14px;
}
.tag-load-error p { margin: 0; }

.tag-form {
  display: flex; flex-direction: column; gap: 14px; padding: 20px;
  margin-bottom: 24px; border-radius: 12px; border: 1px solid var(--glass-border);
  background: var(--glass); backdrop-filter: blur(12px);
}
.tag-form-row { display: flex; flex-direction: column; gap: 6px; }
.tag-form-row label {
  font-family: var(--f-mono); font-size: 10.5px; letter-spacing: .1em;
  text-transform: uppercase; color: var(--muted);
}
.tag-form-row input {
  padding: 10px 14px; border-radius: 8px; border: 1px solid var(--glass-border);
  background: transparent; font-size: 14px; color: var(--ink); outline: none;
  transition: border-color .2s;
}
.tag-form-row input:focus { border-color: var(--accent); }
.tag-form-readonly {
  padding: 10px 14px; font-size: 14px; color: var(--muted);
}
.tag-form-actions { display: flex; gap: 8px; justify-content: flex-end; }

.tag-table { width: 100%; border-collapse: collapse; font-size: 14px; }
.tag-table th {
  text-align: left; padding: 10px 12px; font-family: var(--f-mono); font-size: 11px;
  letter-spacing: .08em; text-transform: uppercase; color: var(--muted);
  border-bottom: 1px solid var(--divider);
}
.tag-table td { padding: 12px; border-bottom: 1px solid var(--divider); color: var(--ink); }
.tag-table-actions { display: flex; gap: 8px; }

.tag-confirm-overlay {
  position: fixed; inset: 0; display: flex; align-items: center; justify-content: center;
  background: rgba(0,0,0,.4); z-index: 100;
}
.tag-confirm-box {
  display: flex; flex-direction: column; gap: 16px; padding: 24px;
  border-radius: 12px; border: 1px solid var(--glass-border); background: var(--bg-sub);
  color: var(--ink); max-width: 360px;
}
.tag-confirm-actions { display: flex; gap: 8px; justify-content: flex-end; }
</style>
