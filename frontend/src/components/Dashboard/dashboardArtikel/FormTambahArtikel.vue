<template>
  <div class="form-container">
    <div class="form-header">
      <h1 class="form-title">Buat Artikel Baru</h1>
      <p class="form-subtitle">Bagikan cerita dan pengetahuan Anda dengan dunia</p>
    </div>

    <Transition name="slide-down">
      <div v-if="successMessage" class="alert alert-success">
        <div class="alert-content">
          <svg class="alert-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="20,6 9,17 4,12"/>
          </svg>
          {{ successMessage }}
        </div>
      </div>
    </Transition>

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
      </div>
    </Transition>

    <form @submit.prevent="handleSubmit" class="artikel-form">
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
              <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
            </select>
          </div>
        </div>

        <div class="form-group full-width">
          <label for="image" class="form-label">
            <span class="label-text">Gambar Utama</span>
            <span class="label-required">*</span>
          </label>
          <div class="image-upload-container">
            <div class="upload-area" :class="{ 'has-image': imagePreview }">
              <input 
                type="file" 
                id="image" 
                @change="handleImageFileChange" 
                accept="image/*" 
                class="file-input"
              />
              <div v-if="!imagePreview" class="upload-placeholder">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                  <circle cx="9" cy="9" r="2"/>
                  <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
                </svg>
                <p class="upload-text">Klik untuk upload gambar</p>
                <p class="upload-subtext">PNG, JPG, GIF hingga 1MB</p>
              </div>
              <div v-if="imagePreview" class="image-preview">
                <img :src="imagePreview" alt="Pratinjau Gambar" />
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

          <EditorTiny v-model="form.content" />

          <div 
            v-if="form.content" 
            v-html="form.content" 
            class="preview-output mt-4 p-4 bg-gray-50 border rounded">
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
          {{ loading ? 'Menyimpan...' : 'Publikasikan Artikel' }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';

const router = useRouter();

const form = ref({
  title: '',
  author: '',
  category: '',
  content: '',
  imageFile: null,
});

const authors = ref([
  { id: 1, name: 'Farhan' },
  { id: 2, name: 'Nasrullah' },
  { id: 3, name: 'Rafie' },
]);

const categories = ref([
  { id: 1, name: 'Tutorial' },
  { id: 2, name: 'Informasi' },
  { id: 3, name: 'Tips & Trik' }
]);

const imagePreview = ref(null);
const loading = ref(false);

const successMessage = ref('');
const errorMessage = ref('');
onMounted(() => {
  successMessage.value = '';
  errorMessage.value = '';
});

const wordCount = computed(() => {
  return form.value.content.trim().split(/\s+/).filter(word => word.length > 0).length;
});

const handleImageFileChange = (event) => {
  const file = event.target.files[0];
  if (file) {
    if (file.size > 1 * 1024 * 1024) {
  errorMessage.value = 'Ukuran file gambar tidak boleh lebih dari 1MB.';
  return;
}
  const validTypes = ['image/png', 'image/jpeg', 'image/jpg'];
  if (!validTypes.includes(file.type)) {    errorMessage.value = 'Format gambar harus PNG, JPG, atau JPEG.';
  return;
}
    
    form.value.imageFile = file;
    const reader = new FileReader();
    reader.onload = (e) => {
      imagePreview.value = e.target.result;
    };
    reader.readAsDataURL(file);
  } else {
    form.value.imageFile = null;
    imagePreview.value = null;
  }
  errorMessage.value = '';
};

const removeImage = () => {
  form.value.imageFile = null;
  imagePreview.value = null;
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
  
  if (!form.value.imageFile) {
    errorMessage.value = 'Gambar utama wajib diupload.';
    loading.value = false;
    return;
  }

  const formData = new FormData();
  formData.append('title', form.value.title.trim());
  formData.append('author', form.value.author.trim());
  formData.append('category', form.value.category);
  formData.append('content', form.value.content.trim());
  formData.append('mainImage', form.value.imageFile);

  const token = localStorage.getItem('token');

  try {
    const response = await axios.post('/api/articles', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        ...(token && { 'Authorization': `Bearer ${token}` })
      },
    });

    successMessage.value = 'Artikel berhasil dipublikasikan! 🎉';
    console.log('Artikel berhasil ditambahkan:', response.data);
    
    form.value = {
      title: '',
      author: '',
      category: '',
      content: '',
      imageFile: null,
    };
    imagePreview.value = null;
    document.getElementById('image').value = '';
    
    setTimeout(() => {
      router.push('/dashboard/articles');
    }, 2000);
    
  } catch (error) {
    console.error('Gagal menambahkan artikel:', error);
    errorMessage.value = error.response?.data?.message || 'Terjadi kesalahan saat menyimpan artikel. Silakan coba lagi.';
  } finally {
    loading.value = false;
  }
};

const goBack = () => {
  router.go(-1);
};
</script>

<style scoped>
.page-landscape {
  display: flex;
  flex-direction: row;
  height: 100vh;
  overflow: hidden;
}

.sidebar-wrapper {
  width: 250px;
  background-color: #0B2343;
  height: 100%;
}

.form-landscape-container {
  flex: 1;
  padding: 2rem;
  background-color: #f0f2f5;
  display: flex;
  justify-content: center;
  align-items: flex-start; 
  min-height: 100vh;
  box-sizing: border-box;
}

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

.alert {
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1.5rem;
  border: 1px solid;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.alert-icon {
  flex-shrink: 0;
}

.alert-success {
  background-color: #F0FFF4;
  border-color: #68D391;
  color: #22543D;
}

.alert-error {
  background-color: #FED7D7;
  border-color: #F56565;
  color: #742A2A;
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

.editor-wrapper {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  overflow: hidden;
  background-color: white;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.editor-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 1rem;
  background-color: #f8f9fa;
  border-bottom: 1px solid #e2e8f0;
}

.toolbar-group {
  display: flex;
  gap: 0.25rem;
}

.toolbar-btn {
  background: none;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 0.5rem;
  cursor: pointer;
  color: #4a5568;
  transition: all 0.2s ease;
}

.toolbar-btn:hover {
  background-color: #edf2f7;
  border-color: #cbd5e0;
}

.word-count {
  font-size: 0.8rem;
  color: #718096;
  font-weight: 500;
}

.form-textarea {
  width: 100%;
  padding: 1rem;
  border: none;
  resize: vertical;
  font-size: 1rem;
  line-height: 1.6;
  min-height: 250px;
  box-sizing: border-box;
  background-color: white;
  overflow-y: auto; 
}

.form-textarea:focus {
  outline: none;
}

.editor-footer {
  padding: 0.5rem 1rem;
  background-color: #f8f9fa;
  border-top: 1px solid #e2e8f0;
}

.editor-note {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #718096;
  font-size: 0.8rem;
}

.editor-note svg {
  color: #48bb78;
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
  .page-wrapper {
    padding: 1rem 0.5rem;
  }
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