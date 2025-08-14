<template>
  <div class="detail-artikel-page">
    <Navbar />

    <div class="content-wrapper">
      <IsiArtikelContent />
    </div>

    <Footer />
  </div>
</template>

<script setup>
import Navbar from './components/navbar.vue'; 
import Footer from './components/footer.vue'; 
import IsiArtikelContent from './components/artikel/IsiArtikelContent.vue';
</script>

<style scoped>
.detail-artikel-page {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: #f0f2f5;
}

.content-wrapper {
  flex-grow: 1;
  padding: 1.5rem 2.5rem 2.5rem;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
  box-sizing: border-box;
  margin-top: 4rem;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08); 
  margin-bottom: 4rem;
  transition: all 0.3s ease-in-out;
}

/* Responsive adjustments */
@media (max-width: 981px) {
  .content-wrapper {
    padding: 1rem 1.5rem 1.5rem;
    margin-top: 4rem;
    max-width: 100%;
    border-radius: 8px;
    box-shadow: none;
  }
}

@media (max-width: 480px) {
  .content-wrapper {
    padding: 0.8rem 1rem 1rem;
    margin-top: 2rem;
    margin-bottom: 2.5rem;
  }
}
</style>