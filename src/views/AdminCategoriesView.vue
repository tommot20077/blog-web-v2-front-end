<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { adminService } from '../api/adminService'
import { useToast } from '../composables/useToast'
import AdminRail from '../components/layout/AdminRail.vue'
import type { CategoryResponse } from '../types/editor'

/**
 * AdminCategoriesView — 分類管理（`/admin/categories`）
 *
 * Task A7：表格列出分類（名稱／slug／描述／排序），提供新增、編輯、
 * 刪除（含確認對話框）。分類清單不含文章數欄位，故刪除按鈕無法預先
 * 停用；刪除失敗時（例如後端業務錯誤 CATEGORY_HAS_ARTICLES：分類下仍
 * 有文章）必須把後端訊息透過 toast 明確呈現給管理員，不可靜默失敗。
 */

const { showToast } = useToast()

const categories = ref<CategoryResponse[]>([])
const isLoading = ref(true)

// 表單狀態：null = 未開啟；'create' 新增；'edit' 編輯（editingUuid 記錄目標）
const formMode = ref<'create' | 'edit' | null>(null)
const editingUuid = ref<string | null>(null)
const isSubmitting = ref(false)
const form = reactive({
  name: '',
  slug: '',
  description: '',
  sortOrder: 0,
})

// 刪除確認狀態
const deletingUuid = ref<string | null>(null)

async function fetchCategories() {
  isLoading.value = true
  try {
    categories.value = await adminService.getCategoriesFull()
  } catch (error) {
    showToast(error instanceof Error ? error.message : '載入分類失敗，請稍後再試', 'error')
  } finally {
    isLoading.value = false
  }
}

function openCreateForm() {
  formMode.value = 'create'
  editingUuid.value = null
  form.name = ''
  form.slug = ''
  form.description = ''
  form.sortOrder = 0
}

function openEditForm(category: CategoryResponse) {
  formMode.value = 'edit'
  editingUuid.value = category.uuid
  form.name = category.name
  form.slug = category.slug
  form.description = category.description ?? ''
  form.sortOrder = category.sortOrder
}

function closeForm() {
  formMode.value = null
  editingUuid.value = null
}

async function submitForm() {
  isSubmitting.value = true
  const payload = {
    name: form.name.trim(),
    slug: form.slug.trim(),
    description: form.description.trim() || null,
    sortOrder: form.sortOrder,
  }

  try {
    if (formMode.value === 'edit' && editingUuid.value) {
      await adminService.updateCategory(editingUuid.value, payload)
      showToast('分類已更新', 'success')
    } else {
      await adminService.createCategory(payload)
      showToast('分類已新增', 'success')
    }
    closeForm()
    await fetchCategories()
  } catch (error) {
    showToast(error instanceof Error ? error.message : '儲存失敗，請稍後再試', 'error')
  } finally {
    isSubmitting.value = false
  }
}

function openDeleteConfirm(uuid: string) {
  deletingUuid.value = uuid
}

function cancelDelete() {
  deletingUuid.value = null
}

async function confirmDelete() {
  if (!deletingUuid.value) return
  const uuid = deletingUuid.value

  try {
    await adminService.deleteCategory(uuid)
    deletingUuid.value = null
    showToast('分類已刪除', 'success')
    await fetchCategories()
  } catch (error) {
    // 後端業務錯誤（例如 CATEGORY_HAS_ARTICLES：分類下仍有文章）必須明確
    // 呈現訊息，不可靜默失敗；也不清空 deletingUuid 之外的狀態，讓管理員
    // 知道刪除並未生效。
    showToast(error instanceof Error ? error.message : '刪除失敗，請稍後再試', 'error')
    deletingUuid.value = null
  }
}

onMounted(fetchCategories)
</script>

<template>
  <div class="shell" data-testid="admin-categories-root">
    <AdminRail active="admin-categories" />

    <main class="shell-main">
      <div class="admin-wrap">
        <div class="cat-head">
          <h1 class="admin-title">分類管理</h1>
          <button
            type="button"
            class="cat-btn cat-btn-primary"
            data-testid="admin-categories-add-btn"
            @click="openCreateForm"
          >
            新增分類
          </button>
        </div>

        <!-- 新增／編輯表單 -->
        <div v-if="formMode" class="cat-form" data-testid="admin-categories-form">
          <div class="cat-form-row">
            <label for="cat-form-name">名稱</label>
            <input id="cat-form-name" v-model="form.name" data-testid="admin-categories-form-name" />
          </div>
          <div class="cat-form-row">
            <label for="cat-form-slug">Slug</label>
            <input id="cat-form-slug" v-model="form.slug" data-testid="admin-categories-form-slug" />
          </div>
          <div class="cat-form-row">
            <label for="cat-form-description">描述</label>
            <input
              id="cat-form-description"
              v-model="form.description"
              data-testid="admin-categories-form-description"
            />
          </div>
          <div class="cat-form-row">
            <label for="cat-form-sortOrder">排序</label>
            <input
              id="cat-form-sortOrder"
              v-model.number="form.sortOrder"
              type="number"
              data-testid="admin-categories-form-sortOrder"
            />
          </div>
          <div class="cat-form-actions">
            <button
              type="button"
              class="cat-btn"
              data-testid="admin-categories-form-cancel"
              @click="closeForm"
            >
              取消
            </button>
            <button
              type="button"
              class="cat-btn cat-btn-primary"
              data-testid="admin-categories-form-submit"
              :disabled="isSubmitting"
              @click="submitForm"
            >
              {{ formMode === 'edit' ? '儲存' : '新增' }}
            </button>
          </div>
        </div>

        <!-- Loading -->
        <div v-if="isLoading" data-testid="loading" class="admin-loading">
          <span class="admin-loading-dot" style="animation-delay:0ms" />
          <span class="admin-loading-dot" style="animation-delay:150ms" />
          <span class="admin-loading-dot" style="animation-delay:300ms" />
        </div>

        <!-- 空狀態 -->
        <div v-else-if="categories.length === 0" class="admin-empty">
          目前沒有分類
        </div>

        <!-- 分類表格 -->
        <table v-else class="cat-table" data-testid="admin-categories-table">
          <thead>
            <tr>
              <th>名稱</th>
              <th>Slug</th>
              <th>描述</th>
              <th>排序</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="category in categories"
              :key="category.uuid"
              :data-testid="'admin-categories-row-' + category.uuid"
            >
              <td>{{ category.name }}</td>
              <td>{{ category.slug }}</td>
              <td>{{ category.description || '-' }}</td>
              <td>{{ category.sortOrder }}</td>
              <td class="cat-table-actions">
                <button
                  type="button"
                  class="cat-btn"
                  :data-testid="'admin-categories-edit-' + category.uuid"
                  @click="openEditForm(category)"
                >
                  編輯
                </button>
                <button
                  type="button"
                  class="cat-btn cat-btn-danger"
                  :data-testid="'admin-categories-delete-' + category.uuid"
                  @click="openDeleteConfirm(category.uuid)"
                >
                  刪除
                </button>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- 刪除確認對話框 -->
        <div
          v-if="deletingUuid"
          class="cat-confirm-overlay"
          data-testid="admin-categories-delete-confirm"
        >
          <div class="cat-confirm-box">
            <p>確定要刪除此分類嗎？此操作無法復原。</p>
            <div class="cat-confirm-actions">
              <button
                type="button"
                class="cat-btn"
                data-testid="admin-categories-delete-cancel"
                @click="cancelDelete"
              >
                取消
              </button>
              <button
                type="button"
                class="cat-btn cat-btn-danger"
                data-testid="admin-categories-delete-confirm-btn"
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
.cat-head { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 8px; }
.cat-head .admin-title { margin-bottom: 0; }

.cat-btn {
  padding: 8px 18px; border-radius: 20px; font-size: 13px; cursor: pointer;
  transition: opacity .2s; border: 1px solid var(--glass-border); background: var(--glass); color: var(--ink);
}
.cat-btn:hover { opacity: .8; }
.cat-btn:disabled { opacity: .4; cursor: not-allowed; }
.cat-btn-primary { background: var(--accent); color: #fff; border-color: transparent; }
.cat-btn-danger { background: rgba(239,68,68,.1); color: #b91c1c; border-color: rgba(239,68,68,.2); }

.cat-form {
  display: flex; flex-direction: column; gap: 14px; padding: 20px;
  margin-bottom: 24px; border-radius: 12px; border: 1px solid var(--glass-border);
  background: var(--glass); backdrop-filter: blur(12px);
}
.cat-form-row { display: flex; flex-direction: column; gap: 6px; }
.cat-form-row label {
  font-family: var(--f-mono); font-size: 10.5px; letter-spacing: .1em;
  text-transform: uppercase; color: var(--muted);
}
.cat-form-row input {
  padding: 10px 14px; border-radius: 8px; border: 1px solid var(--glass-border);
  background: transparent; font-size: 14px; color: var(--ink); outline: none;
  transition: border-color .2s;
}
.cat-form-row input:focus { border-color: var(--accent); }
.cat-form-actions { display: flex; gap: 8px; justify-content: flex-end; }

.cat-table { width: 100%; border-collapse: collapse; font-size: 14px; }
.cat-table th {
  text-align: left; padding: 10px 12px; font-family: var(--f-mono); font-size: 11px;
  letter-spacing: .08em; text-transform: uppercase; color: var(--muted);
  border-bottom: 1px solid var(--divider);
}
.cat-table td { padding: 12px; border-bottom: 1px solid var(--divider); color: var(--ink); }
.cat-table-actions { display: flex; gap: 8px; }

.cat-confirm-overlay {
  position: fixed; inset: 0; display: flex; align-items: center; justify-content: center;
  background: rgba(0,0,0,.4); z-index: 100;
}
.cat-confirm-box {
  display: flex; flex-direction: column; gap: 16px; padding: 24px;
  border-radius: 12px; border: 1px solid var(--glass-border); background: var(--bg-sub);
  color: var(--ink); max-width: 360px;
}
.cat-confirm-actions { display: flex; gap: 8px; justify-content: flex-end; }
</style>
