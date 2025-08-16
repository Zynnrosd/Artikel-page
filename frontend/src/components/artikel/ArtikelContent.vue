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

    <!-- Tombol hapus filter author -->
    <button 
      v-if="selectedAuthor" 
      @click="clearAuthorFilter"
      class="author-clear-btn"
      title="Kembali ke semua artikel"
    >
    <ion-icon name="arrow-back-outline"></ion-icon>
    </button>

    <!-- Daftar artikel -->
    <ArtikelGrid
      v-if="currentArticles.length"
      :articles="currentArticles"
      :isDesktop="isDesktop"
      @readMore="goToArticleDetail"
      @filterAuthor="filterByAuthor"
      />

    <!-- Empty State -->
    <div v-else class="empty-state">
      <p>Tidak ada artikel yang ditemukan untuk kategori atau pencarian ini.</p>
    </div>

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="pagination-controls">
      <button 
        class="pagination-button" 
        @click="prevPage" 
        :disabled="currentPage === 1"
      >
        <ion-icon name="chevron-back-outline"></ion-icon> Previous
      </button>

      <!-- Halaman -->
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

      <!-- Next Button -->
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

import SearchBar from '../common/SearchBar.vue';
import CategoryTabs from '../common/CategoryTabs.vue';
import ArtikelGrid from '../card/ArtikelGrid.vue';

import { allArticlesData } from '../../assets/dataSementara/articlesData.js';

const router = useRouter();
const route = useRoute();

// Responsive
const isDesktop = ref(window.innerWidth >= 981);

// Data artikel
const allArticles = ref(allArticlesData);
const categories = ref([
  { label: 'Semua Artikel', key: 'Semua Artikel' },
  { label: 'Tutorial', key: 'Tutorial' },
  { label: 'Informasi', key: 'Informasi' },
  { label: 'Tips & Trik', key: 'Tips & Trik' },
]);

const selectedAuthor = ref('');
const activeTab = ref('Semua Artikel');
const searchQuery = ref('');
const currentPage = ref(1);
const articlesPerPage = 8;

// Filter artikel
const filteredResults = computed(() => {
  let articlesToShow = allArticles.value;

  if (activeTab.value !== 'Semua Artikel') {
    articlesToShow = articlesToShow.filter(article => article.category === activeTab.value);
  }

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    articlesToShow = articlesToShow.filter(article =>
      article.title.toLowerCase().includes(query) ||
      article.description.toLowerCase().includes(query) ||
      article.category.toLowerCase().includes(query) ||
      article.author.toLowerCase().includes(query)
    );
  }

  if (selectedAuthor.value) {
    articlesToShow = articlesToShow.filter(article => article.author === selectedAuthor.value);
  }

  return articlesToShow;
});

const filterByAuthor = (author) => {
  selectedAuthor.value = author;
  router.push({ name: 'Artikel', query: { author } });
};

const clearAuthorFilter = () => {
  selectedAuthor.value = '';
  router.push({ name: 'Artikel' });
};

// Pagination
const totalPages = computed(() => Math.ceil(filteredResults.value.length / articlesPerPage));

const currentArticles = computed(() => {
  const start = (currentPage.value - 1) * articlesPerPage;
  return filteredResults.value.slice(start, start + articlesPerPage);
});

const visiblePages = computed(() => {
  const pages = [];
  const maxVisible = 5;
  const half = Math.floor(maxVisible / 2);

  if (totalPages.value <= maxVisible) {
    for (let i = 1; i <= totalPages.value; i++) pages.push(i);
  } else {
    if (currentPage.value <= half + 1) {
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

// Pencarian
const performSearch = () => {
  console.log('Mencari:', searchQuery.value);
};

// Navigasi detail artikel
const goToArticleDetail = (id) => {
  router.push(`/artikel/${id}`);
};

// Responsive listener
const handleResize = () => {
  isDesktop.value = window.innerWidth >= 981;
};

onMounted(() => {
  window.addEventListener('resize', handleResize);
  if (route.query.author) {
    selectedAuthor.value = route.query.author;
  }
});

watch([activeTab, searchQuery, selectedAuthor], () => {
  currentPage.value = 1;
});

watch(
  () => route.query.author,
  (newAuthor) => {
    selectedAuthor.value = newAuthor || '';
  }
);

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

.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  color: #888;
  font-size: 1.1rem;
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  margin-top: 2rem;
}

/* Pagination */
.pagination-controls {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 3rem;
  padding-bottom: 3rem;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.pagination-button {
  background-color: transparent;
  color: #154484;
  padding: 0.6rem 1rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 35px;
}

.pagination-button:hover:not(:disabled) {
  background-color: #f0f0f0;
  transform: translateY(-1px);
}

.pagination-button:disabled {
  color: #ccc;
  cursor: not-allowed;
}

.pagination-button.active {
  background-color: #154484;
  color: white;
  border-color: #154484;
  font-weight: 700;
  pointer-events: none;
}

.pagination-ellipsis {
  color: #888;
  font-size: 1.1rem;
}

/* Responsive */
@media (max-width: 981px) {
  .pagination-button {
    padding: 0.5rem 0.8rem;
    font-size: 0.9rem;
    min-width: 30px;
  }
}

@media (max-width: 480px) {
  .pagination-button {
    padding: 0.4rem 0.6rem;
    font-size: 0.8rem;
    min-width: 25px;
  }
}
</style>
