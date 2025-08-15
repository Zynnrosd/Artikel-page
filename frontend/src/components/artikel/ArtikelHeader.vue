<template>
  <div class="artikel-header">
    <h1 class="page-title">Artikel</h1>
  </div>
</template>

<style scoped>
.artikel-header {
  width: 100%;
  height: 300px;
  background: url('@/assets/articles/background_artikel3.png') center/cover no-repeat;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  margin: 0;
  padding: 0;
}

.artikel-header::after {
  content: "";
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 50px;
  background: linear-gradient(to bottom, rgba(255,255,255,0) 0%, white 100%);
}

.page-title {
  font-size: 5rem;
  font-weight: 800;
  color: white;
  text-align: center;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
  margin: 0;
  z-index: 1;
}

/* Responsive */
@media (max-width: 768px) {
  .page-title {
    font-size: 3rem;
  }
}

@media (max-width: 480px) {
  .page-title {
    font-size: 2.2rem;
  }
}
</style>
