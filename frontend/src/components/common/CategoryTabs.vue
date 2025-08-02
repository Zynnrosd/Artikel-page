<template>
  <div class="category-tabs-wrapper">
    <div class="category-tabs">
      <button
        v-for="tab in categories"
        :key="tab.key"
        :class="{ 'tab-button': true, 'active': activeTab === tab.key }"
        @click="$emit('update:activeTab', tab.key)"
      >
        {{ tab.label }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue';

defineProps({
  categories: {
    type: Array,
    required: true,
  },
  activeTab: String,
});

defineEmits(['update:activeTab']);
</script>

<style scoped>
.category-tabs-wrapper {
  max-width: 600px;
  margin: 0 auto 3rem auto;
  width: 100%;
}

.category-tabs {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.tab-button {
  background-color: #e0e0e0;
  color: #555;
  padding: 0.8rem 1.5rem;
  border: none;
  border-radius: 25px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 500;
}

.tab-button:hover {
  background-color: #d0d0d0;
}

.tab-button.active {
  background-color: #FB8312;
  color: white;
  font-weight: 600;
}

/* Responsive adjustments for tabs */
@media (max-width: 981px) {
  .category-tabs-wrapper {
    max-width: 100%;
    padding: 0 2rem;
    box-sizing: border-box;
  }
  .category-tabs {
    justify-content: center;
    overflow-x: auto;
    white-space: nowrap; 
    padding-bottom: 0.5rem;
  }
}

@media (max-width: 480px) {
  .category-tabs-wrapper {
    padding: 0 1rem;
  }
}
</style>