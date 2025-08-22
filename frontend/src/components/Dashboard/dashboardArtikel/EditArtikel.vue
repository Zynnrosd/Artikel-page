<template>
  <div class="form-container">
    <div class="form-header">
      <h1 class="form-title">Edit Artikel</h1>
      <p class="form-subtitle">Perbarui artikel Anda</p>
    </div>

    <!-- Success Message -->
    <Transition name="slide-down">
      <div v-if="successMessage" class="alert alert-success">
        <div class="alert-content">
          <svg class="alert-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="20,6 9,17 4,12"/>
          </svg>
          {{ successMessage }}
        </div>
        <button type="button" @click="clearSuccessMessage" class="alert-close-btn">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
    </Transition>

    <!-- Error Message -->
    <Transition name="slide-down">
      <div v-if="errorMessage" class="alert alert-error">
        <div class="alert-content">
          <svg class="alert-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="15" y1="9" x2="9" y2="15"/>
            <line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
          {{ errorMessage }}
        </div>
        <button type="button" @click="clearErrorMessage" class="alert-close-btn">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
    </Transition>

    <!-- Loading State -->
    <div v-if="loadingArticle" class="loading-state">
      <p>Memuat data artikel...</p>
    </div>

    <form v-else @submit.prevent="handleSubmit" class="artikel-form">
      <div class="form-grid">
        <div class="form-group full-width">
          <label for="title" class="form-label">
            <span class="label-text">Judul Artikel</span>
            <span class="label-required">*</span>
          </label>
          <div class="input-wrapper">
            <input 
              type="text" 
              id="title" 
              v-model="form.title" 
              placeholder="Masukkan judul artikel yang menarik..."
              class="form-input"
              required 
            />
          </div>
        </div>

        <div class="form-group">
          <label for="author" class="form-label">
            <span class="label-text">Penulis</span>
            <span class="label-required">*</span>
          </label>
          <div class="input-wrapper">
            <select id="author" v-model="form.author" class="form-select" required>
              <option value="" disabled>Pilih Penulis</option>
              <option v-for="author in authors" :key="author.id" :value="author.name">
                {{ author.name }}
              </option>
            </select>
          </div>
        </div>

        <div class="form-group">
          <label for="category" class="form-label">
            <span class="label-text">Kategori</span>
            <span class="label-required">*</span>
          </label>
          <div class="select-wrapper">
            <select id="category" v-model="form.category" class="form-select" required>
              <option value="" disabled>Pilih Kategori</option>
              <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
            </select>
          </div>
        </div>

        <div class="form-group full-width">
          <label for="image" class="form-label">
            <span class="label-text">Gambar Utama</span>
            <span class="label-optional">*</span>
          </label>
          <div class="image-upload-container">
            <div class="upload-area" :class="{ 'has-image': imagePreview || currentImage }">
              <input 
                type="file" 
                id="image" 
                @change="handleImageFileChange" 
                accept="image/*" 
                class="file-input"
              />
              <div v-if="!imagePreview && !currentImage" class="upload-placeholder">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                  <circle cx="9" cy="9" r="2"/>
                  <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
                </svg>
                <p class="upload-text">Klik untuk upload gambar baru</p>
                <p class="upload-subtext">PNG, JPG, GIF hingga 1MB</p>
              </div>
              <div v-if="imagePreview || currentImage" class="image-preview">
                <img :src="imagePreview || getImageUrl(currentImage)" alt="Pratinjau Gambar" />
                <div class="image-overlay">
                  <button type="button" @click="removeImage" class="remove-image-btn">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <line x1="18" y1="6" x2="6" y2="18"/>
                      <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="form-group full-width">
          <label for="content" class="form-label">
            <span class="label-text">Isi Artikel</span>
            <span class="label-required">*</span>
          </label>
          <EditorQuill v-model="form.content" />
        </div>

        <!-- Status Publikasi - FIXED: Moved to better position -->
        <div class="form-group full-width status-section">
          <label class="form-label">
            <span class="label-text">Status Publikasi</span>
          </label>
          <div class="status-toggle">
            <label class="toggle-option">
              <input type="radio" v-model="form.status" value="draft" />
              <span class="radio-custom"></span>
              <span class="option-text">Draft</span>
            </label>
            <label class="toggle-option">
              <input type="radio" v-model="form.status" value="published" />
              <span class="radio-custom"></span>
              <span class="option-text">Dipublikasikan</span>
            </label>
          </div>
        </div>

      </div>

      <div class="form-actions">
        <button type="button" @click="goBack" class="btn btn-secondary">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="m12 19-7-7 7-7"/>
            <path d="M19 12H5"/>
          </svg>
          Batal
        </button>
        <button type="submit" class="btn btn-primary" :disabled="loading">
          <svg v-if="loading" class="loading-spinner" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 12a9 9 0 11-6.219-8.56"/>
          </svg>
          <svg v-else xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/>
            <polyline points="17,21 17,13 7,13 7,21"/>
            <polyline points="7,3 7,8 15,8"/>
          </svg>
          {{ loading ? 'Menyimpan...' : 'Simpan Artikel' }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import axios from 'axios';
import EditorQuill from '@/components/artikel/EditorQuill.vue';


const props = defineProps({
  id: {
    type: [String, Number],
    required: true
  }
});

const router = useRouter();
const route = useRoute();

const form = ref({
  title: '',
  author: '',
  category: '',
  content: '',
  status: 'draft',
  imageFile: null,
});

const authors = ref([]);
const categories = ref([]);
const currentImage = ref(null); 
const imagePreview = ref(null); 
const loading = ref(false);
const loadingArticle = ref(true);
const originalArticle = ref(null);

const successMessage = ref('');
const errorMessage = ref('');


const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';


const articleId = computed(() => {
  return props.id || route.params.id;
});


const clearSuccessMessage = () => {
  successMessage.value = '';
};

const clearErrorMessage = () => {
  errorMessage.value = '';
};


const getAuthHeaders = () => {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};


const getImageUrl = (imageName) => {
  if (!imageName) return null;
  return `${API_BASE}/uploads/${imageName}`;
};


const fetchArticle = async () => {
  try {
    loadingArticle.value = true;
    console.log('Fetching article with ID:', articleId.value);

    const response = await axios.get(`${API_BASE}/admin/articles/${articleId.value}`, {
      headers: getAuthHeaders()
    });

    if (response.data.success) {
      const article = response.data.data;
      originalArticle.value = article;
      
   
      form.value = {
        title: article.title || '',
        author: article.author || '',
        category: article.category_id || '',
        content: article.content || '',
        status: article.is_published ? 'published' : 'draft',
        imageFile: null
      };

      currentImage.value = article.featured_image;
      
      console.log('Article loaded successfully:', article.title);
      console.log('Form populated:', form.value);
    }
  } catch (error) {
    console.error('Error fetching article:', error);
    
    if (error.response?.status === 404) {
      errorMessage.value = 'Artikel tidak ditemukan.';
    } else if (error.response?.status === 401) {
      errorMessage.value = 'Sesi Anda telah berakhir. Silakan login kembali.';
      localStorage.removeItem('token');
      sessionStorage.removeItem('token');
      router.push('/login');
    } else {
      errorMessage.value = 'Gagal memuat data artikel.';
    }
  } finally {
    loadingArticle.value = false;
  }
};


const fetchAuthorsAndCategories = async () => {
  try {
    const [authorsResponse, categoriesResponse] = await Promise.all([
      axios.get(`${API_BASE}/admin/authors`, { headers: getAuthHeaders() }),
      axios.get(`${API_BASE}/admin/categories`, { headers: getAuthHeaders() })
    ]);

    if (authorsResponse.data.success) {
      authors.value = authorsResponse.data.data;
    }

    if (categoriesResponse.data.success) {
      categories.value = categoriesResponse.data.data;
    }
  } catch (error) {
    console.error('Error fetching authors or categories:', error);
    errorMessage.value = 'Gagal memuat data penulis atau kategori.';
  }
};


const handleImageFileChange = (event) => {
  const file = event.target.files[0];
  if (file) {
    if (file.size > 1 * 1024 * 1024) {
      errorMessage.value = 'Ukuran file gambar tidak boleh lebih dari 1MB.';
     
      event.target.value = '';
      return;
    }
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      errorMessage.value = 'Format gambar harus PNG, JPG, atau JPEG.';
     
      event.target.value = '';
      return;
    }
    
   
    errorMessage.value = '';
    
    form.value.imageFile = file;
    const reader = new FileReader();
    reader.onload = (e) => {
      imagePreview.value = e.target.result;
      currentImage.value = null; 
    };
    reader.readAsDataURL(file);
  } else {
    form.value.imageFile = null;
    imagePreview.value = null;
    
    errorMessage.value = '';
  }
};


const removeImage = () => {
  form.value.imageFile = null;
  imagePreview.value = null;
  currentImage.value = null;
  document.getElementById('image').value = '';
};


const handleSubmit = async () => {
  loading.value = true;
  successMessage.value = '';
  errorMessage.value = '';

 
  if (!form.value.title.trim()) {
    errorMessage.value = 'Judul artikel tidak boleh kosong.';
    loading.value = false;
    return;
  }

  if (!form.value.author.trim()) {
    errorMessage.value = 'Nama penulis tidak boleh kosong.';
    loading.value = false;
    return;
  }

  if (!form.value.category) {
    errorMessage.value = 'Silakan pilih kategori artikel.';
    loading.value = false;
    return;
  }

  if (!form.value.content.trim()) {
    errorMessage.value = 'Isi artikel tidak boleh kosong.';
    loading.value = false;
    return;
  }


  if (!currentImage.value && !form.value.imageFile) {
    errorMessage.value = 'Gambar utama wajib ada.';
    loading.value = false;
    return;
  }

  const formData = new FormData();
  formData.append('title', form.value.title.trim());
  formData.append('author', form.value.author.trim());
  formData.append('category', form.value.category);
  formData.append('content', form.value.content.trim());
  formData.append('status', form.value.status);


  if (form.value.imageFile) {
    formData.append('mainImage', form.value.imageFile);
  }

  const token = localStorage.getItem('token');

  try {
    const response = await axios.put(`${API_BASE}/admin/articles/${articleId.value}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        ...(token && { 'Authorization': `Bearer ${token}` })
      }
    });

    successMessage.value = 'Artikel berhasil diperbarui! 🎉';
    console.log('Artikel berhasil diperbarui:', response.data);

    setTimeout(() => {
      router.push('/dashboardadmin/artikel/daftar');
    }, 2000);

  } catch (error) {
    console.error('Gagal memperbarui artikel:', error);
    
    if (error.response?.status === 404) {
      errorMessage.value = 'Artikel tidak ditemukan.';
    } else if (error.response?.status === 401) {
      errorMessage.value = 'Sesi Anda telah berakhir. Silakan login kembali.';
      localStorage.removeItem('token');
      sessionStorage.removeItem('token');
      router.push('/login');
    } else {
      errorMessage.value = error.response?.data?.message || 'Terjadi kesalahan saat menyimpan artikel.';
    }
  } finally {
    loading.value = false;
  }
};


const goBack = () => {
  router.push('/dashboardadmin/artikel/daftar');
};
 
onMounted(async () => {
 
  console.log('Component mounted with article ID:', articleId.value);
  console.log('Props.id:', props.id);
  console.log('Route params:', route.params);
  
 
  await fetchAuthorsAndCategories();
 
  await fetchArticle();
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
  height: calc(100vh - 2.5rem * 2);
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.form-header {
  text-align: center;
  margin-bottom: 2rem;
}

.form-title {
  font-size: 2rem;
  font-weight: 700;
  color: #1a202c;
  margin: 0;
}

.form-subtitle {
  color: #718096;
  font-size: 1rem;
  margin: 0;
}

.loading-state {
  text-align: center;
  padding: 3rem 1.5rem;
  color: #6b7280;
  font-size: 1rem;
  background-color: #f9fafb;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}

.alert {
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1.5rem;
  border: 1px solid;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  position: relative;
}

.alert-content {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
}

.alert-icon {
  flex-shrink: 0;
}

.alert-close-btn {
  background: none;
  border: none;
  color: inherit;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  transition: background-color 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.alert-close-btn:hover {
  background-color: rgba(0, 0, 0, 0.1);
}

.alert-success {
  background-color: #F0FFF4;
  border-color: #68D391;
  color: #22543D;
}

.alert-success .alert-close-btn:hover {
  background-color: rgba(34, 84, 61, 0.1);
}

.alert-error {
  background-color: #FED7D7;
  border-color: #F56565;
  color: #742A2A;
}

.alert-error .alert-close-btn:hover {
  background-color: rgba(116, 42, 42, 0.1);
}

.artikel-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group.full-width {
  grid-column: 1 / -1;
}


.status-section {
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e2e8f0;
}

.form-label {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-weight: 600;
  color: #2D3748;
  font-size: 0.9rem;
}

.label-required {
  color: #E53E3E;
  font-weight: 700;
}

.label-optional {
  color: #718096;
  font-weight: 400;
  font-size: 0.8rem;
}

.input-wrapper, .select-wrapper {
  position: relative;
}

.form-input {
  width: 100%;
  padding: 0.8rem 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.2s ease;
  background-color: #f7fafc;
}

.form-input:focus {
  outline: none;
  border-color: #FB8312;
  box-shadow: 0 0 0 2px rgba(251, 131, 18, 0.2);
}

.form-select {
  width: 100%;
  padding: 0.8rem 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 1rem;
  background-color: #f7fafc;
  transition: all 0.2s ease;
  cursor: pointer;
}

.form-select:focus {
  outline: none;
  border-color: #FB8312;
  box-shadow: 0 0 0 2px rgba(251, 131, 18, 0.2);
}

.image-upload-container {
  width: 100%;
}

.upload-area {
  position: relative;
  border: 2px dashed #cbd5e0;
  border-radius: 12px;
  padding: 2rem;
  text-align: center;
  transition: all 0.2s ease;
  background: #fafbfc;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.upload-area:hover {
  border-color: #fb8312;
  background: #fff8f5;
}

.upload-area.has-image {
  padding: 0;
  border: none;
  background: none;
}

.file-input {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
}

.upload-placeholder svg {
  color: #a0aec0;
  margin-bottom: 0.5rem;
}

.upload-text {
  font-size: 1rem;
  font-weight: 600;
  color: #4a5568;
  margin: 0;
}

.upload-subtext {
  color: #718096;
  font-size: 0.85rem;
  margin: 0;
}

.image-preview {
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 10px rgba(0,0,0,0.1);
  margin-top: 0.5rem;
}

.image-preview img {
  width: 100%;
  height: auto;
  max-height: 250px;
  object-fit: cover;
  display: block;
}

.image-overlay {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
}

.remove-image-btn {
  background: rgba(0, 0, 0, 0.5);
  color: white;
  border: none;
  border-radius: 50%;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.remove-image-btn:hover {
  background: #e53e3e;
}


.status-toggle {
  display: flex;
  gap: 2rem;
  margin-top: 1rem;
  padding: 1rem;
  background-color: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.toggle-option {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 500;
  color: #4a5568;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.toggle-option:hover {
  background-color: rgba(251, 131, 18, 0.1);
}

.toggle-option input[type="radio"] {
  display: none;
}

.radio-custom {
  width: 20px;
  height: 20px;
  border: 2px solid #cbd5e0;
  border-radius: 50%;
  position: relative;
  transition: all 0.2s ease;
}

.toggle-option input[type="radio"]:checked + .radio-custom {
  border-color: #fb8312;
  background-color: #fb8312;
}

.toggle-option input[type="radio"]:checked + .radio-custom::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 8px;
  height: 8px;
  background-color: white;
  border-radius: 50%;
  transform: translate(-50%, -50%);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 2rem;
}

.btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.8rem 1.8rem;
  border: none;
  border-radius: 25px;
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.3s ease;
  text-decoration: none;
  position: relative;
  overflow: hidden;
}

.btn-primary {
  background-color: #FB8312;
  color: white;
  box-shadow: 0 4px 15px rgba(251, 131, 18, 0.4);
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(251, 131, 18, 0.5);
}

.btn-primary:disabled {
  background-color: #CBD5E0;
  color: #A0AEC0;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.btn-secondary {
  background-color: white;
  color: #4A5568;
  border: 1px solid #E2E8F0;
}

.btn-secondary:hover {
  background-color: #F7FAFC;
  border-color: #CBD5E0;
  transform: translateY(-1px);
}

.loading-spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s ease;
}

.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

@media (max-width: 768px) {
  .form-container {
    padding: 2rem 1.5rem;
    border-radius: 16px;
  }
  .form-grid {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
  .form-actions {
    flex-direction: column-reverse;
  }
  .btn {
    width: 100%;
  }
  .status-toggle {
    flex-direction: column;
    gap: 1rem;
  }
}

@media (max-width: 480px) {
  .form-container {
    padding: 1.5rem 1rem;
    margin: 1rem auto;
  }
  .form-title {
    font-size: 1.8rem;
  }
}
</style>