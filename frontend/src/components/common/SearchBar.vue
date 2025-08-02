<template>
  <div class="search-bar-container">
    <input
      type="search"
      :value="searchQuery" @input="$emit('update:searchQuery', $event.target.value)" placeholder="Cari artikel..."
      class="search-input"
      @keyup.enter="$emit('performSearch')"
    />
    <button class="search-button" @click="$emit('performSearch')">
      <ion-icon name="search-outline"></ion-icon>
    </button>
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue';

const props = defineProps({
  searchQuery: String,
});

const emit = defineEmits(['update:searchQuery', 'performSearch']); 
</script>

<style scoped>
.search-bar-container {
  display: flex;
  width: 100%;
  max-width: 600px;
  margin: 0 auto 1rem auto;
  border: 1px solid #ccc;
  border-radius: 25px;
  overflow: hidden;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
  align-items: stretch;
  height: 2.6rem;
}

.search-input {
  flex-grow: 1;
  border: none;
  padding: 0 1.2rem;
  font-size: 1rem;
  outline: none;
  height: 100%;
}

.search-input::placeholder {
  color: #888;
}

.search-button {
  background-color: #154484;
  color: white;
  border: none;
  padding: 0 1.2rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.3s ease;
  height: 100%;
  flex-shrink: 0; 
}

.search-button:hover {
  background-color: #0B2343;
}

.search-button ion-icon {
  font-size: 1rem; 
}
</style>