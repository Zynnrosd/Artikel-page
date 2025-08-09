<script setup>
import SideBar from '../sideBar.vue';
</script>

<template>
    <div class="main-content">
        <router-view />
    </div>
</template>

<style scoped>
.main-content {
  gap: 8px;
  justify-content: space-between;
  padding: 20px;
  overflow-y: auto;
  background-color: #0B2343;
}
</style>
