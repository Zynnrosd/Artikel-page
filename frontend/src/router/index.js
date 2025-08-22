import { createRouter, createWebHistory } from 'vue-router'
import Main from '../Main.vue';
import Home from '../Home.vue'; 
import TentangKami from '../TentangKami.vue';
import DetailProgram from '../detailProgram.vue';
import Artikel from '../Artikel.vue' 
import IsiArtikel from'../IsiArtikel.vue'

import Program from '@/components/listProgram/program.vue'
import programBelajar from '../components/detailProgram/program.vue'
import PemesananProgram from '../components/detailProgram/PemesananProgram.vue';

import PendaftaranTutor from '../pendaftaranTutor.vue';
import AbsenSiswa from '../components/Absen.vue';

import Otp from '@/components/Auth/otp.vue';
import ResetPassword from '@/components/Auth/ResetPassword.vue';
import ResetPasswordEmail from '@/components/Auth/ResetPassword_Email.vue';
import ResetPasswordPass from '@/components/Auth/ResetPassword_Password.vue';

import Jadwal from '@/components/Jadwal.vue';
import TabelJadwal from '@/components/jadwal/TabelJadwal.vue'
import DetailJadwal from '@/components/jadwal/DetailJadwal.vue'

import ProfileUser from '@/components/ProfileUser.vue'
import User from '@/components/Profile/User.vue'
import EditProfile from '@/components/Profile/EditProfile.vue'
import EditProfileTutor from '@/components/Profile/EditProfileTutor.vue'
import Rekap from '@/components/rekap.vue'
import GoogleSuccess from '@/components/Auth/GoogleSuccess.vue';

import Dashboardadmin from '@/components/Dashboard/DashboardParent.vue';
import HomeAdmin from '@/components/Dashboard/dashboard.vue';

import Siswa from '@/components/Dashboard/dashboardSiswa/siswa.vue';
import siswaMain from '@/components/Dashboard/dashboardSiswa/siswaMain.vue';
import DetailSiswa from '@/components/Dashboard/dashboardSiswa/siswaDetail.vue';
import EditProfileSiswa from '@/components/Dashboard/dashboardSiswa/editProfileForm.vue';
import TambahSiswa from '@/components/Dashboard/dashboardSiswa/tambahSiswa.vue';

import Tutor from '@/components/Dashboard/dashboardTutor/Tutor.vue';
import TutorMain from '@/components/Dashboard/dashboardTutor/TutorMain.vue';
import TambahTutor from '@/components/Dashboard/dashboardTutor/TambahTutor.vue';
import EditTutor from '@/components/Dashboard/dashboardTutor/TutorEditForm.vue';
import TutorProfile from '@/components/Dashboard/dashboardTutor/TutorProfile.vue';
import VerifikasiTutor from '@/components/Dashboard/dashboardTutor/TutorVerification.vue';
import VerificationSuccess from '@/components/Dashboard/dashboardTutor/VerificationSuccess.vue';

import JadwalAdmin from '@/components/Dashboard/dashboardJadwal/jadwal.vue';
import JadwalAdminView from '@/components/Dashboard/dashboardJadwal/jadwalview.vue';
import DetailJadwalAktif from '@/components/Dashboard/dashboardJadwal/DetailJadwal.vue'

import ProgramAdmin from '@/components/Dashboard/dashboardProgram/ProgramAdmin.vue';
import ProgramMain from '@/components/Dashboard/dashboardProgram/ProgramMain.vue';
import ProgramAdd from '@/components/Dashboard/dashboardProgram/ProgramAdd.vue';
import DetailProgramPrivat from '@/components/Dashboard/dashboardProgram/detailProgramPrivat.vue';
import EditProgramForm from '@/components/Dashboard/dashboardProgram/EditProgramForm.vue';
import VerifProgram from '@/components/Dashboard/dashboardProgram/VerificationPage.vue';
import ProgramScheduleDetail from '@/components/Dashboard/dashboardProgram/ProgramScheduleDetail.vue';

import CatatanBiaya from '@/components/Dashboard/dashboardCatatanBiaya/CatatanBiaya.vue';
import DashboardBiaya from '@/components/Dashboard/dashboardCatatanBiaya/DashboardBiaya.vue';
import DetailProgramSelesai from '@/components/Dashboard/dashboardCatatanBiaya/DetailProgramSelesai.vue';

import FormTambahArtikel from '@/components/Dashboard/dashboardArtikel/FormTambahArtikel.vue';
import FormKelolaKategori from '@/components/Dashboard/dashboardArtikel/FormKelolaKategori.vue';
import FormKelolaAuthor from '@/components/Dashboard/dashboardArtikel/FormKelolaAuthor.vue';
import DaftarArtikelAdmin from '@/components/Dashboard/dashboardArtikel/DaftarArtikelAdmin.vue';
import ArtikelAdminWrapper from '@/components/Dashboard/dashboardArtikel/ArtikelAdminWrapper.vue';
import EditArtikel from '@/components/Dashboard/dashboardArtikel/EditArtikel.vue';

import Error404 from '@/components/error404.vue';
import Error403 from '@/components/error403.vue';


const articleValidationCache = new Map();
const CACHE_DURATION = 2 * 60 * 1000; 


async function validateArticleSlug(slug) {
  const API_BASE = 'http://localhost:3000';
  
  
  const cached = articleValidationCache.get(slug);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.isValid;
  }
  
  try {
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1500);
    
    const response = await fetch(`${API_BASE}/public/articles/${slug}`, {
      signal: controller.signal,
      headers: { 'Accept': 'application/json' }
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      articleValidationCache.set(slug, { isValid: false, timestamp: Date.now() });
      return false;
    }
    
    const data = await response.json();
    const isValid = data.success && data.data && data.data.is_published !== false;
    
    articleValidationCache.set(slug, { isValid, timestamp: Date.now() });
    return isValid;
    
  } catch (error) {
    articleValidationCache.set(slug, { isValid: false, timestamp: Date.now() });
    return false;
  }
}


const isValidSlugFormat = (slug) => {
  return slug && 
         typeof slug === 'string' && 
         slug.trim() !== '' && 
         slug.length >= 3 && 
         slug.length <= 100 &&   
         /^[a-zA-Z0-9-_]+$/.test(slug.trim());
};

const routes = [
  { 
    path: '/', 
    component: Main,
    children: [
      {
        path: '', 
        name: 'Beranda', 
        component: Home,
      },
      { 
        path: 'detailprogram/:id', 
        name: 'DetailProgram', 
        component: DetailProgram,
        children: [
          {
            path: '',
            name: 'ProgramBelajar',
            component: programBelajar
          },
          {
            path: 'pemesananprogram',
            name: 'PemesananProgram',
            component: PemesananProgram
          }
        ]
      },
      { path: 'tentangkami', name: 'TentangKami', component: TentangKami },
      { path: 'program', name: 'Program', component: Program },
      { path: 'pendaftarantutor', name: 'Menjadi Tutor', component: PendaftaranTutor },
      { path: 'absen', name: 'Absen', component: AbsenSiswa },
      { path: 'rekap', name: 'Rekap', component: Rekap },
      { path: 'artikel', name: 'Artikel', component: Artikel },
      {
        path: 'artikel/:slug',
        name: 'isiArtikel', 
        component: IsiArtikel,
       
      },
      { path: '/error403', name: 'Error403', component: Error403 },
      
      {
        path: ':pathMatch(.*)*',
        name: 'NotFound',
        component: Error404
      }
    ]
  },
 
  {
    path: '/otp', 
    component: Otp,
  },
  {
    path: '/resetpassword', 
    component: ResetPassword,
    children: [
      {
        path: '',
        name: 'ResetPasswordEmail', 
        component: ResetPasswordEmail
      },
      {
        path: 'passwordbaru',
        name: 'ResetPasswordPass', 
        component: ResetPasswordPass
      }
    ]
  },
  {
    path: '/jadwal', 
    component: Jadwal,
    children: [
      {
        path: '', 
        name: 'tabeljadwal', 
        component: TabelJadwal,
      },
    ]
  },
  {
    path: '/detailjadwal/:slug', 
    component: DetailJadwal,
  },
  {
    path: '/google/success',
    component: GoogleSuccess
  },
  { 
    path: '/profileuser', 
    component: ProfileUser,
    children: [
      {
        path: '', 
        name: 'User', 
        component: User,
      },
      { 
        path: 'editprofile', 
        name: 'EditProfile', 
        component: EditProfile 
      },
      { 
        path: 'editprofiletutor', 
        name: 'EditProfileTutor', 
        component: EditProfileTutor
      },
    ]
  },
  {
    path: '/dashboardadmin', 
    component: Dashboardadmin,
    meta: { requiresAdmin: true },
    children: [
      {
        path: '',
        name: 'HomeAdmin',
        component: HomeAdmin,
      },
      {
        path: 'siswa',
        name: 'Siswa',
        component: Siswa,
        children: [
          {
            path: '',
            name: 'siswaMain',
            component: siswaMain,
          },
          {
            path: ':id',
            name: 'DetailSiswa',
            component: DetailSiswa,
          },
          {
            path: 'edit/:id',
            name: 'EditProfileSiswa',
            component: EditProfileSiswa,
          },
          {
            path: 'tambahsiswa',
            name: 'TambahSiswa',
            component: TambahSiswa,
          },
        ]
      },
      {
        path: 'tutor',
        name: 'Tutor',
        component: Tutor,
        children: [
          {
            path: '',
            name: 'TutorMain',
            component: TutorMain
          },
          {
            path: 'tambahtutor',
            name: 'TambahTutor',
            component: TambahTutor
          },
          {
            path: 'profiltutor/:id',
            name: 'TutorProfile',
            component: TutorProfile
          },
          {
            path: 'edittutor/:id',
            name: 'EditTutor',
            component: EditTutor
          },
          {
            path: 'verifikasitutor/:id',
            name: 'VerifikasiTutor',
            component: VerifikasiTutor
          },
          {
            path: 'verifikasisukses',
            name: 'VerificationSuccess',
            component: VerificationSuccess
          },

        ]
      },
      {
        path: 'programadmin',
        name: 'ProgramAdmin',
        component: ProgramAdmin,
        children: [
          {
            path: '',
            name: 'ProgramMain',
            component: ProgramMain,
          },
          {
            path: 'tambahprogram',
            name: 'ProgramAdd',
            component: ProgramAdd,
          },
          {
            path: 'detailprogram/:slug',
            name: 'DetailProgramPrivat',
            component: DetailProgramPrivat,
          },
          {
            path: 'editprogram/:slug',
            name: 'EditProgramForm',
            component: EditProgramForm,
          },
          {
            path: 'verif/:id',
            name: 'VerifProgram',
            component: VerifProgram,
          },
          {
            path: 'detail/:orderId',
            name: 'ProgramScheduleDetail',
            component: ProgramScheduleDetail,
          },
        ]
      },
      {
        path: 'jadwal',
        name: 'JadwalAdmin',
        component: JadwalAdmin,
        children: [
          {
            path: '',
            name: 'JadwalAdminView',
            component: JadwalAdminView
          },
          {
            path: 'detailjadwalaktif/:slug',
            name: 'DetailJadwalAktif',
            component: DetailJadwalAktif
          },
        ]
      },
      {
        path: 'catatanbiaya',
        name: 'CatatanBiaya',
        component: CatatanBiaya,
        children: [
          {
            path: '',
            name: 'DashboardBiaya',
            component: DashboardBiaya
          },
          {
            path: 'detail/:classId',
            name: 'DetailProgramSelesai',
            component: DetailProgramSelesai
          },
        ]
      },
      {
        path: 'artikel',
        name: 'ArtikelAdminWrapper',
        component: ArtikelAdminWrapper,
        children: [
          {
            path: 'tambah',
            name: 'TambahArtikelAdmin',
            component: FormTambahArtikel,
          },
          {
            path: 'kategori',
            name: 'KelolaKategoriAdmin',
            component: FormKelolaKategori,
          },
          {
            path: 'author',
            name: 'KelolaAuthorAdmin',
            component: FormKelolaAuthor,
          },
          {
            path: 'daftar',
            name: 'DaftarArtikelAdmin',
            component: DaftarArtikelAdmin,
          },
          {
            path: 'edit/:id',
            name: 'EditArtikelAdmin',
            component: EditArtikel,
            props: true
          },
        ]
      },
    ]
  }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

import { ref, onMounted } from 'vue'

const isTutor = ref(false)

onMounted(async () => {
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
})


router.beforeEach(async (to, from, next) => {
  
  const publicRoutes = ['Beranda', 'TentangKami', 'Program', 'Artikel', 'isiArtikel', 'NotFound', 'Error403'];
  if (publicRoutes.includes(to.name)) {
    return next();
  }

  const token = localStorage.getItem('token');
  
  if (!token) {
    return next();
  }

  if (!to.matched.some(record => record.meta.requiresAdmin)) {
    return next();
  }

  try {
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1000);
    
    const res = await fetch('/users/me', {
      signal: controller.signal,
      headers: { 'Authorization': `Bearer ${token}` }
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      localStorage.removeItem('token');
      return next({ name: 'Error403', replace: true });
    }

    const data = await res.json();
    const userRole = data.data?.role;

    if (userRole !== 'admin') {
      return next({ name: 'Error403', replace: true });
    }

    next();
  } catch (error) {
    localStorage.removeItem('token');
    return next({ name: 'Error403', replace: true });
  }
});

export default router