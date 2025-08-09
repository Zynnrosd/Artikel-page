<template>
  <div class="form-container">
    <h2 class="form-title">Kelola Author Artikel</h2>

    <form @submit.prevent="handleAddAuthor" class="artikel-form">
      <div v-if="successMessage" class="success-message">
        {{ successMessage }}
      </div>
      <div v-if="errorMessage" class="error-message">
        {{ errorMessage }}
      </div>

      <div class="form-group">
        <label for="new-author">Tambah Author Baru:</label>
        <input type="text" id="new-author" v-model="newAuthor" placeholder="Nama author" required />
      </div>

      <div class="form-actions">
        <button type="submit" class="btn btn-primary" :disabled="loading">
          {{ loading ? 'Menambahkan...' : 'Tambah Author' }}
        </button>
      </div>
    </form>

    <div class="divider"></div>

    <div class="existing-authors">
      <h3 class="subtitle">Author yang Sudah Ada</h3>
      <ul class="author-list">
        <li v-for="(author, index) in authors" :key="index" class="author-item">
          <span v-if="!author.editing">{{ author.name }}</span>
          <input
            v-else
            v-model="author.name"
            @keyup.enter="updateAuthor(index)"
            @blur="cancelEdit(index)"
          />
          <div class="action-buttons">
            <button class="btn btn-edit" @click="enableEdit(index)" v-if="!author.editing"> Edit </button>
            <button class="btn btn-save" @click="updateAuthor(index)" v-else> Simpan </button>
            <button class="btn btn-delete" @click="deleteAuthor(index)" > Hapus </button>
          </div>
          
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const newAuthor = ref('');
const authors = ref([
  { name: 'Farhan', editing: false },
  { name: 'Farhan Nasrullah', editing: false },
  { name: 'Rafie', editing: false },
  { name: 'Yanto', editing: false },
]);

const successMessage = ref('');
const errorMessage = ref('');
const loading = ref(false);

const handleAddAuthor = () => {
  if (!newAuthor.value.trim()) {
    errorMessage.value = 'Nama Author tidak boleh kosong.';
    return;
  }

  const isDuplicate = authors.value.some((auth) =>
    auth.name.toLowerCase() === newAuthor.value.trim().toLowerCase()
  );

  if (isDuplicate) {
    errorMessage.value = 'Author sudah ada.';
    return;
  }

  authors.value.push({ name: newAuthor.value.trim(), editing: false });
  successMessage.value = 'Author berhasil ditambahkan.';
  errorMessage.value = '';
  newAuthor.value = '';
};

const enableEdit = (index) => {
  authors.value[index].editing = true;
};

const cancelEdit = (index) => {
  authors.value[index].editing = false;
};

const updateAuthor = (index) => {
  const updatedName = authors.value[index].name.trim();
  if (!updatedName) {
    errorMessage.value = 'Nama Author tidak boleh kosong.';
    return;
  }

  const isDuplicate = authors.value.some(
    (auth, i) =>
      i !== index && auth.name.toLowerCase() === updatedName.toLowerCase()
  );

  if (isDuplicate) {
    errorMessage.value = 'Author sudah ada.';
    return;
  }

  authors.value[index].editing = false;
  successMessage.value = 'Author berhasil diperbarui.';
  errorMessage.value = '';
};

const deleteAuthor = (index) => {
  if (confirm(`Apakah Anda yakin ingin menghapus author '${authors.value[index].name}'?`)) {
    authors.value.splice(index, 1);
    successMessage.value = 'Author berhasil dihapus.';
    errorMessage.value = '';
  }
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

.existing-authors ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.author-list {
  list-style: none;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.author-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #f7f7f7;
  padding: 0.75rem 1rem;
  border-radius: 6px;
  margin-bottom: 0.5rem;
  gap: 1rem;
}

.author-item input[type="text"] {
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

.btn-edit {
  background-color: #e0f4ff;
  color: #007BFF;
  font-weight: 500;
  border: none;
  border-radius: 25px;
  padding: 0.5rem 1.2rem;
  transition: all 0.2s ease;
}

.btn-edit:hover {
  background-color: #cce9ff;
}

.btn-save {
  background-color: #FB8312;
  color: white;
  font-weight: bold;
  border: none;
  border-radius: 25px;
  padding: 0.5rem 1.2rem;
  transition: background-color 0.2s ease;
}

.btn-save:hover {
  background-color: #e67e00;
}

.btn-delete {
  background-color: #ffecec;
  color: #e53e3e;
  font-weight: 500;
  border: none;
  border-radius: 25px;
  padding: 0.5rem 1.2rem;
  transition: background-color 0.2s ease;
}

.btn-delete:hover {
  background-color: #ffdede;
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
  .add-category-form {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>