<script setup>
import SideBar from '../sideBar.vue';
</script>

<template>
  <div class="dashboard-container">
    <SideBar />
    <div class="main-content">
      <router-view />
    </div>
  </div>
</template>

<style scoped>
.dashboard-container {
  display: flex;
  height: 100vh;
  background-color: #f5f5f5;
}

.main-content {
  flex: 1;
  overflow-y: auto;
  padding: 2rem;
}
</style>
