<template>
  <div class="isi-artikel-content-container">
    <button class="back-button-content" @click="goBack">
      <ion-icon name="chevron-back-outline"></ion-icon> Kembali
    </button>

    <div class="main-layout-grid"> <div class="main-article-column"> <div v-if="loading" class="loading-state">
          <p>Memuat artikel...</p>
        </div>
        <MainArticleDisplay
          v-else
          :article="currentArticle"
          @goBack="goBack"
        />
      </div>

      <div class="related-articles-column"> <RelatedArticlesSection
          v-if="!loading && currentArticle && relatedArticles.length"
          :relatedArticles="relatedArticles"
          @readMoreRelated="goToArticleDetail"
        />
        <div v-else-if="!loading && !currentArticle" class="empty-state">
          <p>Artikel tidak ditemukan atau terjadi kesalahan.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import axios from 'axios'; 

import MainArticleDisplay from './MainArticleDisplay.vue'; // Path relatif yang benar
import RelatedArticlesSection from './RelatedArticlesSection.vue'; // Path relatif yang benar

// Impor data dummy terpusat
import { allArticlesData, dummyRelatedArticlesData } from '../../assets/dataSementara/articlesData.js'; // Path relatif yang benar

const currentArticle = ref(null); 
const loading = ref(true);
const relatedArticles = ref([]);
const route = useRoute();
const router = useRouter();

async function fetchArticleDetail(articleId) {
  loading.value = true;
  currentArticle.value = null; 
  relatedArticles.value = []; 

  try {
    const foundArticle = allArticlesData.find(a => a.id === articleId);

    if (foundArticle) {
        currentArticle.value = foundArticle; 
        relatedArticles.value = allArticlesData.filter(a => 
          a.id !== articleId &&          
          a.category === foundArticle.category 
        ); 
    } else {
        console.warn(`Artikel dengan ID ${articleId} tidak ditemukan di allArticlesData.`);
        currentArticle.value = null; 
        relatedArticles.value = []; 
    }
    
  } catch (error) {
    console.error('Gagal mengambil artikel:', error);
    currentArticle.value = null; 
    relatedArticles.value = []; 
  } finally {
    loading.value = false;
  }
}

const goBack = () => {
  router.push('/artikel'); 
};

const goToArticleDetail = (id) => {
  router.push(`/artikel/${id}`);
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

onMounted(() => {
  
});

watch(
  () => route.params.id,
  (newId, oldId) => {
    if (newId && newId !== oldId) {
      fetchArticleDetail(newId);
    }
  },
  { immediate: true }
);
</script>

<style scoped>
.isi-artikel-content-container { /* Kontainer utama untuk semua konten di dalam content-wrapper */
  width: 100%;
  box-sizing: border-box;
  /* Tidak ada background, shadow, border-radius di sini karena sudah di parent content-wrapper */
}

/* Tombol Kembali di level konten */
.back-button-content {
  background-color: #f0f2f5; /* Latar belakang mirip tombol kategori */
  color: #555;
  font-size: 0.rem; /* Ukuran font lebih kecil */
  padding: 0.6rem 1rem; /* Padding seperti tombol */
  border: 1px solid #d9d9d9; /* Border tipis */
  border-radius: 20px; /* Lebih membulat seperti tombol */
  cursor: pointer;
  transition: all 0.2s ease;
  margin-bottom: 1rem; /* Disesuaikan: Jarak ke grid utama */
  display: inline-flex;
  align-items: center;
  gap: 0.1rem;
  text-decoration: none; /* Hapus underline */
}

.back-button-content:hover {
  background-color: #e0e0e0;
  color: #154484; /* Biru dongker saat hover */
  transform: translateY(-1px);
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}
.back-button-content ion-icon {
    font-size: 1rem; /* Ukuran icon */
    margin-right: 0.1rem; /* Jarak icon dengan teks "Kembali" */
}

.main-layout-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 4.5rem;
  align-items: flex-start;
}

.loading-state, .empty-state {
  text-align: center;
  padding: 3rem 1.5rem;
  color: #888;
  font-size: 1rem;
  grid-column: 1 / -1;
  background-color: #f8f8f8;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  margin-top: 0.5rem;
}

/* Responsive adjustments */
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
  }
  .loading-state, .empty-state {
    margin-top: 0.5rem;
  }
}

@media (max-width: 480px) {
  .back-button-content {
    font-size: 0.8rem;
    padding: 0.4rem 0.6rem;
    margin-bottom: 0.8rem;
  }
  .back-button-content ion-icon {
    font-size: 0.8rem;
    margin-right: 0.1rem;
  }
}
</style>