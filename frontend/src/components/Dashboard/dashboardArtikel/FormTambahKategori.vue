<template>
  <div class="form-container">
    <h2 class="form-title">Kelola Kategori Artikel</h2>

    <form @submit.prevent="handleAddCategory" class="artikel-form">
      <div v-if="successMessage" class="success-message">
        {{ successMessage }}
      </div>
      <div v-if="errorMessage" class="error-message">
        {{ errorMessage }}
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
        <li v-for="(category, index) in categories" :key="index" class="category-item">
          <span v-if="!category.editing">{{ category.name }}</span>
          <input
            v-else
            v-model="category.name"
            @keyup.enter="updateCategory(index)"
            @blur="cancelEdit(index)"
          />
          <div class="action-buttons">
            <button class="btn btn-secondary" @click="enableEdit(index)" v-if="!category.editing">Edit</button>
            <button class="btn btn-primary" @click="updateCategory(index)" v-else>Simpan</button>
            <button class="btn btn-secondary" @click="deleteCategory(index)">Hapus</button>
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const newCategory = ref('');
const categories = ref([
  { name: 'Tutorial', editing: false },
  { name: 'Tips & Trik', editing: false },
  { name: 'Informasi', editing: false },
]);

const successMessage = ref('');
const errorMessage = ref('');
const loading = ref(false);

const handleAddCategory = () => {
  if (!newCategory.value.trim()) {
    errorMessage.value = 'Nama kategori tidak boleh kosong.';
    return;
  }

  const isDuplicate = categories.value.some((cat) =>
    cat.name.toLowerCase() === newCategory.value.trim().toLowerCase()
  );

  if (isDuplicate) {
    errorMessage.value = 'Kategori sudah ada.';
    return;
  }

  categories.value.push({ name: newCategory.value.trim(), editing: false });
  successMessage.value = 'Kategori berhasil ditambahkan.';
  errorMessage.value = '';
  newCategory.value = '';
};

const enableEdit = (index) => {
  categories.value[index].editing = true;
};

const cancelEdit = (index) => {
  categories.value[index].editing = false;
};

const updateCategory = (index) => {
  const updatedName = categories.value[index].name.trim();
  if (!updatedName) {
    errorMessage.value = 'Nama kategori tidak boleh kosong.';
    return;
  }

  const isDuplicate = categories.value.some(
    (cat, i) =>
      i !== index && cat.name.toLowerCase() === updatedName.toLowerCase()
  );

  if (isDuplicate) {
    errorMessage.value = 'Kategori sudah ada.';
    return;
  }

  categories.value[index].editing = false;
  successMessage.value = 'Kategori berhasil diperbarui.';
  errorMessage.value = '';
};

const deleteCategory = (index) => {
  categories.value.splice(index, 1);
  successMessage.value = 'Kategori berhasil dihapus.';
  errorMessage.value = '';
};
</script>

<style scoped>
.form-container {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  width: 100%;
  max-width: 1300px;
  margin: 1.25rem auto;
  height: calc(100vh - 3.5rem * 2); /* agar tinggi total tetap pas */
  overflow-y: auto; /* hanya scroll di kotak putih */
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
}

.btn-primary {
  background-color: #FB8312;
  color: white;
}

.btn-primary:hover {
  background-color: #e67e00;
}

.btn-secondary {
  background-color: #f0f0f0;
  color: #555;
  border: 1px solid #ccc;
}

.btn-secondary:hover {
  background-color: #e0e0e0;
}

.success-message {
  color: #48bb78;
  background-color: #e5f5e5;
  padding: 1rem;
  border-radius: 4px;
  text-align: center;
}

.error-message {
  color: #e53e3e;
  background-color: #fcebeb;
  padding: 1rem;
  border-radius: 4px;
  text-align: center;
}

@media (max-width: 600px) {
  .form-container {
    padding: 1.5rem;
    margin: 1rem auto;
  }
}
</style>
