<template>
  <div class="category-tabs-wrapper">
    <button class="scroll-btn left" @click="scrollLeft" v-show="showLeft">
      <ion-icon name="chevron-back-outline"></ion-icon>
    </button>
    
     <div :class="['category-tabs', {'center-items': !isOverflowing}]" ref="tabsContainer" @scroll="handleScroll">
      <button
        v-for="tab in categories"
        :key="tab.key"
        :class="{ 'tab-button': true, 'active': activeTab === tab.key }"
        @click="$emit('update:activeTab', tab.key)"
      >
        {{ tab.label }}
      </button>
    </div>

    <button class="scroll-btn right" @click="scrollRight" v-show="showRight">
      <ion-icon name="chevron-forward-outline"></ion-icon>
    </button>
  </div>
</template>


<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';

const props = defineProps({
  categories: {
    type: Array,
    required: true,
  },
  activeTab: String,
});

defineEmits(['update:activeTab']);

const tabsContainer = ref(null);
const showLeft = ref(false);
const showRight = ref(false);
const isOverflowing = ref(false);

const scrollLeft = () => {
  tabsContainer.value.scrollBy({ left: -200, behavior: 'smooth' });
};

const scrollRight = () => {
  tabsContainer.value.scrollBy({ left: 200, behavior: 'smooth' });
};

const handleScroll = () => {
  const el = tabsContainer.value;
  if (!el) return;

  isOverflowing.value = el.scrollWidth > el.clientWidth;
  showLeft.value = isOverflowing && el.scrollLeft > 5;
  showRight.value = isOverflowing && (el.scrollLeft + el.clientWidth) < el.scrollWidth - 5;
};

onMounted(() => {
  const el = tabsContainer.value;
  if (el) {
    handleScroll();
    el.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleScroll);
  }
});

onBeforeUnmount(() => {
  const el = tabsContainer.value;
  if (el) {
    el.removeEventListener('scroll', handleScroll);
    window.removeEventListener('resize', handleScroll);
  }
});
</script>

<style scoped>
.category-tabs-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  width: 100%;
  margin: 0 auto 1rem; 
  max-width: 1000px; 
  padding: 0 3rem; 
  box-sizing: border-box;
  overflow: hidden;
}

.category-tabs {
  display: flex;
  flex-wrap: nowrap;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scroll-behavior: smooth;
  gap: 1rem;
  padding: 0.5rem 0;
  scrollbar-width: none;
  width: max-content;       
  max-width: 100%;          
  margin: 0 auto;          
}
.category-tabs.center-items {
  justify-content: center;
}
.category-tabs::-webkit-scrollbar {
  display: none;
}

.tab-button {
  background-color: #e0e0e0;
  color: #555;
  padding: 0.7rem 1.3rem;
  border: none;
  border-radius: 25px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 500;
  white-space: nowrap;
  flex-shrink: 0;
}

.tab-button:hover {
  background-color: #d0d0d0;
}

.tab-button.active {
  background-color: #FB8312;
  color: white;
  font-weight: 600;
}

.scroll-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background-color: white;
  border: 1px solid #ccc;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #154484;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 5px rgba(0,0,0,0.1);
  z-index: 10;
}
.scroll-btn:hover {
  background-color: #f0f0f0;
}
.scroll-btn.left {
  left: 0;
}
.scroll-btn.right {
  right: 0;
}
.scroll-btn ion-icon {
  font-size: 1.5rem; 
}

/* Responsive adjustments */
@media (max-width: 981px) {
  .category-tabs-wrapper {
    max-width: 100%;
    padding: 0 3rem;
    margin-bottom: 2rem;
  }
  .category-tabs {
    padding: 0.5rem;
    gap: 0.8rem;
  }
  
}

@media (max-width: 480px) {
  .category-tabs-wrapper {
    margin-bottom: 1.5rem;
  }
  .category-tabs {
    padding: 0.5rem;
    gap: 0.5rem;
  }
  .tab-button {
    font-size: 0.9rem;
    padding: 0.6rem 1rem;
  }
}
</style>