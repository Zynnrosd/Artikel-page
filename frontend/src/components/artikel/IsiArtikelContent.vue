<template>
  <div class="isi-artikel-content-container">
    <button class="back-button-content" @click="goBack">
      <ion-icon name="chevron-back-outline"></ion-icon> Kembali
    </button>

    <div class="main-layout-grid"> 
      <div class="main-article-column"> 
        <MainArticleDisplay
          v-if="currentArticle"
          :article="currentArticle"
          @goBack="goBack"
        />
        
        <div v-else class="loading-state">
          <p>Memuat artikel...</p>
        </div>
      </div>

      <div class="related-articles-column"> 
        <RelatedArticlesSection
          v-if="currentArticle && relatedArticles.length"
          :relatedArticles="relatedArticles"
          @readMoreRelated="goToArticleDetail"
        />
        
        <div v-else-if="currentArticle" class="related-placeholder">
          <div class="related-title">Artikel Terkait</div>
          <div class="related-item-placeholder"></div>
          <div class="related-item-placeholder"></div>
          <div class="related-item-placeholder"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import axios from 'axios'; 

import MainArticleDisplay from './MainArticleDisplay.vue';
import RelatedArticlesSection from './RelatedArticlesSection.vue';

const currentArticle = ref(null); 
const relatedArticles = ref([]);
const route = useRoute();
const router = useRouter();

const API_BASE = 'http://localhost:3000';

const isValidSlug = (slug) => {
  return slug && 
         typeof slug === 'string' && 
         slug.trim() !== '' && 
         slug.length >= 3 &&
         slug.length <= 100 &&
         /^[a-zA-Z0-9-_]+$/.test(slug.trim());
};

const getImageUrl = (imagePath) => {
  if (!imagePath) return null;
  if (imagePath.startsWith('http')) return imagePath;
  if (imagePath.startsWith('/uploads/')) return `${API_BASE}${imagePath}`;
  return `${API_BASE}/uploads/${imagePath}`;
};

async function fetchArticleBySlug(articleSlug) {
  if (!isValidSlug(articleSlug)) {
    router.replace({ name: 'NotFound' });
    return;
  }

  try {
    const articleResponse = await axios.get(`${API_BASE}/public/articles/${articleSlug}`, {
      timeout: 2000
    });
    
    if (articleResponse.data.success && articleResponse.data.data) {
      const article = articleResponse.data.data;
      
      if (article.is_published === false) {
        router.replace({ name: 'NotFound' });
        return;
      }
      
      currentArticle.value = {
        id: article.id,
        title: article.title,
        description: article.description,
        content: article.content,
        image: getImageUrl(article.image),
        mainImage: getImageUrl(article.image || article.mainImage),
        author: article.author,
        category: article.category,
        createdAt: article.createdAt,
        updatedAt: article.updatedAt,
        slug: article.slug,
        is_published: article.is_published
      };

      fetchRelatedArticles(article.id);
    } else {
      router.replace({ name: 'NotFound' });
    }
    
  } catch (error) {
    router.replace({ name: 'NotFound' });
  }
}

const fetchRelatedArticles = async (articleId) => {
  try {
    const relatedResponse = await axios.get(`${API_BASE}/public/articles/${articleId}/related`, {
      timeout: 3000
    });
    
    if (relatedResponse.data.success && relatedResponse.data.data) {
      relatedArticles.value = relatedResponse.data.data.map(relatedArticle => ({
        id: relatedArticle.id,
        title: relatedArticle.title,
        description: relatedArticle.description,
        content: relatedArticle.content,
        image: getImageUrl(relatedArticle.image),
        author: relatedArticle.author,
        category: relatedArticle.category,
        createdAt: relatedArticle.createdAt,
        slug: relatedArticle.slug
      }));
    }
  } catch {
    relatedArticles.value = [];
  }
};

const goBack = () => {
  router.push('/artikel'); 
};

const goToArticleDetail = (articleData) => {
  let targetSlug;
  
  if (typeof articleData === 'string') {
    targetSlug = articleData;
  } else if (articleData?.slug) {
    targetSlug = articleData.slug;
  } else {
    return;
  }
  
  if (!isValidSlug(targetSlug)) return;
  
  router.push(`/artikel/${targetSlug}`);
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

watch(
  () => route.params.slug,
  (newSlug, oldSlug) => {
    if (newSlug && newSlug !== oldSlug) {
      currentArticle.value = null;
      relatedArticles.value = [];
      fetchArticleBySlug(newSlug);
    } else if (!newSlug) {
      router.replace('/artikel');
    }
  },
  { immediate: true }
);

onMounted(() => {
  const currentSlug = route.params.slug;
  if (!currentSlug) {
    router.replace('/artikel');
  }
});
</script>

<style scoped>
.isi-artikel-content-container {
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  overflow-wrap: break-word;
  word-wrap: break-word;
}

.back-button-content {
  background-color: #f9fafb;
  color: #374151;
  font-size: 0.9rem;
  padding: 0.6rem 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 9999px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  transition: all 0.2s ease;
}

.back-button-content:hover {
  background-color: #f3f4f6;
  color: #154484;
  transform: translateY(-1px);
  box-shadow: 0 1px 4px rgba(0,0,0,0.08);
}

.back-button-content ion-icon {
  font-size: 1rem;
  margin-right: 0.1rem;
}

.main-layout-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 4.5rem;
  align-items: flex-start;
  width: 100%;
  max-width: 100%;
  overflow: hidden;
}

.main-article-column {
  max-width: 100%;
  min-width: 0;
  overflow-wrap: break-word;
  word-wrap: break-word;
  word-break: break-word;
}

.related-articles-column {
  max-width: 100%;
  min-width: 0;
  overflow-wrap: break-word;
  word-wrap: break-word;
}

.loading-state {
  text-align: center;
  padding: 2rem 1.5rem;
  color: #6b7280;
  font-size: 1rem;
  background-color: #f9fafb;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}

.loading-state p {
  margin: 0;
  color: #9ca3af;
}

* {
  word-wrap: break-word;
  overflow-wrap: break-word;
}

@media (max-width: 981px) {
  .back-button-content {
    font-size: 0.85rem;
    padding: 0.5rem 0.8rem;
    margin-bottom: 1rem;
  }
  
  .back-button-content ion-icon {
    font-size: 0.9rem;
    margin-right: 0.2rem;
  }
  
  .main-layout-grid {
    grid-template-columns: 1fr;
    gap: 1.5rem;
    max-width: 100%;
  }
  
  .main-article-column {
    max-width: 100%;
    overflow-x: hidden;
  }
  
  .related-articles-column {
    max-width: 100%;
    overflow-x: hidden;
  }
}

@media (max-width: 480px) {
  .isi-artikel-content-container {
    padding: 0 0.5rem;
  }
  
  .back-button-content {
    font-size: 0.8rem;
    padding: 0.4rem 0.6rem;
    margin-bottom: 0.8rem;
  }
  
  .back-button-content ion-icon {
    font-size: 0.8rem;
    margin-right: 0.1rem;
  }
  
  .main-layout-grid {
    gap: 1rem;
    max-width: 100%;
  }
  
  .main-article-column,
  .related-articles-column {
    max-width: 100%;
    overflow-x: hidden;
  }
  
  .loading-state {
    padding: 1.5rem 1rem;
    font-size: 0.9rem;
  }
}
</style>
