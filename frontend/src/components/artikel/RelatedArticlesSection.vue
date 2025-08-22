<template>
  <div class="related-articles-section">
    <h2 class="section-title">Artikel Lainnya</h2>

    <div v-if="relatedArticles.length" class="articles-wrapper">
      <div v-if="isMobile" class="mobile-wrapper">
        <button 
          class="scroll-btn left" 
          @click="scrollLeft"
          :disabled="!canScrollLeft"
        >
          <ion-icon name="chevron-back-outline"></ion-icon>
        </button>

        <div class="articles-list mobile" ref="scrollContainer" @scroll="checkScrollButtons">
          <div 
            v-for="article in relatedArticles" 
            :key="article.id" 
            class="article-card mobile"
            @click="goToArticleDetail(article.id)"
          >
            <div class="article-image-container">
              <img 
                :src="article.image || 'https://via.placeholder.com/350x200?text=Artikel+Terkait'" 
                :alt="article.title" 
                class="article-image" 
              />
            </div>
            <div class="article-content">
              <h3 class="article-title">{{ article.title }}</h3>
              <p class="article-description">{{ article.description }}</p>
              <div class="article-meta-list">
                <span class="article-date">{{ formatDate(article.createdAt) }}</span>
              </div>
            </div>
          </div>
        </div>

        <button 
          class="scroll-btn right" 
          @click="scrollRight"
          :disabled="!canScrollRight"
        >
          <ion-icon name="chevron-forward-outline"></ion-icon>
        </button>
      </div>

      <div v-else class="desktop-tablet-wrapper">
        <div class="articles-list" :class="{ tablet: isTablet, desktop: isDesktop }">
          <div 
            v-for="article in paginatedArticles" 
            :key="article.id" 
            class="article-card"
            @click="goToArticleDetail(article.id)"
          >
            <div class="article-image-container">
              <img 
                :src="article.image || 'https://via.placeholder.com/350x200?text=Artikel+Terkait'" 
                :alt="article.title" 
                class="article-image" 
              />
            </div>
            <div class="article-content">
              <h3 class="article-title">{{ article.title }}</h3>
              <p class="article-description">{{ article.description }}</p>
              <div class="article-meta-list">
                <span class="article-date">{{ formatDate(article.createdAt) }}</span>
              </div>
            </div>
          </div>
        </div>

        <div v-if="totalPages > 1" class="pagination-controls">
          <button 
            class="pagination-btn prev"
            @click="prevPage"
            :disabled="currentPage === 1"
          >
            <ion-icon name="chevron-back-outline"></ion-icon>
            <span>Previous</span>
          </button>
          
          <div class="pagination-info">
            <span class="page-indicator">
              {{ currentPage }} / {{ totalPages }}
            </span>
          </div>
          
          <button 
            class="pagination-btn next"
            @click="nextPage"
            :disabled="currentPage === totalPages"
          >
            <span>Next</span>
            <ion-icon name="chevron-forward-outline"></ion-icon>
          </button>
        </div>
      </div>
    </div>

    <div v-else class="empty-state-related">
      <p>Tidak ada artikel terkait.</p>
    </div>
  </div>
</template>

<script setup>
import { defineProps, ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useRouter } from 'vue-router'

const props = defineProps({
  relatedArticles: {
    type: Array,
    required: true,
  },
});

const router = useRouter()
const scrollContainer = ref(null)
const currentPage = ref(1)

const screenWidth = ref(window.innerWidth)
const isMobile = computed(() => screenWidth.value <= 480)
const isTablet = computed(() => screenWidth.value > 480 && screenWidth.value <= 981)
const isDesktop = computed(() => screenWidth.value > 981)

const canScrollLeft = ref(false)
const canScrollRight = ref(true)

const itemsPerPage = computed(() => {
  if (isMobile.value) return relatedArticles.length
  if (isTablet.value) return 8
  return 4
})

const totalPages = computed(() => {
  if (isMobile.value) return 1
  return Math.ceil(props.relatedArticles.length / itemsPerPage.value)
})

const paginatedArticles = computed(() => {
  if (isMobile.value) return props.relatedArticles
  const startIndex = (currentPage.value - 1) * itemsPerPage.value
  const endIndex = startIndex + itemsPerPage.value
  return props.relatedArticles.slice(startIndex, endIndex)
})

const goToArticleDetail = (id) => {
  router.push(`/artikel/${id}`)
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  const options = { year: 'numeric', month: 'long', day: 'numeric' }
  return new Date(dateString).toLocaleDateString('id-ID', options)
}

const scrollLeft = () => {
  scrollContainer.value?.scrollBy({ left: -280, behavior: 'smooth' })
}

const scrollRight = () => {
  scrollContainer.value?.scrollBy({ left: 280, behavior: 'smooth' })
}

const checkScrollButtons = () => {
  if (!scrollContainer.value) return
  const container = scrollContainer.value
  canScrollLeft.value = container.scrollLeft > 0
  canScrollRight.value = container.scrollLeft < (container.scrollWidth - container.clientWidth)
}

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
  }
}

const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--
  }
}

const handleResize = () => {
  screenWidth.value = window.innerWidth
  currentPage.value = 1
  nextTick(() => {
    if (isMobile.value) {
      checkScrollButtons()
    }
  })
}

onMounted(() => {
  window.addEventListener('resize', handleResize)
  if (isMobile.value) {
    nextTick(() => {
      checkScrollButtons()
    })
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
.related-articles-section {
  padding: 1.5rem;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
}

.section-title {
  font-size: 1.2rem;
  color: #333;
  margin-bottom: 1rem;
  font-weight: 600;
  text-align: left;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #eee;
}

.articles-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
}

.article-card {
  background-color: #fcfcfc;
  border-radius: 12px;
  overflow: hidden;
  border: 2px solid transparent;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: box-shadow 0.3s ease, transform 0.3s ease;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.article-card:hover {
  border: 2px solid rgba(0, 0, 0, 0.25);
  box-shadow: 0 6px 15px rgba(0, 0, 0, 0.15);
  transform: scale(1.02);
}

.article-image-container {
  width: 100%;
  height: 120px;
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
  gap: 0.3rem;
  flex-grow: 1;
}

.article-title {
  font-size: 0.9rem;
  color: #333;
  margin-bottom: 0.2rem;
  font-weight: 600;
  line-height: 1.3;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2; 
  -webkit-box-orient: vertical;
  text-overflow: ellipsis;
  word-break: break-word;
  height: calc(0.9rem * 1.3 * 2); 
}

.article-description {
  display: -webkit-box;
  font-size: 0.8rem;
  color: #777;
  margin-bottom: 0.6rem;
  line-height: 1.4;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  word-break: break-word;
  height: calc(0.8rem * 1.4 * 2);
  flex-grow: 1;
}

.article-meta-list {
  font-size: 0.75rem;
  color: #888;
  margin-top: 0.4rem;
  margin-bottom: 0.4rem;
}

.empty-state-related {
  padding: 1rem;
  text-align: center;
  color: #777;
  font-size: 0.85rem;
}

/* Mobile Styles */
.mobile-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.articles-list.mobile {
  display: flex;
  overflow-x: auto;
  gap: 1rem;
  scroll-behavior: smooth;
  padding: 0.5rem 0;
}

.articles-list.mobile::-webkit-scrollbar {
  display: none;
}

.article-card.mobile {
  flex: 0 0 260px;
  min-width: 260px;
}

.scroll-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  z-index: 10;
  background: white;
  border: 2px solid #154484;
  cursor: pointer;
  border-radius: 50%;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  color: #154484;
}

.scroll-btn:hover:not(:disabled) {
  background-color: #154484;
  color: white;
  transform: translateY(-50%) scale(1.1);
}

.scroll-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background-color: #f5f5f5;
  border-color: #ddd;
  color: #999;
}

.scroll-btn.left { 
  left: -20px; 
}

.scroll-btn.right { 
  right: -20px; 
}

/* Desktop & Tablet Grid */
.articles-list.tablet {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.8rem;
}

.articles-list.desktop {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}

/* Pagination Styles */
.pagination-controls {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1.5rem;
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e9ecef;
}


.pagination-btn {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.6rem 1.2rem;
  background: white;
  border: 2px solid #154484;
  border-radius: 25px;
  color: #154484;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.8rem;
}

.pagination-btn:hover:not(:disabled) {
  background-color: #154484;
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(21, 68, 132, 0.3);
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background-color: #f8f9fa;
  border-color: #dee2e6;
  color: #6c757d;
}

.pagination-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.page-indicator {
  padding: 0.5rem 1rem;
  background: linear-gradient(45deg, #154484, #1e5aa8);
  color: white;
  border-radius: 20px;
  font-weight: 600;
  font-size: 0.85rem;
  box-shadow: 0 2px 8px rgba(21, 68, 132, 0.3);
  min-width: 60px;
  text-align: center;
  white-space: nowrap;
  display: inline-block;
}

/* Responsive Adjustments */
@media (max-width: 981px) and (min-width: 481px) {
  .related-articles-section {
    padding: 1.2rem;
  }
  
  .section-title {
    font-size: 1.1rem;
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
    display: -webkit-box;
    -webkit-line-clamp: 2; 
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: ellipsis;
    word-break: break-word;
  }
  
  .article-description {
    font-size: 0.75rem;
    height: calc(0.75rem * 1.4 * 2);
    display: -webkit-box;
    -webkit-line-clamp: 2; 
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: ellipsis;
    word-break: break-word;
    flex-grow: 1;
    text-align: left;
  }
}

@media (min-width: 982px) {
  .articles-list.desktop .article-card {
    display: flex;
    flex-direction: column;
    height: 100%;
    max-width: none;
  }
  
  .articles-list.desktop .article-image-container {
    width: 100%;
    height: 120px;
    background-color: #e0e0e0;
    border-top-left-radius: 8px;
    border-top-right-radius: 8px;
  }
  
  .articles-list.desktop .article-content {
    padding: 0.8rem;
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
    flex-grow: 1;
  }
  
  .articles-list.desktop .article-title {
    font-size: 0.9rem;
    color: #333;
    margin-bottom: 0.2rem;
    font-weight: 600;
    line-height: 1.3;
    overflow: hidden;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    text-overflow: ellipsis;
    word-break: break-word;
    height: calc(0.9rem * 1.3 * 2);
  }
  
  .articles-list.desktop .article-description {
    display: -webkit-box;
    font-size: 0.8rem;
    color: #777;
    margin-bottom: 0.6rem;
    line-height: 1.4;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: ellipsis;
    word-break: break-word;
    height: calc(0.8rem * 1.4 * 2);
    flex-grow: 1;
  }
  
  .articles-list.desktop .article-meta-list {
    font-size: 0.75rem;
    color: #888;
    margin-top: 0.4rem;
    margin-bottom: 0.4rem;
  }
}

@media (max-width: 480px) {
  .related-articles-section {
    padding: 1rem;
  }
  
  .section-title {
    font-size: 1.1rem;
    margin-bottom: 1rem;
  }
  
  .article-card.mobile {
    flex: 0 0 240px;
    min-width: 240px;
  }
  
  .article-image-container {
    height: 100px;
  }
  
  .article-content {
    padding: 0.7rem;
  }
  
  .article-title {
    font-size: 0.85rem;
    height: calc(0.85rem * 1.4 * 2);
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: ellipsis;
    word-break: break-word;
  }
  
  .article-description {
    font-size: 0.75rem;
    height: calc(0.75rem * 1.5 * 2);
    -webkit-line-clamp: 2;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: ellipsis;
    word-break: break-word;
  }
  
  .scroll-btn {
    width: 36px;
    height: 36px;
  }
  
  .scroll-btn.left { 
    left: -18px; 
  }
  
  .scroll-btn.right { 
    right: -18px; 
  }
}
</style>