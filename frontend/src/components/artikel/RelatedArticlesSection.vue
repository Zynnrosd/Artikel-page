<template>
  <div class="related-articles-section">
    <h2 class="section-title">Artikel Lainnya</h2>
    <div v-if="relatedArticles.length" class="articles-list">
      <div v-for="relatedArticle in relatedArticles" :key="relatedArticle.id" class="article-card" @click="goToArticleDetail(relatedArticle.id)">
        <div class="article-image-container">
          <img :src="relatedArticle.image || 'https://via.placeholder.com/350x200?text=Artikel+Terkait'" :alt="relatedArticle.title" class="article-image" />
        </div>
        <div class="article-content">
          <h3 class="article-title">{{ relatedArticle.title }}</h3>
          <p class="article-description">{{ relatedArticle.description }}</p> <div class="article-meta-list"> <span class="article-date">{{ formatDate(relatedArticle.createdAt) }}</span>
          </div>
          </div>
      </div>
    </div>
    <div v-else class="empty-state-related">
      <p>Tidak ada artikel terkait.</p>
    </div>
  </div>
</template>

<script setup>
import { defineProps } from 'vue';
import { useRouter } from 'vue-router'; 

const props = defineProps({
  relatedArticles: {
    type: Array,
    required: true,
  },
});

const emit = defineEmits(['readMoreRelated']); // Event ini masih dipancarkan oleh card @click
const router = useRouter(); 

const goToArticleDetail = (id) => {
  router.push(`/artikel/${id}`);
  window.scrollTo({ top: 0, behavior: 'smooth' }); // Scroll ke atas saat pindah artikel
};

// Fungsi format tanggal
const formatDate = (dateString) => {
  if (!dateString) return '';
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(dateString).toLocaleDateString('id-ID', options);
};
</script>

<style scoped>
.related-articles-section {
  padding: 1.5rem; /* Padding internal konsisten */
  background-color: white;
  border-radius: 8px; /* Sudut frame */
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1); /* Disesuaikan: Shadow lebih menonjol */
}

.section-title {
  font-size: 1.2rem;
  color: #333;
  margin-bottom: 1rem; /* Jarak ke list */
  font-weight: 600;
  text-align: left;
  padding-bottom: 0.5rem; /* Disesuaikan: Padding bawah untuk garis */
  border-bottom: 1px solid #eee; /* Disesuaikan: Garis bawah */
}

.articles-list {
  display: grid;
  grid-template-columns: 2fr; /* Satu kolom untuk sidebar */
  gap: 1rem; /* Disesuaikan: Jarak antar kartu lebih jelas */
}

.article-card {
  background-color: #fcfcfc; /* Latar belakang kartu item lebih terang */
  border-radius: 8px; /* Sudut membulat */
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08); /* Disesuaikan: Shadow awal yang lebih jelas */
  transition: box-shadow 0.2s ease, transform 0.2s ease; /* Transisi untuk hover */
  cursor: pointer;
  display: flex;
  flex-direction: column;
  height: 100%; /* Memastikan tinggi konsisten */
}

.article-card:hover {
  box-shadow: 0 6px 15px rgba(0, 0, 0, 0.15); /* Disesuaikan: Shadow lebih kuat saat hover */
  transform: translateY(-3px); /* Efek timbul yang lebih jelas */
}

.article-image-container {
  width: 100%;
  height: 120px; /* Tinggi gambar terkait */
  overflow: hidden;
  background-color: #e0e0e0;
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
}

.article-image {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.article-content {
  padding: 0.8rem;
  display: flex;
  flex-direction: column;
  gap: 0.3rem; /* Jarak antar elemen konten */
  flex-grow: 1; /* Konten mengisi sisa ruang */
}

.article-title {
  font-size: 0.9rem; /* Ukuran judul terkait */
  color: #333;
  margin-bottom: 0.2rem;
  font-weight: 600; /* Disesuaikan: Lebih tebal */
  line-height: 1.3;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2; /* Batasi 2 baris */
  -webkit-box-orient: vertical;
  line-clamp: 2;
  height: calc(0.9rem * 1.3 * 2); /* Tinggi eksplisit untuk 2 baris */
}

.article-description {
  display: -webkit-box; /* Disesuaikan: Tampilkan deskripsi */
  font-size: 0.8rem;
  color: #777;
  margin-bottom: 0.6rem;
  line-height: 1.4;
  -webkit-line-clamp: 2; /* Disesuaikan: Batasi 2 baris */
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  height: calc(0.8rem * 1.4 * 2); /* Tinggi eksplisit untuk 2 baris */
  flex-grow: 1; /* Biarkan mengisi ruang */
}

.article-meta-list { /* Container untuk tanggal */
  font-size: 0.75rem;
  color: #888;
  margin-top: 0.4rem;
  margin-bottom: 0.4rem; /* Jarak bawah lebih kecil */
}

.read-more-button { /* Styling untuk tombol Baca Selengkapnya */
  background-color: #154484; /* Biru dongker */
  color: white;
  padding: 0.4rem 0.8rem; /* Disesuaikan: Padding lebih kecil */
  border-radius: 4px;
  font-size: 0.7rem; /* Disesuaikan: Ukuran font lebih kecil */
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  width: 100%;
  text-align: center;
  margin-top: auto; /* Dorong ke bawah */
}

.read-more-button:hover {
  background-color: #0d2e5e;
}

.empty-state-related {
  padding: 1rem;
  text-align: center;
  color: #777;
  font-size: 0.85rem;
}

/* Responsive adjustments */
@media (max-width: 981px) {
  .related-articles-section {
    padding: 1.2rem;
  }
  .section-title {
    font-size: 1.1rem;
  }
  .articles-list {
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 0.8rem;
  }
  .article-card {
    max-width: 100%;
  }
  .article-image-container {
    height: 80px;
  }
  .article-content {
    padding: 0.6rem;
  }
  .article-title {
    font-size: 0.8rem;
    height: calc(0.8rem * 1.3 * 2);
  }
  .article-description {
    font-size: 0.75rem;
    height: calc(0.75rem * 1.4 * 2); /* Disesuaikan: Tinggi eksplisit untuk 2 baris */
    display: -webkit-box;
    -webkit-line-clamp: 2; /* Batasi deskripsi menjadi 2 baris */
    -webkit-box-orient: vertical;
    line-clamp: 2; /* Properti standar */
    overflow: hidden;
    text-overflow: ellipsis;
    flex-grow: 1;
    text-align: left;
  }

  .read-more-button {
    font-size: 0.65rem;
    padding: 0.3rem 0.6rem;
  }
}

@media (max-width: 480px) {
  .related-articles-section {
    padding: 0.8rem;
  }
  .section-title {
    font-size: 1rem;
  }
  .articles-list {
    gap: 0.6rem;
  }
  .article-title {
    font-size: 0.75rem;
  }
  .article-description {
    font-size: 0.65rem;
    height: calc(0.65rem * 1.4 * 2); /* Disesuaikan: Tinggi eksplisit untuk 2 baris */
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    line-clamp: 2;
    overflow: hidden;
    text-overflow: ellipsis;
    flex-grow: 1;
    text-align: left;
  }

  .read-more-button {
    font-size: 0.6rem;
    padding: 0.25rem 0.5rem;
  }
}
</style>