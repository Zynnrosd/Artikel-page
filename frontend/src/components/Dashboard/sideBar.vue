<template>
  <div>
    <!-- Sidebar -->
    <div class="sidebar" ref="sidebar" :class="{ 'is-open': sidebarOpen }">
      <div class="logo-container">
        <img src="../../assets/logo_mandala_bg.svg" alt="Logo" class="logo" />
      </div>

      <nav class="navigation">
        <ul class="bodyr1">
          <li class="nav-item">
            <router-link
              class="nav-but"
              to="/dashboardadmin"
              :class="{ active: activeMenu === 'Dashboard' }"
              @click.native="setActive('Dashboard')"
            >
              <img src="@/assets/icons/admin/home.svg" alt="Home Icon" class="icon-white">
              <span>Dashboard</span>
            </router-link>
          </li>

          <li class="nav-item">
            <router-link
              class="nav-but"
              to="/dashboardadmin/siswa"
              :class="{ active: activeMenu === 'Siswa' }"
              @click.native="setActive('Siswa')"
            >
              <img src="@/assets/icons/admin/siswa.svg" alt="Siswa Icon" class="icon-white">
              <span>Siswa</span>
            </router-link>
          </li>

          <li class="nav-item">
            <router-link
              class="nav-but"
              to="/dashboardadmin/tutor"
              :class="{ active: activeMenu === 'Tutor' }"
              @click.native="setActive('Tutor')"
            >
              <img src="@/assets/icons/admin/teacher.svg" alt="Tutor Icon" class="icon-white">
              <span>Tutor</span>
            </router-link>
          </li>

          <li class="nav-item">
            <router-link
              class="nav-but"
              to="/dashboardadmin/programadmin"
              :class="{ active: activeMenu === 'Program' }"
              @click.native="setActive('Program')"
            >
              <img src="@/assets/icons/admin/program.svg" alt="Program Icon" class="icon-white">
              <span>Program</span>
            </router-link>
          </li>

          <li class="nav-item">
            <router-link
              class="nav-but"
              to="/dashboardadmin/jadwal"
              :class="{ active: activeMenu === 'Jadwal Program Aktif' }"
              @click.native="setActive('Jadwal Program Aktif')"
            >
              <img src="@/assets/icons/admin/jpa.svg" alt="JPA Icon" class="icon-white">
              <span>Jadwal Program Aktif</span>
            </router-link>
          </li>

          <li class="nav-item">
            <router-link
              class="nav-but"
              to="/dashboardadmin/catatanbiaya"
              :class="{ active: activeMenu === 'Catatan & Biaya' }"
              @click.native="setActive('Catatan & Biaya')"
            >
              <img src="@/assets/icons/admin/cb.svg" alt="CB Icon" class="icon-white">
              <span>Catatan & Biaya</span>
            </router-link>
          </li>

          <li class="nav-item has-submenu">
            <a @click.prevent="toggleSubmenu('artikel')" :class="{ 'active': activeSubmenu === 'artikel' }" class="nav-but">
              <ion-icon name="document-text-outline" class="icon-white"></ion-icon>
              <span>Artikel</span>
              <ion-icon name="chevron-down-outline" class="submenu-icon" :class="{ 'rotate': activeSubmenu === 'artikel' }"></ion-icon>
            </a>
            <ul v-if="activeSubmenu === 'artikel'" class="submenu">
              <li>
                <router-link :to="{ name: 'TambahArtikelAdmin' }">Tambah Artikel</router-link>
              </li>
              <li>
                <router-link :to="{ name: 'KelolaKategoriAdmin' }">Kelola Kategori</router-link>
              </li>
              <li>
                <router-link :to="{ name: 'DaftarArtikelAdmin' }">Daftar Artikel</router-link>
              </li>
            </ul>
          </li>
          </ul>
      </nav>

      <n-divider />

      <div class="sidebar-bottom bodyr1">
        <ul>
          <li class="nav-item">
            <a class="nav-but" href="#" @click.prevent="handleLogout">
              <img src="@/assets/icons/admin/logout.svg" alt="Logout Icon" class="icon-white">
              <span>Log Out</span>
            </a>
          </li>
        </ul>
      </div>
    </div>
    <!-- Burger Menu (mobile only) -->
    <div class="burger-menu" ref="burger" @click="toggleSidebar" v-show="!sidebarOpen">
      <p class="buttonb1">Menu</p>
    </div>
  </div>
</template>

<script>
export default {
  name: 'SidebarNav',
  data() {
    return {
      sidebarOpen: false,
      activeMenu: 'Dashboard', // default menu aktif
      IsArtikelSubmenuOpen: false
    };
  },
  methods: {
    toggleSidebar() {
      this.sidebarOpen = !this.sidebarOpen;
    },
     toggleSubmenu(menuName) { // METHOD INI DITAMBAHKAN
      this.activeSubmenu = this.activeSubmenu === menuName ? null : menuName;
      // Opsional: nonaktifkan menu utama saat submenu dibuka
      if (this.activeSubmenu) {
        this.activeMenu = null;
      }
    },
    handleClickOutside(event) {
      const isMobile = window.innerWidth <= 768;
      if (
        isMobile &&
        this.sidebarOpen &&
        !this.$refs.sidebar.contains(event.target) &&
        !this.$refs.burger.contains(event.target)
      ) {
        this.sidebarOpen = false;
      }
    },
    setActive(menu) {
      this.activeMenu = menu;
      if (menu !== 'Artikel') {
        this.activeSubmenu = null;
      }
    },
    handleLogout() {
      localStorage.removeItem('token');
      this.$router.push('/auth');
    }
  },
  mounted() {
    document.addEventListener('click', this.handleClickOutside);
  },
  beforeUnmount() {
    document.removeEventListener('click', this.handleClickOutside);
  }
};
</script>

<style scoped>
.sidebar {
  top: 0;
  left: 0;
  width: 256px;
  height: 100vh;
  background-color: #0B2343;
  color: #fff;
  display: flex;
  flex-direction: column;
  padding: 20px;
  font-family: sans-serif;
  z-index: 1000;
  overflow-y: auto;
  transition: transform 0.3s ease;
}

/* Logo */
.logo-container {
  background-color: white;
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 60px;
  padding: 0px 12px;
}

.logo {
  height: 50px;
}

.navigation {
  margin-top: 20px;
}

.icon-white {
  width: 20px;
  height: 20px;
  filter: brightness(0) invert(1);
}

.nav-but {
  display: flex;
  flex-direction: row;
  gap: 8px;
}

.navigation ul,
.sidebar-bottom ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.nav-item a {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  color: #fff;
  text-decoration: none;
  border-radius: 25px;
  transition: background-color 0.3s ease;
}

.nav-item a:hover,
.nav-item a.active {
  background-color: #1a1a1a;
}

.nav-item a.active {
  background-color: #154484;
  color: #fff;
}

.nav-item span {
  font-size: 0.95em;
}

.notification-badge {
  width: 8px;
  height: 8px;
  background-color: #ff8c00;
  border-radius: 50%;
  margin-left: auto;
  align-self: flex-start;
  margin-top: 5px;
}

/* Burger Menu */
.burger-menu {
  display: none;
  position: fixed;
  top: 20px;
  z-index: 1100;
  background-color: orange;
  border-radius: 0 8px 8px 0;
  padding: 8px;
}

.buttonb1 {
  color: white;
}

.has-submenu {
    position: relative;
    list-style: none; /* Pastikan list-style tidak muncul */
}

.has-submenu a { /* Styling untuk parent link */
    cursor: pointer;
    text-decoration: none;
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: space-between; /* Tambahkan ini agar panah di kanan */
    padding: 12px 16px;
    border-radius: 25px;
    transition: background-color 0.3s ease;
}

.has-submenu a:hover {
    background-color: #1a1a1a;
}

.submenu-icon {
    transition: transform 0.3s ease;
    margin-left: auto;
    width: 20px;
    height: 20px;
}

.submenu-icon.rotate {
    transform: rotate(180deg);
}

.submenu {
    list-style: none;
    padding: 0;
    margin: 0.5rem 0 0.5rem 0; /* Hapus margin kiri */
    /* Padding kiri ini yang akan membuat indentasi */
    /* 44px adalah perkiraan dari (padding kiri nav-but 16px + lebar ikon 20px + gap 8px) */
    padding-left: 44px;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}


.submenu li a {
    color: #b0b0b0;
    text-decoration: none;
    padding: 0.5rem 2.85rem;
    border-radius: 25px;
    transition: all 0.2s ease;
    font-size: 0.9em;
}

.submenu a.router-link-exact-active {
    /* Hapus background-color dan border-left */
    background-color: transparent; /* Pastikan tidak ada warna latar belakang */
    color: #fff; /* Jadikan warna teks putih agar lebih jelas */
    position: relative; /* Penting agar pseudo-element bisa diposisikan */
    padding-left: calc(2.85rem + 15px); 
  }

/* Tambahkan panah > di sebelah kiri link */
.submenu a.router-link-exact-active::before {
    content: '>'; /* Karakter panah */
    position: absolute;
    left: 1rem; /* Sesuaikan posisi panah */
    font-weight: bold;
    color: #fff;
}

.submenu li a:hover {
    background-color: #1a1a1a;
    color: #fff;
}

/* Responsiveness */
@media (max-width: 768px) {
  .sidebar {
    transform: translateX(-100%);
    position: fixed;
  }

  .sidebar.is-open {
    transform: translateX(0);
  }

  .burger-menu {
    display: block;
  }
}
</style>