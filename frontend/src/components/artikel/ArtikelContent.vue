<template>
  <div class="artikel-content-container">
    <SearchBar 
      v-model:searchQuery="searchQuery" 
      @performSearch="performSearch" 
    />

    <CategoryTabs 
      :categories="categories" 
      v-model:activeTab="activeTab" 
    />

    <button 
      v-if="selectedAuthor" 
      @click="clearAuthorFilter"
      class="author-clear-btn"
      title="Kembali ke semua artikel"
    >
      <ion-icon name="arrow-back-outline"></ion-icon>
    </button>

    <div v-if="loading" class="loading-state">
      <p>Memuat artikel...</p>
    </div>

    <ArtikelGrid
      v-else-if="currentArticles.length"
      :articles="currentArticles"
      :isDesktop="isDesktop"
      @readMore="goToArticleDetail"
      @filterAuthor="filterByAuthor"
    />

    <div v-else class="empty-state">
      <p>Tidak ada artikel yang ditemukan untuk kategori atau pencarian ini.</p>
    </div>

    <div v-if="totalPages > 1" class="pagination-controls">
      <button 
        class="pagination-button" 
        @click="prevPage" 
        :disabled="currentPage === 1"
      >
        <ion-icon name="chevron-back-outline"></ion-icon> Previous
      </button>

      <template v-for="page in visiblePages" :key="page">
        <span v-if="page === '...'" class="pagination-ellipsis">...</span>
        <button 
          v-else 
          :class="['pagination-button', { 'active': page === currentPage }]" 
          @click="goToPage(page)"
        >
          {{ page }}
        </button>
      </template>

      <button 
        class="pagination-button" 
        @click="nextPage" 
        :disabled="currentPage === totalPages"
      >
        Next <ion-icon name="chevron-forward-outline"></ion-icon>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import axios from 'axios';

import SearchBar from '../common/SearchBar.vue';
import CategoryTabs from '../common/CategoryTabs.vue';
import ArtikelGrid from '../card/ArtikelGrid.vue';

const router = useRouter();
const route = useRoute();

const isDesktop = ref(window.innerWidth >= 981);

const categories = ref([]);
const selectedAuthor = ref('');
const activeTab = ref('Semua Artikel');
const searchQuery = ref('');
const loading = ref(false);

const currentPage = ref(1);
const articlesPerPage = 8;
const totalPages = ref(1);
const totalItems = ref(0);
const currentArticles = ref([]);

const API_BASE = 'http://localhost:3000';

const getImageUrl = (imagePath) => {
  if (!imagePath) return null;
  if (imagePath.startsWith('http')) return imagePath;
  if (imagePath.startsWith('/uploads/')) return `${API_BASE}${imagePath}`;
  return `${API_BASE}/uploads/${imagePath}`;
};

const fetchCategories = async () => {
  try {
    const { data } = await axios.get(`${API_BASE}/public/categories`);
    if (data?.success && data?.data) {
      const backendCategories = data.data
        .filter(cat => cat?.name && cat.name.trim() !== '' && cat.name !== 'Unnamed Category' && cat.name !== 'Semua Artikel')
        .map(cat => ({ label: cat.name, key: cat.name, id: cat.id }));
      categories.value = [{ label: 'Semua Artikel', key: 'Semua Artikel' }, ...backendCategories];
    } else {
      categories.value = [{ label: 'Semua Artikel', key: 'Semua Artikel' }];
    }
  } catch {
    categories.value = [{ label: 'Semua Artikel', key: 'Semua Artikel' }];
  }
};

const fetchArticles = async () => {
  loading.value = true;
  try {
    const params = { page: currentPage.value, limit: articlesPerPage };
    if (activeTab.value !== 'Semua Artikel') params.category = activeTab.value;
    if (searchQuery.value.trim()) params.search = searchQuery.value.trim();
    if (selectedAuthor.value) params.author = selectedAuthor.value;

    const { data } = await axios.get(`${API_BASE}/public/articles`, { params });
    if (data?.success && data?.data) {
      currentArticles.value = data.data.map(article => ({
        id: article.id,
        title: article.title,
        description: article.description,
        content: article.content,
        image: getImageUrl(article.image),
        author: article.author,
        category: article.category,
        createdAt: article.createdAt,
        slug: article.slug,
        navigationSlug: article.slug || article.id
      }));
      const { pagination } = data;
      totalPages.value = pagination.totalPages;
      totalItems.value = pagination.totalItems;
    } else {
      currentArticles.value = [];
      totalPages.value = 1;
      totalItems.value = 0;
    }
  } catch {
    currentArticles.value = [];
    totalPages.value = 1;
    totalItems.value = 0;
  } finally {
    loading.value = false;
  }
};

const filterByAuthor = (author) => {
  selectedAuthor.value = author;
  router.push({ name: 'Artikel', query: { author } });
};

const clearAuthorFilter = () => {
  selectedAuthor.value = '';
  router.push({ name: 'Artikel' });
};

const visiblePages = computed(() => {
  const pages = [];
  const maxVisible = 5;
  const half = Math.floor(maxVisible / 2);

  if (totalPages.value <= maxVisible) {
    for (let i = 1; i <= totalPages.value; i++) pages.push(i);
  } else if (currentPage.value <= half + 1) {
    for (let i = 1; i <= maxVisible - 1; i++) pages.push(i);
    pages.push('...', totalPages.value);
  } else if (currentPage.value >= totalPages.value - half) {
    pages.push(1, '...');
    for (let i = totalPages.value - maxVisible + 2; i <= totalPages.value; i++) pages.push(i);
  } else {
    pages.push(1, '...');
    for (let i = currentPage.value - half + 1; i <= currentPage.value + half - 1; i++) pages.push(i);
    pages.push('...', totalPages.value);
  }
  return pages;
});

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
};

const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
};

const goToPage = (page) => {
  if (page !== '...' && page >= 1 && page <= totalPages.value) {
    currentPage.value = page;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
};

const performSearch = () => {};

const goToArticleDetail = (identifier) => {
  if (typeof identifier !== 'string') return;
  const targetSlug = identifier.trim();
  if (!targetSlug) return;
  router.push(`/artikel/${targetSlug}`);
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

watch([activeTab, searchQuery, selectedAuthor], () => {
  currentPage.value = 1;
  fetchArticles();
});

watch(currentPage, fetchArticles);

const handleResize = () => {
  isDesktop.value = window.innerWidth >= 981;
};

onMounted(async () => {
  window.addEventListener('resize', handleResize);
  if (route.query.author) selectedAuthor.value = route.query.author;
  await Promise.all([fetchCategories(), fetchArticles()]);
});

watch(() => route.query.author, (newAuthor) => {
  selectedAuthor.value = newAuthor || '';
});

watch(() => route.fullPath, () => {
  selectedAuthor.value = route.query.author || '';
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize);
});
</script>

<style scoped>
.artikel-content-container {
  max-width: 1400px;
  margin: 1.5rem auto;
  width: 100%;
  box-sizing: border-box;
  padding: 0 3rem;
  overflow-wrap: break-word;
  word-wrap: break-word;
}

.author-clear-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border-radius: 50%;
  margin: 0.2rem 1rem;
  background-color: #154484;
  color: white;
  border: none;
  cursor: pointer;
  font-size: 1.2rem;
  transition: background-color 0.3s ease, transform 0.2s ease;
}

.author-clear-btn:hover {
  background-color: #FB8312; 
  color: white;
  transform: scale(1.05);
}

.author-clear-btn ion-icon {
  font-size: 1.3rem;
}

.loading-state,
.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  color: #888;
  font-size: 1.1rem;
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  margin-top: 2rem;
  word-wrap: break-word;
  overflow-wrap: break-word;
}

:deep(.article-card-title) {
  word-wrap: break-word !important;
  overflow-wrap: break-word !important;
  word-break: break-word !important;
  white-space: normal !important;
  line-height: 1.4 !important;
  display: -webkit-box !important;
  -webkit-box-orient: vertical !important;
  -webkit-line-clamp: 2 !important;
  overflow: hidden !important;
  text-overflow: ellipsis !important;
  max-width: 100% !important;
  hyphens: auto !important;
}

:deep(.article-card-description) {
  word-wrap: break-word !important;
  overflow-wrap: break-word !important;
  word-break: break-word !important;
  white-space: normal !important;
  line-height: 1.4 !important;
  display: -webkit-box !important;
  -webkit-box-orient: vertical !important;
  -webkit-line-clamp: 3 !important;
  overflow: hidden !important;
  text-overflow: ellipsis !important;
  max-width: 100% !important;
  hyphens: auto !important;
}

:deep(.article-card) {
  max-width: 100% !important;
  overflow-wrap: break-word !important;
  word-wrap: break-word !important;
  overflow: hidden !important;
}

:deep(.artikel-grid) {
  width: 100% !important;
  max-width: 100% !important;
  overflow: hidden !important;
}

:deep(*) {
  word-wrap: break-word;
  overflow-wrap: break-word;
  box-sizing: border-box;
}

:deep(h1), :deep(h2), :deep(h3), :deep(h4), :deep(h5), :deep(h6) {
  word-wrap: break-word !important;
  overflow-wrap: break-word !important;
  word-break: break-word !important;
  hyphens: auto !important;
  line-height: 1.3 !important;
}

:deep(p), :deep(span), :deep(div) {
  word-wrap: break-word !important;
  overflow-wrap: break-word !important;
  word-break: break-word !important;
  hyphens: auto !important;
}

/* Pagination */
.pagination-controls {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 2rem;
  padding-bottom: 2rem;
  gap: 0.6rem;
  flex-wrap: nowrap;
}

.pagination-button {
  background: transparent;
  border: none;
  color: #154484;
  font-size: 1rem;
  font-weight: 500;
  padding: 0.4rem 0.7rem;
  cursor: pointer;
  border-radius: 50%;
  min-width: 40px;
  min-height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s ease, border 0.2s ease, transform 0.2s ease;
}

.pagination-button:hover:not(:disabled) {
  background-color: #f8f8f8;
  transform: translateY(-1px);
}

.pagination-button.active {
  background-color: #154484;
  color: white;
  border-color: #154484;
  font-weight: 700;
}

.pagination-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagination-ellipsis {
  color: #888;
  font-size: 1rem;
  padding: 0 0.5rem;
}

/* Responsive */
@media (max-width: 981px) {
  .artikel-content-container {
    padding: 0 1.5rem;
  }
  .pagination-button {
    padding: 0.5rem 0.8rem;
    font-size: 0.9rem;
    min-width: 30px;
  }
  :deep(.article-card-title) {
    font-size: 0.9rem !important;
    line-height: 1.3 !important;
    -webkit-line-clamp: 2 !important;
  }
  :deep(.article-card-description) {
    font-size: 0.8rem !important;
    line-height: 1.4 !important;
    -webkit-line-clamp: 2 !important;
  }
}

@media (max-width: 480px) {
  .artikel-content-container {
    padding: 0 1rem;
  }
  .pagination-button {
    padding: 0.4rem 0.6rem;
    font-size: 0.8rem;
    min-width: 25px;
  }
  :deep(.article-card-title) {
    font-size: 0.85rem !important;
    line-height: 1.3 !important;
    -webkit-line-clamp: 2 !important;
  }
  :deep(.article-card-description) {
    font-size: 0.75rem !important;
    line-height: 1.4 !important;
    -webkit-line-clamp: 2 !important;
  }
}
</style>
