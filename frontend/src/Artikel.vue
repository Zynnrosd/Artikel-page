<template>
  <div class="artikel-page">
    <Navbar />

    <div class="content-wrapper">
      <ArtikelContent />
    </div>

    <Footer />
  </div>
</template>

<script setup>
import Navbar from './components/navbar.vue'; 
import Footer from './components/footer.vue'; 
import ArtikelContent from './components/artikel/ArtikelContent.vue'; 

</script>

<style scoped>
.artikel-page {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: #f8f8f8;
}

.content-wrapper {
  flex-grow: 1;
  padding: 2rem 4rem;
  width: 100%;
  box-sizing: border-box;
  transition: padding 0.3s ease;
}

/* Responsive adjustments for Artikel.vue general layout */
@media (max-width: 981px) { 
  .content-wrapper {
    padding: 2rem 2rem; 
    max-width: 100%;
  }
}

@media (max-width: 480px) {
  .content-wrapper {
    padding: 5rem 1rem 1rem 1rem;
  }
}
</style>