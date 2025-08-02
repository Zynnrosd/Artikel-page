<template>
  <div 
    :class="['articles-grid', { 'centered-small-grid': (articles.length === 1 || articles.length === 2) && isDesktop }]"
  >
    <div v-for="article in articles" :key="article.id" class="article-card">
      <div class="article-image-container">
        <img :src="article.image || 'https://via.placeholder.com/300x200?text=Artikel+Gambar'" :alt="article.title" class="article-image" />
        <span class="article-tag">{{ article.category }}</span>
      </div>
      <div class="article-content">
        <h2 class="article-title">{{ article.title }}</h2>
        <p class="article-description">{{ article.description }}</p>
        <div class="article-meta-list">
          <span class="article-author-list">Oleh: {{ article.author }}</span>
          <span class="article-time-list">🕒 {{ formatUploadTime(article.createdAt) }}</span>
        </div>
        <button class="read-more-button" @click="$emit('readMore', article.id)">
          Baca Selengkapnya
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue';

const props = defineProps({
  articles: {
    type: Array,
    required: true,
  },
  isDesktop: {
    type: Boolean,
    required: true,
  }
});

const emit = defineEmits(['readMore']);

// Fungsi untuk format waktu unggah
const formatUploadTime = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now - date);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays <= 1) {
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffTime / (1000 * 60));

    if (diffHours < 1) {
      return `${diffMinutes} menit yang lalu`;
    } else if (diffHours < 24) {
      return `${diffHours} jam yang lalu`;
    } else {
      return 'Kemarin';
    }
  } else if (diffDays <= 7) {
    return `${diffDays} hari yang lalu`;
  } else {
    return date.toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });
  }
};
</script>

<style scoped>
/* Styling untuk grid artikel dan kartu artikel */
.articles-grid {
  display: grid;
  gap: 2rem;
  padding: 2rem 0;
}

/* Force 4 columns on desktop screens */
@media (min-width: 981px) {
  .articles-grid {
    grid-template-columns: repeat(4, 1fr); 
  }

  .article-card {
    max-width: 320px;
    height: 380px; 
  }
}

.article-card {
  background-color: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  display: flex;
  flex-direction: column;
  height: 100%; 
}

.article-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
}

.article-image-container {
  width: 100%;
  height: 180px;
  overflow: hidden;
  position: relative;
  border-top-left-radius: 12px;
  border-top-right-radius: 12px;
}

.article-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  object-position: center 50%;
}

.article-content {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  flex-grow: 1; 
  padding-top: 0.5rem;
}

.article-tag {
  display: inline-block;
  background-color: #154484;
  color: white;
  padding: 0.3rem 0.5rem;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 600;
  position: absolute;
  bottom: 10px;
  left: 1.5rem;
  z-index: 1;
  width: fit-content;
  max-width: calc(100% - 20px);
  white-space: nowrap;
}

.article-title {
  font-size: 1.35rem;
  color: #154484;
  margin: 0.5rem 0;
  line-height: 1.4;
  font-weight: 600;
  text-align: left;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  line-clamp: 2;
  overflow: hidden;
  text-overflow: ellipsis;
  height: calc(1.35rem * 1.4 * 2);
}

.article-description {
  font-size: 0.95rem;
  color: #666;
  margin-bottom: 1.2rem;
  line-height: 1.5;
  height: calc(0.95rem * 1.5 * 2); /* Disesuaikan: Hitung tinggi pasti untuk 2 baris */
  display: -webkit-box; 
  -webkit-line-clamp: 2; 
  -webkit-box-orient: vertical; 
  line-clamp: 2;
  overflow: hidden; 
  text-overflow: ellipsis;
  flex-grow: 1; 
  text-align: justify; 
}

/* Waktu Unggah dan Penulis */
.article-meta-list {
  font-size: 0.85rem;
  color: #888;
  margin-top: 0.4rem;
  margin-bottom: 0.7rem;
  line-height: 1.4;
  display: flex;
  flex-direction: column;
}

.article-author-list,
.article-time-list {
  margin-bottom: 0.1rem;
}

.read-more-button {
  background-color: #FB8312;
  color: white;
  padding: 0.8rem 1.5rem;
  border: none;
  border-radius: 25px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.3s ease;
  width: 100%;
  margin-top: auto;
}

.read-more-button:hover {
  background-color: #E67200;
}

.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  color: #888;
  font-size: 1.1rem;
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  grid-column: 1 / -1;
}

/* Layout khusus untuk satu atau dua artikel */
.articles-grid.centered-small-grid {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 2rem;
}

.articles-grid.centered-small-grid .article-card {
  max-width: 300px;
  width: 100%;
}

/* Responsive adjustments */
@media (max-width: 981px) {
  .articles-grid {
    grid-template-columns: 1fr;
  }

  .article-card {
    max-width: 100%;
  }

  .article-image-container {
    height: 180px;
  }

  .article-content {
    padding: 1rem;
  }

   .article-title {
  font-size: 1.2rem;
  color: #154484;
  margin: 0.5rem 0;
  line-height: 1.4;
  font-weight: 600;
  text-align: left;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  line-clamp: 2;
  overflow: hidden;
  text-overflow: ellipsis;
  height: calc(1.35rem * 1.4 * 2);
  }

  .article-description {
    font-size: 0.9rem;
    color: #666;
    margin-bottom: 1.2rem;
    line-height: 1.5;
    height: calc(0.9rem * 1.5 * 2); /* Disesuaikan: Tinggi eksplisit untuk 2 baris */
    display: -webkit-box;
    -webkit-line-clamp: 2; /* Batasi deskripsi menjadi 2 baris */
    -webkit-box-orient: vertical;
    line-clamp: 2; /* Properti standar */
    overflow: hidden;
    text-overflow: ellipsis;
    flex-grow: 1;
    text-align: justify;
  }

  .article-meta-list {
    font-size: 0.8rem;
  }

  .articles-grid.centered-small-grid {
    display: grid;
    justify-content: unset;
    gap: 2rem;
  }
  .articles-grid.centered-small-grid .article-card {
    max-width: 100%;
  }
}

@media (max-width: 480px) {
  .article-content {
    padding: 0.8rem;
  }
  .article-title {
  font-size: 1.1rem;
  color: #154484;
  margin: 0.5rem 0;
  line-height: 1.4;
  font-weight: 600;
  text-align: left;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  line-clamp: 2;
  overflow: hidden;
  text-overflow: ellipsis;
  height: calc(1.35rem * 1.4 * 2);
  }
   .article-description {
    font-size: 0.8rem;
    color: #666;
    margin-bottom: 1rem;
    line-height: 1.4;
    height: calc(0.8rem * 1.4 * 2); /* Disesuaikan: Tinggi eksplisit untuk 2 baris */
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    line-clamp: 2;
    overflow: hidden;
    text-overflow: ellipsis;
    flex-grow: 1;
    text-align: justify;
  }
}
</style>