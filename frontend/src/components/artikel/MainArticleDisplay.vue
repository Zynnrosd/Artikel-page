<template>
  <div v-if="article" class="article-display-container">
    <div class="article-header-content">
      <h1 class="article-title">{{ article.title }}</h1>
      
        <div class="article-meta">
          <span>{{ formatDate(article.createdAt) }}</span>
          <span>•</span>
          <router-link
            :to="{ name: 'Artikel', query: { author: article.author } }"
            class="clickable-author"
          > Oleh {{ article.author }}
          </router-link>
            <span>•</span>
            <span class="article-category">{{ article.category }}</span>
        </div>

      <div class="divider"></div> </div>
    
      <img :src="article.mainImage || 'https://via.placeholder.com/800x400?text=Gambar+Artikel'" :alt="article.title" class="article-main-image" />
    
    <div class="article-body" v-html="article.content"></div>
  </div>
  <div v-else class="empty-state">
    <p>Artikel tidak ditemukan atau terjadi kesalahan.</p>
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue';

const props = defineProps({
  article: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(['goBack']);

const formatDate = (dateString) => {
  if (!dateString) return '';
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(dateString).toLocaleDateString('id-ID', options);
};
</script>

<style scoped>
.article-display-container {
  background-color: transparent;
  border-radius: 0px; 
  box-shadow: none; 
  overflow: visible;
  position: relative;
  padding-bottom: 0; 
}

.article-header-content { 
  padding: 0 0rem; 
  margin-bottom: 2rem; 
  width: 100%;
  text-align: left;
}

.article-title {
  font-size: 2.5rem;
  color: #1a202c; 
  margin-bottom: 0.8rem;
  font-weight: 700;
  line-height: 1.25;
  text-align: left;
}

.article-meta {
  font-size: 0.9rem;
  color: #6b7280;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  text-align: left;
}

.article-meta span:nth-child(2) { 
    color: #cbd5e1; 
}

.divider {
  width: 100%;
  height: 1px;
  background-color: #e5e7eb;
  margin-bottom: 2rem;
}

.article-main-image {
  width: 100%;
  height: auto;
  max-height: 350px;
  object-fit: cover;
  border-radius: 8px; 
  display: block;
  margin-bottom: 2rem;
}

.article-body {
  line-height: 1.7;
  font-size: 1.05rem;
  color: #374151;
  text-align: justify;
  padding: 0 0rem 2rem;
  width: 100%;
}

.article-body p,
.article-body li {
  margin-bottom: 1rem;
}

.article-body h2,
.article-body h3,
.article-body h4 {
  color: #111827;
  font-weight: bold;
  margin: 2rem 0 1rem;
}

.article-body h2 { font-size: 1.8rem; }
.article-body h3 { font-size: 1.6rem; }
.article-body h4 { font-size: 1.4rem; }

.article-body ul,
.article-body ol {
  margin: 0 0 1.5rem 1.5rem;
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
  padding: 3rem;
  text-align: center;
  color: #777;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}

/* Responsive adjustments */
@media (max-width: 981px) {
  .article-main-image {
    max-height: 250px;
  }
  .article-title {
    font-size: 2rem;
  }
  .article-body {
    padding: 0 1.5rem;
    font-size: 1rem;
  }
}

@media (max-width: 480px) {
  .article-title {
    font-size: 1.8rem;
  }
  .article-main-image {
    max-height: 200px;
  }
  .article-body {
    padding: 0 1rem;
    font-size: 0.9rem;
  }
}
</style>