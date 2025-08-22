<template>
  <div class="form-container">
    <h2 class="form-title">Kelola Kategori Artikel</h2>

    <form @submit.prevent="handleAddCategory" class="artikel-form">
      <div v-if="successMessage" class="success-message">
        {{ successMessage }}
      </div>
      <div v-if="errorMessage" class="error-message">
        <div class="error-content">
          <i class="error-icon">⚠️</i>
          <div>
            <strong>Error:</strong>
            <div class="error-details">{{ errorMessage }}</div>
            <div v-if="errorSuggestion" class="error-suggestion">
              <strong>Saran:</strong> {{ errorSuggestion }}
            </div>
          </div>
        </div>
      </div>

      <div class="form-group">
        <label for="new-category">Tambah Kategori Baru:</label>
        <input type="text" id="new-category" v-model="newCategory" placeholder="Nama kategori" required />
      </div>

      <div class="form-actions">
        <button type="submit" class="btn btn-primary" :disabled="loading">
          {{ loading ? 'Menambahkan...' : 'Tambah Kategori' }}
        </button>
      </div>
    </form>

    <div class="existing-categories">
      <h3 class="subtitle">Kategori yang Sudah Ada</h3>
      <ul>
        <li v-for="(category, index) in categories" :key="category.id" class="category-item">
          <span v-if="!category.editing">{{ category.name }}</span>
          <input
            v-else
            v-model="category.editName"
            @keyup.enter="updateCategory(index)"
            @keyup.esc="cancelEdit(index)"
            ref="editInput"
            class="edit-input"
          />
          <div class="action-buttons">
            <button class="btn btn-edit" @click="enableEdit(index)" v-if="!category.editing">Edit</button>
            <button class="btn btn-save" @click="updateCategory(index)" v-else :disabled="category.updating">
              {{ category.updating ? 'Menyimpan...' : 'Simpan' }}
            </button>
            <button class="btn btn-cancel" @click="cancelEdit(index)" v-if="category.editing">Batal</button>
            <button class="btn btn-delete" @click="deleteCategory(index)" v-if="!category.editing" :disabled="category.deleting">
              {{ category.deleting ? 'Menghapus...' : 'Hapus' }}
            </button>
          </div>
        </li>
      </ul>
    </div>

    <!-- Modal Confirmation for Delete -->
    <div v-if="showDeleteModal" class="modal-overlay" @click="closeDeleteModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>Konfirmasi Hapus Kategori</h3>
          <button class="modal-close" @click="closeDeleteModal">×</button>
        </div>
        <div class="modal-body">
          <div class="warning-icon">⚠️</div>
          <p>Apakah Anda yakin ingin menghapus kategori <strong>"{{ deleteTarget?.name }}"</strong>?</p>
          <div v-if="deleteTarget?.articleCount > 0" class="delete-warning">
            <p><strong>Peringatan:</strong> Kategori ini memiliki {{ deleteTarget.articleCount }} artikel yang masih terkait.</p>
            <p>Untuk menghapus kategori ini, Anda perlu:</p>
            <ul>
              <li>Unpublish artikel yang terkait, atau</li>
              <li>Pindahkan artikel ke kategori lain</li>
            </ul>
          </div>
        </div>
        <div class="modal-actions">
          <button class="btn btn-secondary" @click="closeDeleteModal">Batal</button>
          <button 
            class="btn btn-delete" 
            @click="confirmDelete" 
            :disabled="deleteTarget?.deleting"
          >
            {{ deleteTarget?.deleting ? 'Menghapus...' : 'Ya, Hapus' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Error Modal for Delete Failure -->
    <div v-if="showErrorModal" class="modal-overlay" @click="closeErrorModal">
      <div class="modal-content error-modal" @click.stop>
        <div class="modal-header error-header">
          <h3>❌ Tidak Dapat Menghapus Kategori</h3>
          <button class="modal-close" @click="closeErrorModal">×</button>
        </div>
        <div class="modal-body">
          <div class="error-icon-large">🚫</div>
          <p class="error-title">Kategori <strong>"{{ errorModalData?.categoryName }}"</strong> tidak dapat dihapus!</p>
          <div class="error-explanation">
            <p><strong>Alasan:</strong> {{ errorModalData?.message }}</p>
            <div class="error-steps">
              <p><strong>Langkah yang perlu dilakukan:</strong></p>
              <ol>
                <li>Buka halaman manajemen artikel</li>
                <li>Cari artikel yang menggunakan kategori ini</li>
                <li>Unpublish artikel tersebut, ATAU</li>
                <li>Pindahkan artikel ke kategori lain</li>
                <li>Setelah itu, coba hapus kategori lagi</li>
              </ol>
            </div>
          </div>
        </div>
        <div class="modal-actions">
          <button class="btn btn-primary" @click="closeErrorModal">Mengerti</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, nextTick } from 'vue';
import axios from 'axios';

// =========================
// State
// =========================
const categories = ref([]);
const newCategory = ref('');
const successMessage = ref('');
const errorMessage = ref('');
const errorSuggestion = ref('');
const loading = ref(false);
const showDeleteModal = ref(false);
const deleteTarget = ref(null);


const showErrorModal = ref(false);
const errorModalData = ref(null);

// =========================
// Config
// =========================
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// =========================
// Helpers
// =========================
const getAuthHeaders = () => {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};


const extractBackendInvalidStatusMessage = (err) => {
  const raw = err?.message || err?.toString?.() || '';
  const match = raw.match(/Invalid status code:\s*(.+)$/);
  return match ? match[1].trim() : '';
};


const buildRelatedArticleMessage = (count) =>
  `Tidak dapat menghapus kategori yang masih memiliki ${count} artikel published. ` +
  `Silakan unpublish atau reassign artikel terlebih dahulu.`;

// =========================
// Error handlers
// =========================
const handleApiError = (error, action = 'melakukan operasi') => {
  console.error(`Error ${action}:`, error);
  errorSuggestion.value = '';

  if (error?.response?.status === 401) {
    alert('Sesi Anda telah berakhir. Silakan login kembali.');
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
    return;
  }

  
  const invalidStatusText = extractBackendInvalidStatusMessage(error);

  if (error?.response?.status === 400) {
    const message = error.response.data?.message || invalidStatusText || '';
    errorMessage.value = message || `Gagal ${action}.`;
    if (
      message.includes('artikel published') ||
      message.includes('published article') ||
      message.includes('masih memiliki')
    ) {
      errorSuggestion.value = 'Silakan unpublish artikel terlebih dahulu atau pindahkan ke kategori lain sebelum menghapus kategori ini.';
    } else if (message.includes('sudah ada')) {
      errorSuggestion.value = 'Coba gunakan nama yang berbeda untuk kategori Anda.';
    }
  } else if (error?.response?.status === 404) {
    errorMessage.value = 'Kategori tidak ditemukan. Mungkin sudah dihapus sebelumnya.';
    errorSuggestion.value = 'Refresh halaman untuk memperbarui data.';
  } else if (error?.response?.status === 500) {
    errorMessage.value = invalidStatusText || 'Terjadi kesalahan server. Silakan coba lagi nanti.';
    errorSuggestion.value = 'Jika masalah berlanjut, hubungi administrator.';
  } else {
    errorMessage.value = invalidStatusText || `Gagal ${action}. Silakan coba lagi.`;
    errorSuggestion.value = 'Periksa koneksi internet Anda dan coba lagi.';
  }

  successMessage.value = '';
};


const showDeleteErrorModal = (categoryName, msg) => {
  errorModalData.value = { categoryName, message: msg };
  showErrorModal.value = true;
};


const closeErrorModal = () => {
  showErrorModal.value = false;
  errorModalData.value = null;
};

// =========================
// API calls
// =========================
const fetchCategories = async () => {
  try {
    const response = await axios.get(`${API_BASE}/admin/categories`, {
      headers: getAuthHeaders()
    });
    
    if (response.data.success) {
      categories.value = response.data.data.map(category => ({
        id: category.id,
        name: category.name,
        originalName: category.name,
        editName: category.name,
        editing: false,
        updating: false,
        deleting: false,
        articleCount: category.articleCount || 0
      }));
      console.log('Categories loaded:', categories.value.length);
    }
  } catch (error) {
    handleApiError(error, 'memuat data kategori');
  }
};

const handleAddCategory = async () => {
  if (!newCategory.value.trim()) {
    errorMessage.value = 'Nama kategori tidak boleh kosong.';
    errorSuggestion.value = '';
    return;
  }

  const isDuplicate = categories.value.some((cat) =>
    cat.name.toLowerCase() === newCategory.value.trim().toLowerCase()
  );

  if (isDuplicate) {
    errorMessage.value = 'Kategori sudah ada.';
    errorSuggestion.value = 'Coba gunakan nama yang berbeda.';
    return;
  }

  loading.value = true;
  
  try {
    const response = await axios.post(`${API_BASE}/admin/categories`, {
      name: newCategory.value.trim(),
    }, {
      headers: getAuthHeaders()
    });
    
    if (response.data.success) {
      categories.value.push({
        id: response.data.data.id,
        name: response.data.data.name,
        originalName: response.data.data.name,
        editName: response.data.data.name,
        editing: false,
        updating: false,
        deleting: false,
        articleCount: 0
      });
      
      successMessage.value = response.data.message || 'Kategori berhasil ditambahkan.';
      errorMessage.value = '';
      errorSuggestion.value = '';
      newCategory.value = '';
    }
  } catch (error) {
    handleApiError(error, 'menambahkan kategori');
  } finally {
    loading.value = false;
  }
};

// Enable edit mode with auto-focus
const enableEdit = async (index) => {
  const category = categories.value[index];
  category.editing = true;
  category.editName = category.name;
  
  await nextTick();
  const editInputs = document.querySelectorAll('.edit-input');
  if (editInputs[index]) {
    editInputs[index].focus();
    editInputs[index].select();
  }
};

// Cancel edit mode
const cancelEdit = (index) => {
  const category = categories.value[index];
  category.editing = false;
  category.editName = category.originalName;
  category.updating = false;
  
  errorMessage.value = '';
  errorSuggestion.value = '';
};

const updateCategory = async (index) => {
  const category = categories.value[index];
  const updatedName = category.editName?.trim();
  
  if (!updatedName) {
    errorMessage.value = 'Nama kategori tidak boleh kosong.';
    errorSuggestion.value = '';
    return;
  }

  if (updatedName === category.originalName) {
    category.editing = false;
    return;
  }

  const isDuplicate = categories.value.some(
    (cat, i) =>
      i !== index && cat.name.toLowerCase() === updatedName.toLowerCase()
  );

  if (isDuplicate) {
    errorMessage.value = 'Kategori sudah ada.';
    errorSuggestion.value = 'Coba gunakan nama yang berbeda.';
    return;
  }

  category.updating = true;
  
  try {
    const response = await axios.put(`${API_BASE}/admin/categories/${category.id}`, {
      name: updatedName
    }, {
      headers: getAuthHeaders()
    });
    
    if (response.data.success) {
      category.name = response.data.data.name;
      category.originalName = response.data.data.name;
      category.editName = response.data.data.name;
      category.editing = false;
      
      successMessage.value = response.data.message || 'Kategori berhasil diperbarui.';
      errorMessage.value = '';
      errorSuggestion.value = '';
    }
  } catch (error) {
    handleApiError(error, 'memperbarui kategori');
    
    if (error.response?.status === 404) {
      categories.value.splice(index, 1);
    }
  } finally {
    category.updating = false;
  }
};

// =========================
// Delete flow
// =========================
// Show delete confirmation modal
const deleteCategory = async (index) => {
  const category = categories.value[index];
  
  
  errorMessage.value = '';
  errorSuggestion.value = '';
  successMessage.value = '';
  
  // Check if category has articles before showing modal
  try {
    const response = await axios.get(`${API_BASE}/admin/categories/${category.id}/articles-count`, {
      headers: getAuthHeaders()
    });
    category.articleCount = response.data?.count || 0;
  } catch (error) {
    console.warn('Could not fetch article count:', error);
    category.articleCount = 0;
  }
  
  deleteTarget.value = { ...category, index };
  showDeleteModal.value = true;
};

// Close delete modal
const closeDeleteModal = () => {
  showDeleteModal.value = false;
  deleteTarget.value = null;
};


const confirmDelete = async () => {
  if (!deleteTarget.value) return;
  
  const index = deleteTarget.value.index;
  const category = categories.value[index];
  const categoryName = category.name;

 
  if ((category.articleCount ?? 0) > 0) {
    closeDeleteModal();
    showDeleteErrorModal(categoryName, buildRelatedArticleMessage(category.articleCount));
    return;
  }
  
  category.deleting = true;
  deleteTarget.value.deleting = true;
  
  try {
    const response = await axios.delete(`${API_BASE}/admin/categories/${category.id}`, {
      headers: getAuthHeaders()
    });
    
    if (response.data.success) {
      categories.value.splice(index, 1);
      successMessage.value = response.data.message || 'Kategori berhasil dihapus.';
      errorMessage.value = '';
      errorSuggestion.value = '';
      
      console.log(`Category deleted: ${categoryName}`);
      closeDeleteModal();
    }
  } catch (error) {
    console.error('Delete error:', error);

  
    closeDeleteModal();
    category.deleting = false;

   
    const fallbackText =
      extractBackendInvalidStatusMessage(error) ||
      error.response?.data?.message ||
      'Terjadi kesalahan saat menghapus kategori';

    if (error.response?.status === 400) {
      showDeleteErrorModal(categoryName, fallbackText);
    } else if (error.response?.status === 404) {
      categories.value.splice(index, 1);
      errorMessage.value = 'Kategori tidak ditemukan. Mungkin sudah dihapus sebelumnya.';
    } else {
      showDeleteErrorModal(categoryName, fallbackText);
    }
  }
};

// =========================
// Misc
// =========================
// Clear messages after 7 seconds
const clearMessages = () => {
  setTimeout(() => {
    successMessage.value = '';
    errorMessage.value = '';
    errorSuggestion.value = '';
  }, 7000);
};

// Watch for messages and auto-clear them
watch([successMessage, errorMessage], () => {
  if (successMessage.value || errorMessage.value) {
    clearMessages();
  }
});

// Load categories on component mount
onMounted(async () => {
  console.log('Category management component mounted, loading categories...');
  await fetchCategories();
});
</script>

<style scoped>
.form-container {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  width: 100%;
  max-width: 1300px;
  margin: 0 auto;
  height: calc(100vh - 3.5rem * 2); 
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  color: black;
}

.form-title {
  font-size: 1.8rem;
  font-weight: 700;
  margin-bottom: 1.5rem;
  text-align: center;
}

.subtitle {
  font-size: 1.2rem;
  font-weight: 600;
  margin: 2rem 0 1rem;
}

.artikel-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

input[type="text"] {
  padding: 0.8rem;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  font-size: 1rem;
  width: 100%;
  box-sizing: border-box;
  transition: border-color 0.2s;
}

input:focus {
  outline: none;
  border-color: #154484;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}

.existing-categories ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.category-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #f7f7f7;
  padding: 0.75rem 1rem;
  border-radius: 6px;
  margin-bottom: 0.5rem;
  gap: 1rem;
}

.category-item input[type="text"] {
  flex: 1;
  padding: 0.5rem;
}

.action-buttons {
  display: flex;
  gap: 0.5rem;
}

.btn {
  padding: 0.5rem 1rem;
  border-radius: 25px;
  font-weight: 600;
  font-size: 0.9rem;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background-color: #FB8312;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: #e67e00;
}

.btn-secondary {
  background-color: #f0f0f0;
  color: #555;
  border: 1px solid #ccc;
}

.btn-secondary:hover:not(:disabled) {
  background-color: #e0e0e0;
}

.btn-edit {
  background-color: #e0f4ff;
  color: #007BFF;
  font-weight: 500;
}

.btn-edit:hover:not(:disabled) {
  background-color: #cce9ff;
}

.btn-save {
  background-color: #FB8312;
  color: white;
  font-weight: bold;
}

.btn-save:hover:not(:disabled) {
  background-color: #e67e00;
}

.btn-cancel {
  background-color: #f8f9fa;
  color: #6c757d;
  border: 1px solid #dee2e6;
}

.btn-cancel:hover:not(:disabled) {
  background-color: #e2e6ea;
}

.btn-delete {
  background-color: #ffecec;
  color: #e53e3e;
  font-weight: 500;
}

.btn-delete:hover:not(:disabled) {
  background-color: #ffdede;
}

.success-message {
  color: #48bb78;
  background-color: #e5f5e5;
  padding: 1rem;
  border-radius: 8px;
  text-align: center;
  border-left: 4px solid #48bb78;
}

.error-message {
  background-color: #fcebeb;
  padding: 1rem;
  border-radius: 8px;
  border-left: 4px solid #e53e3e;
}

.error-content {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
}

.error-icon {
  font-size: 1.2rem;
  flex-shrink: 0;
  margin-top: 0.1rem;
}

.error-details {
  color: #e53e3e;
  font-weight: 500;
  margin: 0.25rem 0;
}

.error-suggestion {
  color: #666;
  font-size: 0.9rem;
  margin-top: 0.5rem;
  padding: 0.5rem;
  background-color: #f8f9fa;
  border-radius: 4px;
  border-left: 3px solid #ffc107;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 12px;
  padding: 0;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e0e0e0;
}

.modal-header h3 {
  margin: 0;
  color: #333;
  font-size: 1.2rem;
}

.modal-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #666;
  padding: 0.25rem;
  border-radius: 4px;
}

.modal-close:hover {
  background-color: #f0f0f0;
}

.modal-body {
  padding: 1.5rem;
  text-align: center;
}

.warning-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.modal-body p {
  margin: 0.5rem 0;
  color: #333;
}

.delete-warning {
  background-color: #fff3cd;
  padding: 1rem;
  border-radius: 6px;
  border-left: 4px solid #ffc107;
  margin: 1rem 0;
  text-align: left;
}

.delete-warning ul {
  margin: 0.5rem 0;
  padding-left: 1.5rem;
}

.delete-warning li {
  margin: 0.25rem 0;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding: 1.5rem;
  border-top: 1px solid #e0e0e0;
}

/* 🚨 ADDED: Error Modal Styles (sama seperti author) */
.error-modal {
  max-width: 600px;
}

.error-header {
  background-color: #fee;
  border-bottom-color: #fcc;
}

.error-header h3 {
  color: #c53030;
}

.error-icon-large {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.error-title {
  font-size: 1.1rem;
  color: #333;
  margin-bottom: 1.5rem;
  font-weight: 600;
}

.error-explanation {
  text-align: left;
  background-color: #fef5e7;
  padding: 1.5rem;
  border-radius: 8px;
  border-left: 4px solid #f56565;
}

.error-explanation p {
  margin: 0.5rem 0;
  color: #2d3748;
}

.error-steps {
  margin-top: 1rem;
}

.error-steps ol {
  margin: 0.5rem 0;
  padding-left: 1.5rem;
  color: #4a5568;
}

.error-steps li {
  margin: 0.5rem 0;
  line-height: 1.5;
}

@media (max-width: 600px) {
  .form-container {
    padding: 1.5rem;
    margin: 1rem auto;
  }
  
  .modal-content {
    width: 95%;
    margin: 1rem;
  }
  
  .action-buttons {
    flex-direction: column;
    gap: 0.25rem;
  }
  
  .btn {
    padding: 0.4rem 0.8rem;
    font-size: 0.8rem;
  }
  
  .modal-actions {
    flex-direction: column;
    gap: 0.5rem;
  }
  
  /* 🚨 ADDED: Error modal responsive (sama seperti author) */
  .error-modal {
    max-width: 95%;
  }
}
</style>