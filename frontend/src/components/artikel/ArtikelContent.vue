<template>
  <div class="artikel-content-container">
    <h1 class="page-title">Artikel</h1>

    <p v-if="activeTab === 'Semua Artikel'" class="selected-category-display">
      Semua Kategori
    </p>
    <p v-else-if="activeTab !== 'Semua Artikel'" class="selected-category-display">
      Kategori: {{ activeTab }}
    </p>

    <SearchBar v-model:searchQuery="searchQuery" @performSearch="performSearch" />

    <CategoryTabs 
      :categories="categories" 
      v-model:activeTab="activeTab" 
    />

    <ArtikelGrid 
      v-if="currentArticles.length"
      :articles="currentArticles"
      :isDesktop="isDesktop"
      @readMore="goToArticleDetail"
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
import { useRouter } from 'vue-router';

import SearchBar from '../common/SearchBar.vue'; 
import CategoryTabs from '../common/CategoryTabs.vue'; 
import ArtikelGrid from '../card/ArtikelGrid.vue'; 

import { allArticlesData } from '../../assets/dataSementara/articlesData.js'; 

const router = useRouter();

const isDesktop = ref(window.innerWidth >= 981); 

const allArticles = ref(allArticlesData); 

const categories = ref([
  { label: 'Semua Artikel', key: 'Semua Artikel' },
  { label: 'Tutorial', key: 'Tutorial' },
  { label: 'Informasi', key: 'Informasi' },
  { label: 'Tips & Trik', key: 'Tips & Trik' },
]);

const activeTab = ref('Semua Artikel');
const searchQuery = ref('');
const loading = ref(false); 

// --- Variabel Paginasi ---
const currentPage = ref(1);
const articlesPerPage = 8;
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
  return articlesToShow;
});

const totalPages = computed(() => {
  return Math.ceil(filteredResults.value.length / articlesPerPage);
});

const currentArticles = computed(() => {
  const start = (currentPage.value - 1) * articlesPerPage;
  const end = start + articlesPerPage;
  return filteredResults.value.slice(start, end); 
});

// Computed property untuk halaman yang terlihat (termasuk ellipsis)
const visiblePages = computed(() => {
  const pages = [];
  const maxVisible = 5;
  const half = Math.floor(maxVisible / 2);

  if (totalPages.value <= maxVisible) {
    for (let i = 1; i <= totalPages.value; i++) {
      pages.push(i);
    }
  } else {
    if (currentPage.value <= half + 1) {
      for (let i = 1; i <= maxVisible - 1; i++) {
        pages.push(i);
      }
      pages.push('...');
      pages.push(totalPages.value);
    } else if (currentPage.value >= totalPages.value - half) {
      pages.push(1);
      pages.push('...');
      for (let i = totalPages.value - maxVisible + 2; i <= totalPages.value; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      pages.push('...');
      for (let i = currentPage.value - half + 1; i <= currentPage.value + half - 1; i++) {
        pages.push(i);
      }
      pages.push('...');
      pages.push(totalPages.value);
    }
  }
  return pages;
});

// Method untuk pindah ke halaman selanjutnya
const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++;
    window.scrollTo({ top: 0, behavior: 'smooth' }); 
  }
};

// Method untuk pindah ke halaman sebelumnya
const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--;
    window.scrollTo({ top: 0, behavior: 'smooth' }); 
  }
};

// Method untuk pindah ke halaman spesifik
const goToPage = (page) => {
  if (page !== '...' && page >= 1 && page <= totalPages.value) {
    currentPage.value = page;
    window.scrollTo({ top: 0, behavior: 'smooth' }); 
  }
};

watch([activeTab, searchQuery], () => {
  currentPage.value = 1;
});

const performSearch = () => {
  console.log('Mencari:', searchQuery.value);
};

const goToArticleDetail = (id) => {
  router.push(`/artikel/${id}`);
};

const handleResize = () => {
  isDesktop.value = window.innerWidth >= 981;
};

onMounted(() => {
  window.addEventListener('resize', handleResize);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize);
});
</script>

<style scoped>
.artikel-content-container {
  max-width: 1400px; 
  margin: 0 auto;
  width: 100%;
  box-sizing: border-box;
  padding: 0 4rem;
}

.page-title {
  font-size: 3.5rem;
  color: #154484;
  margin-bottom: 0.5rem;
  font-weight: 700;
  text-align: center;
}

.selected-category-display {
  font-size: 1.2rem;
  color: #FB8312;
  font-weight: 600;
  text-align: center;
  margin-bottom: 2rem;
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

/* Pagination Controls */
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
  align-items: center;
  gap: 0.3rem;
  min-width: 35px;
  justify-content: center;
}

.pagination-button:hover:not(:disabled) {
  background-color: #f0f0f0; 
  color: #154484;
  transform: translateY(-1px);
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
}

.pagination-button:disabled {
  background-color: transparent;
  color: #cccccc; 
  cursor: not-allowed;
  border-color: #e0e0e0;
}

.pagination-button.active {
  background-color: #154484; 
  color: white;
  border-color: #154484;
  font-weight: 700; 
  pointer-events: none; 
  transform: none; 
  box-shadow: none; 
}

.pagination-ellipsis {
  color: #888;
  font-size: 1.1rem; 
  padding: 0 0.2rem;
}

/* Responsive adjustments for pagination (jika perlu penyesuaian lebih lanjut) */
@media (max-width: 981px) {
  .pagination-controls {
    margin-top: 2rem;
    padding-bottom: 2rem;
    gap: 0.4rem;
  }

  .pagination-button {
    padding: 0.5rem 0.8rem;
    font-size: 0.9rem;
    min-width: 30px;
  }

  .pagination-ellipsis {
    font-size: 1rem;
  }
}

@media (max-width: 480px) {
  .pagination-button {
    padding: 0.4rem 0.6rem;
    font-size: 0.8rem;
    min-width: 25px;
  }
  .pagination-ellipsis {
    font-size: 0.9rem;
  }
}

</style>