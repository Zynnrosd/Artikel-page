<template>
  <div class="artikel-list-container">
    <h2 class="list-title">Daftar Artikel</h2>

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

    <div class="filters-section">
      <div class="search-box">
        <input 
          v-model="searchQuery" 
          @input="debounceSearch"
          type="text" 
          placeholder="Cari artikel..."
          class="search-input"
        />
      </div>
      
      <div class="filter-controls">
        <select v-model="selectedCategory" @change="fetchArticles" class="filter-select">
          <option value="">Semua Kategori</option>
          <option v-for="category in categories" :key="category.id" :value="category.name">
            {{ category.name }}
          </option>
        </select>
        
        <select v-model="selectedAuthor" @change="fetchArticles" class="filter-select">
          <option value="">Semua Penulis</option>
          <option v-for="author in authors" :key="author.id || author.name" :value="author.name">
            {{ author.name }}
          </option>
        </select>
        
        <select v-model="publishedFilter" @change="fetchArticles" class="filter-select">
          <option value="">Semua Status</option>
          <option value="true">Dipublikasikan</option>
          <option value="false">Draft</option>
        </select>
      </div>
    </div>

    <div v-if="loading" class="loading-state">
      <div class="loading-spinner"></div>
      <p>Memuat artikel...</p>
    </div>

    <div v-else-if="articles.length" class="artikel-content">
      <div class="artikel-table-responsive">
        <table class="artikel-table">
          <thead>
            <tr>
              <th>Judul</th>
              <th>Penulis</th>
              <th>Kategori</th>
              <th>Tanggal Dibuat</th>
              <th>Status</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="article in articles" :key="article.id">
              <td class="title-cell">
                <div class="title-content">
                  {{ article.title }}
                </div>
              </td>
              <td>{{ getDisplayAuthorName(article.author) }}</td>
              <td>{{ getDisplayCategoryName(article.category) }}</td>
              <td>{{ formatDate(article.createdAt) }}</td>
              <td>
                <span :class="['status-badge', { 
                  'draft': article.status === 'draft', 
                  'published': article.status === 'published' 
                }]">
                  {{ article.status === 'published' ? 'Dipublikasikan' : 'Draft' }}
                </span>
              </td>
              <td>
                <div class="action-buttons">
                  <button @click="handleEdit(article.id)" class="btn btn-action-edit">
                    Edit
                  </button>
                  <button 
                    @click="handleDelete(article.id)" 
                    class="btn btn-action-delete" 
                    :disabled="deleting === article.id"
                  >
                    {{ deleting === article.id ? 'Menghapus...' : 'Hapus' }}
                  </button>
                  <button 
                    v-if="article.status === 'published'" 
                    @click="handleToggleStatus(article.id)" 
                    class="btn btn-action-draft"
                    :disabled="toggling === article.id"
                  >
                    {{ toggling === article.id ? 'Proses...' : 'Jadikan Draft' }}
                  </button>
                  <button 
                    v-if="article.status === 'draft'" 
                    @click="handleToggleStatus(article.id)" 
                    class="btn btn-action-publish"
                    :disabled="toggling === article.id"
                  >
                    {{ toggling === article.id ? 'Proses...' : 'Publikasikan' }}
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="pagination.totalPages > 1" class="pagination">
        <button 
          @click="changePage(pagination.currentPage - 1)"
          :disabled="!pagination.hasPrev"
          class="btn btn-pagination"
        >
          Sebelumnya
        </button>
        
        <div class="page-info">
          Halaman {{ pagination.currentPage }} dari {{ pagination.totalPages }}
          ({{ pagination.totalItems }} artikel)
        </div>
        
        <button 
          @click="changePage(pagination.currentPage + 1)"
          :disabled="!pagination.hasNext"
          class="btn btn-pagination"
        >
          Selanjutnya
        </button>
      </div>
    </div>

    <div v-else class="empty-state">
      <div class="empty-icon">📄</div>
      <p>Tidak ada artikel yang ditemukan.</p>
      <small class="empty-subtitle">Coba ubah filter atau kata kunci pencarian Anda.</small>
    </div>

    <div v-if="showDeleteModal" class="modal-overlay" @click="closeDeleteModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>Konfirmasi Hapus Artikel</h3>
          <button class="modal-close" @click="closeDeleteModal">×</button>
        </div>
        <div class="modal-body">
          <div class="warning-icon">⚠️</div>
          <p>Apakah Anda yakin ingin menghapus artikel <strong>"{{ deleteTarget?.title }}"</strong>?</p>
          <p class="warning-text">Artikel yang dihapus tidak dapat dikembalikan.</p>
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

    <div v-if="showStatusModal" class="modal-overlay" @click="closeStatusModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>{{ statusModalData.isPublishing ? 'Konfirmasi Publikasi' : 'Konfirmasi Ubah ke Draft' }}</h3>
          <button class="modal-close" @click="closeStatusModal">×</button>
        </div>
        <div class="modal-body">
          <div class="info-icon">{{ statusModalData.isPublishing ? '🚀' : '📝' }}</div>
          <p v-if="statusModalData.isPublishing">
            Apakah Anda yakin ingin mempublikasikan artikel <strong>"{{ statusTarget?.title }}"</strong>?
          </p>
          <p v-else>
            Apakah Anda yakin ingin mengubah artikel <strong>"{{ statusTarget?.title }}"</strong> menjadi draft?
          </p>
          <p class="info-text">
            {{ statusModalData.isPublishing 
              ? 'Artikel akan dapat dilihat oleh publik.' 
              : 'Artikel tidak akan lagi dapat dilihat oleh publik.' }}
          </p>
        </div>
        <div class="modal-actions">
          <button class="btn btn-secondary" @click="closeStatusModal">Batal</button>
          <button 
            :class="['btn', statusModalData.isPublishing ? 'btn-publish' : 'btn-draft']"
            @click="confirmStatusToggle" 
            :disabled="statusTarget?.toggling"
          >
            {{ statusTarget?.toggling ? 'Memproses...' : (statusModalData.isPublishing ? 'Ya, Publikasikan' : 'Ya, Jadikan Draft') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';

const router = useRouter();

const articles = ref([]);
const categories = ref([]);
const authors = ref([]);
const loading = ref(true);
const deleting = ref(null);
const toggling = ref(null);

const successMessage = ref('');
const errorMessage = ref('');
const errorSuggestion = ref('');

const searchQuery = ref('');
const selectedCategory = ref('');
const selectedAuthor = ref('');
const publishedFilter = ref('');

const pagination = ref({
  currentPage: 1,
  totalPages: 1,
  totalItems: 0,
  hasNext: false,
  hasPrev: false
});

const showDeleteModal = ref(false);
const deleteTarget = ref(null);
const showStatusModal = ref(false);
const statusTarget = ref(null);
const statusModalData = ref({ isPublishing: false });

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

const showSuccessMessage = (message) => {
  successMessage.value = message;
  errorMessage.value = '';
  errorSuggestion.value = '';
};

const showErrorMessage = (message, suggestion = '') => {
  errorMessage.value = message;
  errorSuggestion.value = suggestion;
  successMessage.value = '';
};

const clearMessages = () => {
  successMessage.value = '';
  errorMessage.value = '';
  errorSuggestion.value = '';
};

const handleApiError = (error, action = 'melakukan operasi') => {
  console.error(`Error ${action}:`, error);

  if (error?.response?.status === 401) {
    showErrorMessage('Sesi Anda telah berakhir. Silakan login kembali.');
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
    router.push('/login');
    return;
  }

  const status = error?.response?.status;
  const message = error?.response?.data?.message;

  switch (status) {
    case 400:
      showErrorMessage(
        message || `Permintaan tidak valid saat ${action}.`,
        'Pastikan data yang Anda masukkan sudah benar.'
      );
      break;
    case 403:
      showErrorMessage(
        'Anda tidak memiliki izin untuk melakukan tindakan ini.',
        'Hubungi administrator jika Anda yakin memiliki akses.'
      );
      break;
    case 404:
      showErrorMessage(
        'Data yang diminta tidak ditemukan.',
        'Data mungkin telah dihapus atau dipindahkan.'
      );
      break;
    case 500:
      showErrorMessage(
        'Terjadi kesalahan server.',
        'Silakan coba lagi dalam beberapa saat.'
      );
      break;
    default:
      showErrorMessage(
        message || `Gagal ${action}.`,
        'Periksa koneksi internet dan coba lagi.'
      );
  }
};

let searchTimeout;
const debounceSearch = () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    fetchArticles();
  }, 500);
};

const fetchArticles = async (page = 1) => {
  loading.value = true;
  clearMessages();
  
  try {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: '10'
    });
    
    if (searchQuery.value.trim()) {
      params.append('search', searchQuery.value.trim());
    }
    if (selectedCategory.value) {
      params.append('category', selectedCategory.value);
    }
    if (selectedAuthor.value) {
      params.append('author', selectedAuthor.value);
    }
    if (publishedFilter.value) {
      params.append('published', publishedFilter.value);
    }

    const response = await axios.get(`${API_BASE}/admin/articles?${params.toString()}`, {
      headers: getAuthHeaders()
    });
    
    if (response.data.success) {
      articles.value = response.data.data || [];
      if (response.data.pagination) {
        pagination.value = {
          currentPage: response.data.pagination.currentPage || 1,
          totalPages: response.data.pagination.totalPages || 1,
          totalItems: response.data.pagination.totalItems || 0,
          hasNext: response.data.pagination.hasNext || false,
          hasPrev: response.data.pagination.hasPrev || false
        };
      }
    }
  } catch (error) {
    handleApiError(error, 'memuat artikel');
  } finally {
    loading.value = false;
  }
};

const fetchCategories = async () => {
  try {
    const response = await axios.get(`${API_BASE}/admin/categories`, {
      headers: getAuthHeaders()
    });
    
    if (response.data.success) {
      categories.value = response.data.data || [];
    }
  } catch (error) {
    console.error('Error fetching categories:', error);
  }
};

const fetchAuthors = async () => {
  try {
    const response = await axios.get(`${API_BASE}/admin/authors`, {
      headers: getAuthHeaders()
    });
    
    if (response.data.success) {
      authors.value = response.data.data.map(author => ({
        id: author.id,
        name: author.name
      }));
    }
  } catch (error) {
    console.error('Error fetching authors:', error);
    try {
      const fallbackResponse = await axios.get(`${API_BASE}/public/authors`);
      if (fallbackResponse.data.success) {
        authors.value = fallbackResponse.data.data.map(authorName => ({
          name: authorName
        }));
      }
    } catch (fallbackError) {
      console.error('Error fetching authors from fallback:', fallbackError);
    }
  }
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  const options = { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };
  return new Date(dateString).toLocaleDateString('id-ID', options);
};

const handleEdit = (id) => {
  router.push(`/dashboardadmin/artikel/edit/${id}`);
};

const handleDelete = async (id) => {
  const article = articles.value.find(a => a.id === id);
  if (!article) return;
  
  clearMessages();
  deleteTarget.value = { ...article, index: articles.value.indexOf(article) };
  showDeleteModal.value = true;
};

const closeDeleteModal = () => {
  showDeleteModal.value = false;
  deleteTarget.value = null;
};

const confirmDelete = async () => {
  if (!deleteTarget.value) return;
  
  const id = deleteTarget.value.id;
  const index = deleteTarget.value.index;
  
  deleteTarget.value.deleting = true;
  deleting.value = id;
  
  try {
    const response = await axios.delete(`${API_BASE}/admin/articles/${id}`, {
      headers: getAuthHeaders()
    });
    
    if (response.data.success) {
      articles.value = articles.value.filter(article => article.id !== id);
      showSuccessMessage(response.data.message || 'Artikel berhasil dihapus!');
      closeDeleteModal();
      if (articles.value.length === 0 && pagination.value.currentPage > 1) {
        await fetchArticles(pagination.value.currentPage - 1);
      }
    }
    
  } catch (error) {
    closeDeleteModal();
    handleApiError(error, 'menghapus artikel');
  } finally {
    deleting.value = null;
    if (deleteTarget.value) {
      deleteTarget.value.deleting = false;
    }
  }
};

const handleToggleStatus = async (id) => {
  const article = articles.value.find(a => a.id === id);
  if (!article) return;
  
  clearMessages();
  const isCurrentlyPublished = article.status === 'published';
  
  statusTarget.value = { ...article, index: articles.value.indexOf(article) };
  statusModalData.value = { isPublishing: !isCurrentlyPublished };
  showStatusModal.value = true;
};

const closeStatusModal = () => {
  showStatusModal.value = false;
  statusTarget.value = null;
  statusModalData.value = { isPublishing: false };
};

const confirmStatusToggle = async () => {
  if (!statusTarget.value) return;
  
  const id = statusTarget.value.id;
  const index = statusTarget.value.index;
  
  statusTarget.value.toggling = true;
  toggling.value = id;
  
  try {
    const response = await axios.patch(`${API_BASE}/admin/articles/${id}/toggle-publish`, {}, {
      headers: getAuthHeaders()
    });
    
    if (response.data.success) {
      const updatedArticle = response.data.data;
      const articleIndex = articles.value.findIndex(a => a.id === id);
      if (articleIndex !== -1) {
        articles.value[articleIndex] = {
          ...articles.value[articleIndex],
          status: updatedArticle.is_published ? 'published' : 'draft',
          is_published: updatedArticle.is_published
        };
      }
      const successMsg = updatedArticle.is_published
        ? 'Artikel berhasil dipublikasikan!' 
        : 'Artikel berhasil diubah menjadi draft!';
        
      showSuccessMessage(response.data.message || successMsg);
      closeStatusModal();
    }
    
  } catch (error) {
    closeStatusModal();
    handleApiError(error, 'mengubah status artikel');
  } finally {
    toggling.value = null;
    if (statusTarget.value) {
      statusTarget.value.toggling = false;
    }
  }
};

const changePage = async (page) => {
  if (page >= 1 && page <= pagination.value.totalPages) {
    await fetchArticles(page);
  }
};

const getDisplayAuthorName = (originalAuthorName) => {
  const exactMatch = authors.value.find(author => 
    author.name === originalAuthorName
  );
  if (exactMatch) {
    return exactMatch.name;
  }
  const caseInsensitiveMatch = authors.value.find(author => 
    author.name.toLowerCase() === originalAuthorName.toLowerCase()
  );
  if (caseInsensitiveMatch) {
    return caseInsensitiveMatch.name;
  }
  return originalAuthorName;
};

const getDisplayCategoryName = (originalCategoryName) => {
  const exactMatch = categories.value.find(category => 
    category.name === originalCategoryName
  );
  if (exactMatch) {
    return exactMatch.name;
  }
  const caseInsensitiveMatch = categories.value.find(category => 
    category.name.toLowerCase() === originalCategoryName.toLowerCase()
  );
  return caseInsensitiveMatch ? caseInsensitiveMatch.name : originalCategoryName;
};

const refreshData = async () => {
  await Promise.all([
    fetchCategories(),
    fetchAuthors()
  ]);
  await fetchArticles(pagination.value.currentPage);
};

const handleStorageChange = (e) => {
  if (e.key === 'authorUpdated' || e.key === 'categoryUpdated') {
    refreshData();
  }
};

const handleDataUpdate = (event) => {
  const { detail } = event;
  if (detail?.type?.includes('author') || detail?.type?.includes('category')) {
    refreshData();
  }
};

const autoCleanMessages = () => {
  setTimeout(() => {
    clearMessages();
  }, 5000);
};

watch([successMessage, errorMessage], () => {
  if (successMessage.value || errorMessage.value) {
    autoCleanMessages();
  }
});

onMounted(async () => {
  await Promise.all([
    fetchCategories(),
    fetchAuthors()
  ]);
  await fetchArticles();
  window.addEventListener('storage', handleStorageChange);
  window.addEventListener('dataUpdated', handleDataUpdate);
});

onBeforeUnmount(() => {
  window.removeEventListener('storage', handleStorageChange);
  window.removeEventListener('dataUpdated', handleDataUpdate);
  if (searchTimeout) {
    clearTimeout(searchTimeout);
  }
});
</script>

<style scoped>
.artikel-list-container {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  height: calc(100vh - 3.5rem * 2); 
  overflow-y: auto; 
  display: flex;
  flex-direction: column;
  color: black;
}

.list-title {
  font-size: 1.8rem;
  font-weight: 700;
  margin-bottom: 1.5rem;
  text-align: center;
}

.success-message {
  color: #48bb78;
  background-color: #e5f5e5;
  padding: 1rem;
  border-radius: 8px;
  text-align: center;
  border-left: 4px solid #48bb78;
  margin-bottom: 1rem;
  animation: slideInDown 0.3s ease-out;
}

.error-message {
  background-color: #fcebeb;
  padding: 1rem;
  border-radius: 8px;
  border-left: 4px solid #e53e3e;
  margin-bottom: 1rem;
  animation: slideInDown 0.3s ease-out;
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

@keyframes slideInDown {
  from {
    transform: translateY(-10px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.filters-section {
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.search-box {
  margin-bottom: 1rem;
}

.search-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 0.95rem;
}

.search-input:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
}

.filter-controls {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.filter-select {
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 0.9rem;
  min-width: 150px;
}

.filter-select:focus {
  outline: none;
  border-color: #007bff;
}

.loading-state {
  text-align: center;
  padding: 3rem 1.5rem;
  color: #6b7280;
  font-size: 1rem;
  background-color: #f9fafb;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #e5e7eb;
  border-left-color: #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.artikel-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.artikel-table-responsive {
  overflow-x: auto;
  flex: 1;
}

.artikel-table {
  width: 100%;
  border-collapse: collapse;
  border-radius: 8px;
  overflow: hidden;
}

.artikel-table thead th {
  background-color: #f3f4f6;
  font-weight: 600;
  color: #374151;
  padding: 1rem;
  text-transform: uppercase;
  font-size: 0.85rem;
  border-bottom: 1px solid #e0e0e0;
  position: sticky;
  top: 0;
  z-index: 10;
}

.artikel-table td {
  padding: 1rem;
  border-bottom: 1px solid #e5e7eb;
  font-size: 0.95rem;
  color: #1f2937;
  vertical-align: top;
}

.artikel-table tbody tr:hover {
  background-color: #f9fafb;
}

.title-cell {
  max-width: 300px;
  word-wrap: break-word;
  white-space: normal;
}

.title-content strong {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  word-break: break-word;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: capitalize;
}

.status-badge.published {
  background-color: #d1fae5;
  color: #065f46;
}

.status-badge.draft {
  background-color: #ffeee0;
  color: #FB8312;
}

.action-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.btn {
  padding: 0.4rem 0.8rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-action-edit {
  background-color: #dbeafe;
  color: #1e40af;
}

.btn-action-delete {
  background-color: #fee2e2;
  color: #b91c1c;
}

.btn-action-draft {
  background-color: #ffeee0;
  color: #FB8312;
}

.btn-action-publish {
  background-color: #def7ec;
  color: #047857;
}

.btn:hover:not(:disabled) {
  opacity: 0.85;
  transform: translateY(-1px);
}

.pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1.5rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
}

.btn-pagination {
  background-color: #007bff;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 6px;
}

.btn-pagination:disabled {
  background-color: #6c757d;
}

.page-info {
  font-size: 0.9rem;
  color: #6b7280;
}

.empty-state {
  text-align: center;
  color: #6b7280;
  padding: 3rem 1rem;
  background-color: #f9fafb;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
  opacity: 0.6;
}

.empty-subtitle {
  color: #9ca3af;
  margin-top: 0.5rem;
  display: block;
}

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
  animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
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
  animation: slideInUp 0.3s ease-out;
}

@keyframes slideInUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
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
  transition: background-color 0.2s;
}

.modal-close:hover {
  background-color: #f0f0f0;
}

.modal-body {
  padding: 1.5rem;
  text-align: center;
}

.warning-icon, .info-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.modal-body p {
  margin: 0.5rem 0;
  color: #333;
  line-height: 1.5;
}

.warning-text, .info-text {
  font-size: 0.9rem;
  color: #6b7280;
  margin-top: 1rem;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding: 1.5rem;
  border-top: 1px solid #e0e0e0;
}

.btn-secondary {
  background-color: #f0f0f0;
  color: #555;
  border: 1px solid #ccc;
}

.btn-secondary:hover:not(:disabled) {
  background-color: #e0e0e0;
}

.btn-delete {
  background-color: #dc3545;
  color: white;
}

.btn-delete:hover:not(:disabled) {
  background-color: #c82333;
}

.btn-publish {
  background-color: #28a745;
  color: white;
}

.btn-publish:hover:not(:disabled) {
  background-color: #218838;
}

.btn-draft {
  background-color: #FB8312;
  color: white;
}

.btn-draft:hover:not(:disabled) {
  background-color: #e67e00;
}

@media (max-width: 768px) {
  .artikel-list-container {
    padding: 1rem;
  }
  
  .filter-controls {
    flex-direction: column;
  }
  
  .filter-select {
    min-width: 100%;
  }
  
  .pagination {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }
  
  .action-buttons {
    flex-direction: column;
  }
  
  .modal-content {
    width: 95%;
    margin: 1rem;
  }
  
  .modal-actions {
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .modal-actions .btn {
    width: 100%;
  }
}
</style>
