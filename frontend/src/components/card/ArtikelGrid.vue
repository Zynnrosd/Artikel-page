<template>
  <div class="articles-grid">
    <div v-for="article in articles" :key="article.id" class="article-card">
      <div class="article-image-container">
        <img :src="article.image || 'https://via.placeholder.com/300x200?text=Artikel+Gambar'" :alt="article.title" class="article-image" />
        <span class="article-tag">{{ article.category }}</span>
      </div>
      <div class="article-content">
        <h2 class="article-title">{{ article.title }}</h2>
        <p class="article-description">{{ article.description }}</p>
        <div class="article-meta-list">
          <router-link 
            class="article-author-list clickable-author" :to="{ name: 'Artikel', query: { author: article.author } }"
          > Oleh: {{ article.author }}
          </router-link>
            <span class="article-time-list">🕒 {{ formatUploadTime(article.createdAt) }}
            </span>
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
.articles-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 2rem;
  padding: 1rem 1rem 1rem; 
  max-width: 1320px;
  margin: 0 auto;
  place-items: stretch;
  transition: all 0.3s ease-in-out;

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
  object-position: center 50%;
  display: block;
  transition: transform 0.5s ease;
}

.article-image-container:hover .article-image {
  transform: scale(1.1);
}

.article-content {
  padding: 1.2rem;
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
  white-space: nowrap;
  max-width: calc(100% - 20px);
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
  height: calc(0.95rem * 1.5 * 2);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  line-clamp: 2; 
  overflow: hidden;
  text-overflow: ellipsis;
  flex-grow: 1;
  text-align: justify;
}

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

.clickable-author {
  color: #154484;
  font-weight: 600;
  cursor: pointer;
  text-decoration: none;
}

.clickable-author:hover {
  text-decoration: underline;
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

/* Responsive */
@media (max-width: 1200px) {
  .articles-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 768px) {
  .articles-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 480px) {
  .articles-grid {
    grid-template-columns: 1fr;
  }

  .article-content {
    padding: 0.8rem;
  }

  .read-more-button {
    padding: 0.6rem 1rem;
    font-size: 0.7rem;
  }

}

</style>
