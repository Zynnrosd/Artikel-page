<script setup>
import butDaftar from './dirButton/butDaftar.vue';
import butMasuk from './dirButton/butMasuk.vue';
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { NLayout, NLayoutHeader, NMenu, NButton, NDrawer } from 'naive-ui';
import ButSecondNormal from './dirButton/butSecondNormal.vue';

const props = defineProps({});

const router = useRouter();
const route = useRoute();

// State management
const isDesktop = ref(window.innerWidth >= 981);
const drawerVisible = ref(false);
const currentRoute = ref(route.name);
const showNotificationPopup = ref(false);
const isLoggedIn = ref(!!localStorage.getItem('token'))

const notifications = ref([]);

function formatNotifTime(dateStr) {
  const now = new Date();
  const date = new Date(dateStr);
  const diff = now - date;
  if (diff < 86400000) {
    return dateStr.slice(11, 16);
  }
  return date.toLocaleDateString('id-ID');
}

const unreadCount = computed(() => notifications.value.filter(n => !n.read).length);

const menuOptionsLoggedOut = [
  { label: 'Beranda', key: 'Beranda', to: '/' },
  { label: 'Tentang Kami', key: 'TentangKami', to: '/tentangkami' },
  { label: 'Program', key: 'Program', to: '/program' },
  { label: 'Menjadi Tutor', key: 'Menjadi Tutor', to: '/pendaftarantutor' },
  { label: 'Artikel', key: 'Artikel', to: '/artikel' },
  { label: 'Daftar', key: 'Daftar', to: '/daftar' },
  { label: 'Masuk', key: 'Masuk', to: '/auth' },
];

const menuOptionsLoggedIn = [
  { label: 'Beranda', key: 'Beranda', to: '/' },
  { label: 'Tentang Kami', key: 'TentangKami', to: '/tentangkami' },
  { label: 'Absen', key: 'Absen', to: '/absen' },
  { label: 'Program', key: 'Program', to: '/program' },
  { label: 'Artikel', key: 'Artikel', to: '/artikel' },
  { label: 'Rekap', key: 'Rekap', to: '/rekap' },
];

const menuTheme = {
  itemTextColor: '#9BAFCB',
  borderRadius: '6px',
  itemColorHover: '#154484',
  fontSize: '16px',
  colorHover: '#FB8312',
};

const filteredMenuOptions = computed(() => {
  if (isLoggedIn.value) {
    return menuOptionsLoggedIn;
  }
  if (isDesktop.value) {
    return menuOptionsLoggedOut.filter(option => 
      option.key !== 'Daftar' && option.key !== 'Masuk'
    );
  }
  return menuOptionsLoggedOut;
});

const goToSchedule = () => {
  showNotificationPopup.value = false;
  router.push('/jadwal');
};

const handleResize = () => {
  isDesktop.value = window.innerWidth >= 981;
};

const toggleMenu = () => {
  drawerVisible.value = !drawerVisible.value;
};

const handleMenuClick = (key) => {
  const selectedOption = filteredMenuOptions.value.find(option => option.key === key);
  if (selectedOption?.to) {
    router.push(selectedOption.to);
  }
  drawerVisible.value = false;
};

const toggleNotifications = () => {
  showNotificationPopup.value = !showNotificationPopup.value;
  if (!showNotificationPopup.value) {
    fetchNotifications();
  } else {
    notifications.value.forEach(n => n.read = true);
  }
};

const closeNotifications = (event) => {
  if (!event.target.closest('.notification-popup') && 
      !event.target.closest('.notification-wrapper')) {
    showNotificationPopup.value = false;
    markAllNotificationsRead();
  }
};

const markAllNotificationsRead = async () => {
  try {
    const token = localStorage.getItem('token');
    await fetch('/notification', {
      method: 'POST',
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json'
      }
    });
    await fetchNotifications();
  } catch (err) {}
};

watch(
  () => route.name,
  (newRoute) => {
    currentRoute.value = newRoute;
  }
);

let timeInterval = null;
const isTutor = ref(false)

onMounted(async () => {
  window.addEventListener('resize', handleResize);
  document.addEventListener('click', closeNotifications);
  await fetchNotifications();

  const token = localStorage.getItem('token')
  if (!token) return
  const res = await fetch('/users/me', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
  if (res.ok) {
    const data = await res.json()
    isTutor.value = data.data?.role === 'tutor'
  }
});

onBeforeUnmount(() => {
  if (timeInterval) clearInterval(timeInterval);
  window.removeEventListener('resize', handleResize);
  document.removeEventListener('click', closeNotifications);
});

async function fetchNotifications() {
  try {
    const token = localStorage.getItem('token');
    const res = await fetch('/notification', {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    const result = await res.json();
    notifications.value = (result.data || []).map(item => ({
      id: item.id,
      type: item.type === 'Perubahan Jadwal' ? 'Jadwal' : item.type,
      message: item.description,
      read: item.viewed,
      createdAt: item.createdAt,
      photo: item.photo
        ? (item.photo.startsWith('http') ? item.photo : `${item.photo}`)
        : '/mandala.png',
      reason: item.reason,
      scheduleId: item.scheduleId
    }));
  } catch (err) {
    notifications.value = [];
  }
}

const notificationsWithTime = computed(() =>
  notifications.value.map(item => ({
    ...item,
    time: formatNotifTime(item.createdAt)
  }))
);
</script>

<template>
  <n-layout>
    <n-layout-header class="navbar">
      <div class="navbar-wrapper">
        <router-link to="/" class="logo">
          <img src="../assets/logo_mandala.svg" alt="Logo" />
        </router-link>

        <div class="menu-container">
          <n-button
            v-if="!isDesktop"
            class="menu-button"
            @click="toggleMenu"
            aria-label="Toggle menu"
          >
            ☰
          </n-button>

          <template v-else>
            <n-menu
              mode="horizontal"
              :options="filteredMenuOptions"
              :theme-overrides="menuTheme"
              :value="currentRoute"
              @update:value="handleMenuClick"
            />

            <div class="menu-divider"></div>

            <template v-if="!isLoggedIn">
              <butDaftar />
              <butMasuk />
            </template>
            
            <template v-else>
              <div class="user-actions">
                <butSecondNormal 
                v-if="!isTutor" 
                label="Gabung Kelas"
                @click="router.push('/gabungprogram')"
                class="butGabungProgram"
                />
                <div class="notification-wrapper">
                  <button 
                    @click.stop="toggleNotifications"
                    class="action-icon"
                    aria-label="Notifications"
                  >
                    <ion-icon name="notifications-outline"></ion-icon>
                    <span v-if="unreadCount > 0" class="notification-badge">
                      {{ unreadCount }}
                    </span>
                  </button>
                  
                  <div v-if="showNotificationPopup" class="notification-popup">
                    <div class="notification-header">
                      <h3 class="headersb2">Notifikasi</h3>
                      <button 
                        @click.stop="showNotificationPopup = false" 
                        class="close-btn"
                      >
                        <ion-icon name="close-outline"></ion-icon>
                      </button>
                    </div>
                    
                    <div class="notification-list">
                      <div 
                        v-for="notification in notificationsWithTime" 
                        :key="notification.id"
                        class="notification-item"
                        :class="{ 'unread': !notification.read }"
                      >
                        <span v-if="!notification.read" class="unread-dot"></span>
                        <div class="notification-photo">
                          <img 
                            :src="notification.photo" 
                            alt="Foto notifikasi" 
                          />
                        </div>
                        
                        <div class="notification-content">
                          <h4 class="bodyb2">{{ notification.type }}</h4>
                          <p class="bodyr3" v-html="notification.message"></p>
                          <div v-if="notification.type === 'Izin' && notification.reason" class="reason-box">
                            <div class="reason-label">Alasan Izin:</div>
                            <div class="reason-text bodyr3">{{ notification.reason }}</div>
                          </div>
                          <span class="notification-time bodyr3">
                            {{ notification.time }}
                          </span>
                          
                          <div 
                            v-if="notification.type === 'Jadwal'" 
                            class="notification-actions"
                          >
                            <n-button 
                              size="small"
                                @click.stop="goToSchedule()"
                              class="schedule-button buttonm4"
                              round
                            >
                              Lihat Jadwal
                            </n-button>
                          </div>
                        </div>
                      </div>

                      <div 
                        v-if="notifications.length === 0" 
                        class="empty-notifications"
                      >
                        Tidak ada notifikasi
                      </div>
                    </div>
                  </div>
                </div>
                
                <router-link 
                  to="/jadwal" 
                  class="action-icon"
                  aria-label="Schedule"
                >
                  <ion-icon name="calendar-outline"></ion-icon>
                </router-link>
                
                <router-link 
                  to="/profileuser" 
                  class="action-icon"
                  aria-label="Account"
                >
                  <ion-icon name="person-outline"></ion-icon>
                </router-link>
              </div>
            </template>
          </template>

          <n-drawer
            v-if="!isDesktop"
            v-model:show="drawerVisible"
            placement="right"
            :width="260"
          >            
            <div class="mobile-auth-actions" v-if="isLoggedIn">
              <div class="headNav-Mobile">
                <div class="user-actions mobile-wrapper">
                  <div class="notification-wrapper">
                    <button 
                      @click.stop="toggleNotifications"
                      class="action-icon"
                      aria-label="Notifications"
                    >
                      <ion-icon name="notifications-outline"></ion-icon>
                      <span v-if="unreadCount > 0" class="notification-badge">
                        {{ unreadCount }}
                      </span>
                    </button>
                    
                    <div v-if="showNotificationPopup" class="notification-popup">
                      <div class="notification-header">
                        <h3 class="headersb2">Notifikasi</h3>
                        <button 
                          @click.stop="showNotificationPopup = false" 
                          class="close-btn"
                        >
                          <ion-icon name="close-outline"></ion-icon>
                        </button>
                      </div>
                      
                      <div class="notification-list">
                        <div 
                          v-for="notification in notificationsWithTime" 
                          :key="notification.id"
                          class="notification-item"
                          :class="{ 'unread': !notification.read }"
                        >
                          <div class="notification-photo">
                            <img 
                              :src="notification.photo" 
                              alt="Foto notifikasi" 
                            />
                          </div>
                          
                          <div class="notification-content">
                            <h4 class="bodyb2">{{ notification.type }}</h4>
                            <p class="bodyr3" v-html="notification.message"></p>
                            <div v-if="notification.type === 'Izin' && notification.reason" class="reason-box">
                              <div class="reason-label">Alasan Izin:</div>
                              <div class="reason-text bodyr3">{{ notification.reason }}</div>
                            </div>
                            <span class="notification-time bodyr3">
                              {{ notification.time }}
                            </span>
                            
                            <div 
                              v-if="notification.type === 'Jadwal'" 
                              class="notification-actions"
                            >
                              <n-button 
                                size="small" 
                                @click.stop="goToSchedule()"
                                class="schedule-button"
                              >
                                Lihat Jadwal
                              </n-button>
                            </div>
                          </div>
                        </div>

                        <div 
                          v-if="notifications.length === 0" 
                          class="empty-notifications"
                        >
                          Tidak ada notifikasi
                        </div>
                      </div>
                      
                      <router-link 
                        to="/notification" 
                        class="view-all"
                        @click.stop="showNotificationPopup = false"
                      >
                        Lihat Semua Notifikasi
                      </router-link>
                    </div>
                  </div>
                  
                  <router-link 
                    to="/jadwal" 
                    class="action-icon"
                    aria-label="Schedule"
                  >
                    <ion-icon name="calendar-outline"></ion-icon>
                  </router-link>
                  
                  <router-link 
                    to="/profileuser" 
                    class="action-icon"
                    aria-label="Account"
                  >
                    <ion-icon name="person-outline"></ion-icon>
                  </router-link>
                </div>
                <butSecondNormal 
                  v-if="!isTutor" 
                  label="Gabung Kelas"
                  @click="router.push('/gabungprogram')"
                  class="butGabungProgram-mobile"
                />
              </div>
            </div>
            <n-menu
              mode="vertical"
              :options="filteredMenuOptions"
              :theme-overrides="menuTheme"
              @update:value="handleMenuClick"
            />
          </n-drawer>
        </div>
      </div>
    </n-layout-header>
  </n-layout>
</template>

<style scoped>
/* Layout and structure */
.navbar {
  --navbar-height: 68px;
  --navbar-padding-x:  8rem;
  --menu-divider-color: #9BAFCB;
  --icon-color: #154484;
  --icon-hover-color: #FB8312;
  
  width: 100%;
  height: var(--navbar-height);
  position: fixed;
  top: 0;
  left: 0;
  z-index: 1000;
  border-bottom: 2px solid var(--menu-divider-color);
  background-color: white;
  padding: 0 var(--navbar-padding-x);
}

.navbar-wrapper {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  height: 100%;
}

.menu-container {
  display: flex;
  align-items: center;
  gap: 1rem;
  font-family: 'Poppins', sans-serif;
  height: 100%;
}

/* Logo styles */
.logo {
  display: flex;
  align-items: center;
  height: 100%;
}

.logo img {
  height: 56px;
  object-fit: contain;
}

/* Menu divider */
.menu-divider {
  width: 2px;
  height: 32px;
  background-color: var(--menu-divider-color);
  align-self: center;
}

.headNav-Mobile {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* User actions */
.user-actions {
  display: flex;
  gap: 1.5rem;
}

.butGabungProgram {
  margin-left: 1rem;
}

.butGabungProgram-mobile {
  margin: 0 auto;
}

.action-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--icon-color);
  transition: color 0.2s ease;
  position: relative;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
}

.action-icon:hover {
  color: var(--icon-hover-color);
}

ion-icon {
  font-size: 24px;
}

/* Notification styles */
.notification-wrapper {
  position: relative;
  align-content: center;
}

.mobile-wrapper {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 2rem;
} 

.notification-badge {
  position: absolute;
  top: -5px;
  right: -5px;
  background-color: #FF4757;
  color: white;
  border-radius: 50%;
  width: 18px;
  height: 18px;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.notification-popup {
  width: 400px; 
  position: absolute;
  top: 100%;
  right: 0;
  max-height: 500px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  z-index: 1001;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  animation: fadeIn 0.3s ease-out;
}

.notification-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
}

.notification-header h3 {
  color: #154484;
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: #666;
  font-size: 20px;
  display: flex;
  align-items: center;
  padding: 4px;
}

.notification-list {
  overflow-y: auto;
  flex-grow: 1;
}

.notification-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 16px;
  border-bottom: 1px solid #f5f5f5;
  cursor: pointer;
  transition: background-color 0.2s;
}

.notification-photo {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
}

.notification-photo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.notification-content {
  flex-grow: 1;
  min-width: 0;
}

.notification-item:hover {
  background-color: #f9f9f9;
}

.notification-item.unread {
  background-color: #f8f9ff;
}

.notification-content h4 {
  margin: 0 0 4px 0;
  color: #154484;
}

.notification-content p {
  margin: 0 0 4px 0;
  color: #555;
}

.notification-time {
  color: #999;
}

.empty-notifications {
  padding: 16px;
  text-align: center;
  color: #999;
}

.view-all {
  display: block;
  text-align: center;
  padding: 12px;
  font-size: 13px;
  color: #154484;
  text-decoration: none;
  border-top: 1px solid #f0f0f0;
  transition: background-color 0.2s;
}

.view-all:hover {
  background-color: #f5f5f5;
}

/* Notification actions */
.notification-actions {
  margin-top: 8px;
}

.schedule-button {
  background-color: #154484;
  color: white;
  padding: 4px 8px;
}

.schedule-button:hover {
  background-color: #1a56b4;
}

/* Mobile auth actions */
.mobile-auth-actions {
  padding: 1rem;
  border-top: 1px solid #f0f0f0;
  margin-top: 1rem;
}

.user-info {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

/* Menu item styles */
:deep(.n-menu-item) {
  transition: all 0.2s ease;
  border-radius: 8px;
}

:deep(.n-menu-item-content-header:hover),
:deep(.n-menu-item-content:hover) {
  color: var(--icon-hover-color) !important;
}

:deep(.n-menu-item-content--selected .n-menu-item-content-header) {
  color: var(--icon-hover-color) !important;
  font-weight: 600;
}

.reason-box {
  margin-top: 8px;
  padding: 8px;
  background-color: #f8f9fa;
  border-radius: 6px;
  border-left: 3px solid #154484;
}

.reason-label {
  font-size: 12px;
  font-weight: 600;
  color: #555;
  margin-bottom: 4px;
}

.reason-text {
  color: #333;
  line-height: 1.4;
}


@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .navbar {
    padding: 0 2rem;
  }
  .logo img {
  height: 40px;
  }
  .notification-popup {
    width: 90vw;
    max-width: 350px;
    left: 50%; 
    right: auto; 
    transform: translateX(-50%);
    top: 60px; 
    position: fixed; 
  }
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateX(-50%) translateY(-20px);
    }
    to {
      opacity: 1;
      transform: translateX(-50%) translateY(0);
    }
  }
}
</style>