<template>
  <div class="artikel-list-container">
    <h2 class="list-title">Daftar Artikel</h2>

    <div v-if="articles.length" class="artikel-table-responsive">
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
            <td>{{ article.title }}</td>
            <td>{{ article.author }}</td>
            <td>{{ article.category }}</td>
            <td>{{ formatDate(article.createdAt) }}</td>
            <td>
              <span :class="['status-badge', { 'draft': article.status === 'draft', 'published': article.status === 'published' }]">
                {{ article.status }}
              </span>
            </td>
            <td>
              <div class="action-buttons">
                <button @click="handleEdit(article.id)" class="btn btn-action-edit">Edit</button>
                <button @click="handleDelete(article.id)" class="btn btn-action-delete">Hapus</button>
                <button v-if="article.status === 'published'" @click="handleDraft(article.id)" class="btn btn-action-draft">Draft</button>
                <button v-if="article.status === 'draft'" @click="handlePublish(article.id)" class="btn btn-action-publish">Publish</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-else class="empty-state">
      <p>Tidak ada artikel yang ditemukan.</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const articles = ref([
  {
    id: '1',
    title: 'Tips and Tricks for Studying More Effectively',
    author: 'Bimbel Mandala Tim',
    category: 'Tutorial',
    createdAt: '2025-07-20T10:00:00Z',
    status: 'published',
  },
  {
    id: '2',
    title: 'New Updates on Bimbel Mandala Programs for 2025',
    author: 'Admin Bimbel',
    category: 'Informasi',
    createdAt: '2025-07-18T14:30:00Z',
    status: 'published',
  },
  {
    id: '3',
    title: 'Mastering Time Management for Students',
    author: 'Tutor Edukasi',
    category: 'Tips & Trik',
    createdAt: '2025-07-15T09:15:00Z',
    status: 'draft',
  },
]);

const formatDate = (dateString) => {
  if (!dateString) return '';
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(dateString).toLocaleDateString('id-ID', options);
};

const handleEdit = (id) => {
  alert(`Mengedit artikel dengan ID: ${id}`);
};

const handleDelete = (id) => {
  if (confirm(`Apakah Anda yakin ingin menghapus artikel dengan ID: ${id}?`)) {
    articles.value = articles.value.filter(article => article.id !== id);
    alert('Artikel berhasil dihapus!');
  }
};

const handleDraft = (id) => {
  const article = articles.value.find(a => a.id === id);
  if (article) {
    article.status = 'draft';
    alert('Artikel berhasil diarsipkan ke draft!');
  }
};

const handlePublish = (id) => {
  const article = articles.value.find(a => a.id === id);
  if (article) {
    article.status = 'published';
    alert('Artikel berhasil dipublikasikan!');
  }
};
</script>

<style scoped>
.artikel-list-container {
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

.list-title {
  font-size: 1.8rem;
  font-weight: 700;
  margin-bottom: 1.5rem;
  text-align: center;
}

.artikel-table-responsive {
  overflow-x: auto;
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
}

.artikel-table td {
  padding: 1rem;
  border-bottom: 1px solid #e5e7eb;
  font-size: 0.95rem;
  color: #1f2937;
}

.artikel-table tbody tr:hover {
  background-color: #f9fafb;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: capitalize;
}

.status-badge.published {
  background-color: #d1fae5;
  color: #065f46;
}

.status-badge.draft {
  background-color: #fee2e2;
  color: #991b1b;
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
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
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
  background-color: #e0e7ff;
  color: #3730a3;
}

.btn-action-publish {
  background-color: #def7ec;
  color: #047857;
}

.btn:hover {
  opacity: 0.85;
}

.empty-state {
  text-align: center;
  color: #6b7280;
  padding: 2rem 1rem;
}
</style>
