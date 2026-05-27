import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import api from '../utils/api';

const TODAY = new Date();

/* ── STATE AWAL (INITIAL STATE) ── */
/* State awal akan kosong/null sebelum fetch data dari API */
const initialState = {
  profile: {
    name: '',
    type: '',
    email: '',
    phone: '',
    photo: null,
    description: '',
  },
  transactions: [],
  programs: [],
  allocations: [],
  agendas: [],
  members: [],
  duesSettings: { interval: 30, amount: 10000 },
  notifications: [],
};

const AppContext = createContext(null);

export function AppProvider({ children }) {
  // Global State (Local)
  const [state, setState] = useState(initialState);
  
  // Auth State
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  // isLoading=true HANYA saat inisialisasi pertama (cek session saat app mount).
  // Setelah itu selalu false agar tidak muncul blank saat re-fetch (login/refresh token)
  const [isLoading, setIsLoading] = useState(true);
  const hasInitialized = useRef(false);
  const isLoggingOut = useRef(false); // ✅ Flag untuk blokir fetchUser saat logout berlangsung
  
  // Organisasi State
  const [organisasi, setOrganisasi] = useState(null);
  const [organisasiList, setOrganisasiList] = useState([]);
  const [isDataLoading, setIsDataLoading] = useState(false); // true saat fetchTransactions berjalan

  /* ── MANAJEMEN AUTENTIKASI ── */

  // ✅ TAMBAHKAN: Fetch transaksi dari backend
  const fetchTransactions = useCallback(async () => {
    if (!organisasi?.id) {
      console.log('No organisasi, skip fetchTransactions');
      return;
    }
    
    try {
      console.log('Fetching transactions for organisasi:', organisasi.id);
      setIsDataLoading(true); // ✅ Mulai loading
      const { data } = await api.get('/transaksi');
      console.log('Transactions fetched:', data.data);
      
      const mappedTransactions = (data.data || []).map(t => ({
        id: t.id,
        date: t.date,
        type: t.type,
        desc: t.description,
        cat: t.category,
        amount: t.amount,
        status: t.status,
        docs: t.docs || [],  // ✅ Dibaca langsung dari backend
      }));
      
      setState(prev => ({
        ...prev,
        transactions: mappedTransactions
      }));
    } catch (error) {
      console.error("Gagal fetch transaksi:", error);
    } finally {
      setIsDataLoading(false); // ✅ Selesai loading
    }
  }, [organisasi?.id]);

  // Fetch current user & active organisasi
  const fetchUser = useCallback(async () => {
    // ✅ Jangan fetch jika sedang dalam proses logout — mencegah session pulih kembali
    if (isLoggingOut.current) return;

    // Hanya set isLoading=true saat PERTAMA KALI app mount (belum tahu status login).
    // Pemanggilan berikutnya (auth:login_success, dll) tidak perlu loading — konten
    // langsung diupdate tanpa blank screen.
    if (!hasInitialized.current) {
      setIsLoading(true);
    }
    try {
      const { data } = await api.get('/user');
      setUser(data.user);
      setIsAuthenticated(true);
      // Simpan role ke localStorage agar index.html bisa set background yang tepat saat refresh
      localStorage.setItem('mf_last_role', data.user.role);
      
      if (data.organisasi) {
        setOrganisasi(data.organisasi);

        // ✅ Cache org data agar Sidebar/Topbar langsung tampil saat refresh
        try {
          localStorage.setItem('mf_org_cache', JSON.stringify({
            name:     data.organisasi.name     || '',
            type:     data.organisasi.type     || '',
            logo_url: data.organisasi.logo_url || null,
          }));
        } catch (_) {}
        
        // Update local state profile agar backward compatible dengan komponen yang belum migrasi
        setState(s => ({
          ...s,
          profile: {
            ...s.profile,
            name: data.organisasi.name,
            type: data.organisasi.type,
            email: data.organisasi.email || '',
            phone: data.organisasi.phone || '',
            photo: data.organisasi.logo_url,
          },
          duesSettings: {
            interval: data.organisasi.dues_interval ?? 7,
            amount:   data.organisasi.dues_amount   ?? 15000,
            hasSaved: data.organisasi.dues_interval !== null && data.organisasi.dues_interval !== undefined,
          }
        }));
      }
      
      return data;
    } catch (error) {
      // Hanya clear state jika status 401 (Unauthorized)
      // Jika error timeout atau 500, pertahankan state agar tidak ter-logout tiba-tiba
      if (error.response?.status === 401) {
        setUser(null);
        setIsAuthenticated(false);
        setOrganisasi(null);
        setState(initialState);
      }
      throw error;
    } finally {
      setIsLoading(false);
      hasInitialized.current = true;
    }
  }, []);

  const prevOrgId = useRef(null);

  // ✅ EFFECT untuk background polling (real-time suspend detection)
  useEffect(() => {
    if (!isAuthenticated) return;
    const intervalId = setInterval(() => {
      fetchUser().catch(() => {});
    }, 15000); // Polling tiap 15 detik
    return () => clearInterval(intervalId);
  }, [isAuthenticated, fetchUser]);

  // ✅ EFFECT untuk fetch transaksi & agendas & members & programs saat organisasi berubah
  useEffect(() => {
    if (organisasi?.id && isAuthenticated) {
      console.log('Organisasi ready, fetching all data...');
      // Hanya kosongkan data jika ini benar-benar perpindahan organisasi (bukan mount pertama kali)
      if (prevOrgId.current && prevOrgId.current !== organisasi.id) {
        setState(prev => ({
          ...prev,
          transactions: [],
          programs: [],
          allocations: [],
          agendas: [],
          members: [],
        }));
      }
      prevOrgId.current = organisasi.id;

      fetchTransactions();
      fetchAgendas();
      fetchMembers();
      fetchPrograms();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organisasi?.id, isAuthenticated]);

  // ✅ TAMBAHKAN: Fetch notifikasi dari backend
  const fetchNotifications = useCallback(async () => {
    console.log('🔥 fetchNotifications dipanggil, isAuthenticated:', isAuthenticated);
    
    if (!isAuthenticated) {
      console.log('❌ Tidak fetch karena belum authenticated');
      return;
    }
    
    try {
      const { data } = await api.get('/notifications');
      console.log('✅ Data mentah dari API:', data);
      
      // Pastikan data.data adalah array
      const notificationsArray = Array.isArray(data.data) ? data.data : [];
      console.log('📊 Jumlah notifikasi:', notificationsArray.length);
      
      const mappedNotifications = notificationsArray.map(n => ({
        id: n.id,
        text: n.message,  // ← ini yang tampil di UI
        title: n.title,
        icon: n.icon || 'fa-bell',
        // ✅ Warna icon: pengumuman/bullhorn → kuning, success → hijau, warning → oranye, error → merah, lainnya → teal
        iconColor: (n.icon === 'fa-bullhorn' || n.type === 'announcement' || n.type === 'pengumuman')
          ? 'text-amber-400'
          : n.type === 'success' ? 'text-emerald-500'
          : n.type === 'warning' ? 'text-amber-500'
          : n.type === 'error'   ? 'text-red-500'
          : 'text-tertiary',
        time: n.created_at ? new Date(n.created_at).toLocaleString('id-ID') : new Date().toLocaleString('id-ID'),
        read: n.is_read === 1 || n.is_read === true,
        link: n.link || null,
      }));
      
      console.log('✅ Notifikasi setelah mapping:', mappedNotifications);
      
      setState(prev => ({
        ...prev,
        notifications: mappedNotifications
      }));
    } catch (error) {
      console.error("❌ Gagal mengambil notifikasi:", error);
    }
  }, [isAuthenticated]);

  // ✅ EFFECT untuk fetch notifikasi saat isAuthenticated menjadi true
  useEffect(() => {
    if (isAuthenticated) {
      console.log('✅ isAuthenticated true, fetch notifikasi sekarang...');
      fetchNotifications();
    }
  }, [isAuthenticated, fetchNotifications]);

  // ✅ LISTENER untuk refresh notifikasi dari event (misal dari admin setelah resolve banding)
  useEffect(() => {
    const handleRefreshNotifications = () => {
      console.log('📢 Event notification:refresh diterima');
      fetchNotifications();
    };
    
    window.addEventListener('notification:refresh', handleRefreshNotifications);
    return () => window.removeEventListener('notification:refresh', handleRefreshNotifications);
  }, [fetchNotifications]);

  // Fetch list organisasi (jika user punya banyak)
  const fetchUserOrganisasi = useCallback(async () => {
    try {
      const { data } = await api.get('/organisasi');
      setOrganisasiList(data.data);
    } catch (error) {
      console.error("Gagal mengambil list organisasi:", error);
    }
  }, []);

  // Redirect ke backend untuk Google OAuth
  const loginWithGoogle = useCallback(() => {
    window.location.href = import.meta.env.VITE_BACKEND_URL + '/api/auth/google/redirect';
  }, []);

  // Logout dari backend
  const logout = useCallback(async () => {
    // ✅ Set flag logout PERTAMA agar polling fetchUser tidak memulihkan session
    isLoggingOut.current = true;

    try {
      // ✅ Tunggu API logout selesai DULU agar cookie session di backend benar-benar dihapus
      // sebelum state di-clear — mencegah polling fetchUser memulihkan session yang belum expired
      await api.post('/logout');
    } catch (error) {
      console.error('Logout API gagal (session mungkin sudah expired):', error);
    } finally {
      // Hapus state & localStorage setelah API selesai
      setUser(null);
      setIsAuthenticated(false);
      setOrganisasi(null);
      setState(initialState);
      localStorage.removeItem('mf_last_role');
      localStorage.removeItem('mf_org_cache');  // ✅ Hapus cache Sidebar/Topbar

      // Navigasi ke login setelah state bersih
      window.dispatchEvent(new CustomEvent('auth:logout'));

      // ✅ Reset flag setelah navigasi (sedikit delay agar interval polling benar-benar berhenti)
      setTimeout(() => { isLoggingOut.current = false; }, 500);
    }
  }, []);

  /* ── MANAJEMEN PROFIL USER ── */
  
  const updateUser = useCallback(async (userData) => {
    const { data } = await api.put('/profil', userData);
    setUser(prev => ({ ...prev, ...data.data }));
    return data;
  }, []);

  const changePassword = useCallback(async (passwordData) => {
    const { data } = await api.post('/profil/password', passwordData);
    return data;
  }, []);

  const uploadAvatar = useCallback(async (file) => {
    const formData = new FormData();
    formData.append('avatar', file);
    
    const { data } = await api.post('/profil/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    
    setUser(prev => ({ ...prev, avatar: data.avatar_url }));
    return data;
  }, []);

  // ✅ Upload logo organisasi (bukan avatar user)
  const uploadOrgLogo = useCallback(async (file) => {
    if (!organisasi?.id) throw new Error('Tidak ada organisasi aktif');

    const formData = new FormData();
    formData.append('logo', file);

    const { data } = await api.post(`/organisasi/${organisasi.id}/logo`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    const newLogoUrl = data.logo_url;

    // Update state organisasi
    setOrganisasi(prev => ({ ...prev, logo_url: newLogoUrl }));

    // Update state.profile.photo agar ProfilPage langsung reflect
    setState(s => ({ ...s, profile: { ...s.profile, photo: newLogoUrl } }));

    // Update mf_org_cache agar Sidebar/Topbar langsung tampil logo baru
    try {
      const cached = JSON.parse(localStorage.getItem('mf_org_cache') || '{}');
      localStorage.setItem('mf_org_cache', JSON.stringify({ ...cached, logo_url: newLogoUrl }));
    } catch (_) {}

    return data;
  }, [organisasi?.id]);

  // ✅ Hapus logo organisasi (kembalikan ke inisial/default)
  const deleteOrgLogo = useCallback(async () => {
    if (!organisasi?.id) return;

    await api.delete(`/organisasi/${organisasi.id}/logo`);

    // Kosongkan logo di semua state
    setOrganisasi(prev => ({ ...prev, logo_url: null }));
    setState(s => ({ ...s, profile: { ...s.profile, photo: null } }));

    // Update cache
    try {
      const cached = JSON.parse(localStorage.getItem('mf_org_cache') || '{}');
      localStorage.setItem('mf_org_cache', JSON.stringify({ ...cached, logo_url: null }));
    } catch (_) {}
  }, [organisasi?.id]);

  const setActiveOrganisasi = useCallback((org) => {
    setOrganisasi(org);
  }, []);

  // Helper lama untuk kompatibilitas
  const update = useCallback((patch) => setState((s) => ({ ...s, ...patch })), []);
  const updateProfile = useCallback((data) => update({ profile: { ...state.profile, ...data } }), [state.profile, update]);

  // Handle unauthorized event dari interceptor axios
  useEffect(() => {
    const handleUnauthorized = () => {
      setUser(null);
      setIsAuthenticated(false);
      setOrganisasi(null);
      setState(initialState);
      setIsLoading(false);
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  // Auto-fetch user saat app pertama kali mount — tidak menunggu App.jsx render
  useEffect(() => {
    fetchUser().catch(() => {
      // Diabaikan — berarti user belum login, isLoading sudah di-set false di finally
    });
  }, [fetchUser]);

  /* ── MANAJEMEN DATA (CRUD via API) ── */

  const addTransaction = useCallback(async (txn) => {
    try {
      console.log('Adding transaction:', txn);
      const response = await api.post('/transaksi', {
        organisasi_id: organisasi?.id,
        type: txn.type,
        category: txn.cat,
        description: txn.desc,
        amount: Number(txn.amount),
        date: txn.date,
        notes: txn.note || '',
        docs: txn.docs || [],  // ✅ Kirim docs ke backend
      });
      
      console.log('Transaction added, response:', response.data);
      
      // ✅ Refresh transaksi dari backend setelah berhasil
      await fetchTransactions();
      
      // ✅ Kirim event untuk refresh data admin
      window.dispatchEvent(new CustomEvent('admin:data-changed'));
      
      return response.data;
    } catch (error) {
      console.error("Gagal menambah transaksi:", error);
      throw error;
    }
  }, [organisasi?.id, fetchTransactions]);

  const editTransaction = useCallback(async (id, data) => {
    try {
      const response = await api.put(`/transaksi/${id}`, {
        type: data.type,
        category: data.cat,
        description: data.desc,
        amount: Number(data.amount),
        date: data.date,
        notes: data.note || '',
        docs: data.docs ?? [],  // ✅ Kirim docs ke backend (termasuk array kosong jika semua dihapus)
      });
      
      // Refresh transaksi dari backend setelah berhasil
      await fetchTransactions();
      
      // ✅ Kirim event untuk refresh data admin
      window.dispatchEvent(new CustomEvent('admin:data-changed'));
      
      return response.data;
    } catch (error) {
      console.error("Gagal mengedit transaksi:", error);
      throw error;
    }
  }, [fetchTransactions]);

  const deleteTransaction = useCallback(async (id) => {
    try {
      await api.delete(`/transaksi/${id}`);
      
      // Refresh transaksi dari backend setelah berhasil
      await fetchTransactions();
      
      // ✅ Kirim event untuk refresh data admin
      window.dispatchEvent(new CustomEvent('admin:data-changed'));
    } catch (error) {
      console.error("Gagal menghapus transaksi:", error);
      throw error;
    }
  }, [fetchTransactions]);



  // ✅ Update data organisasi via API
  const updateOrganisasi = useCallback(async (orgData) => {
    if (!organisasi?.id) throw new Error('Tidak ada organisasi aktif');
    const { data } = await api.put(`/organisasi/${organisasi.id}`, {
      name: orgData.name,
      type: orgData.type,
      phone: orgData.phone,
      description: orgData.description,
      address: orgData.address,
    });
    // Update state lokal agar langsung tampil
    setOrganisasi(prev => ({ ...prev, ...data.data }));
    setState(s => ({
      ...s,
      profile: {
        ...s.profile,
        name: data.data?.name ?? s.profile.name,
        type: data.data?.type ?? s.profile.type,
        phone: data.data?.phone ?? s.profile.phone,
        description: data.data?.description ?? s.profile.description,
      }
    }));
    // ✅ Update cache agar Sidebar/Topbar langsung tampil nama/tipe baru
    try {
      const cached = JSON.parse(localStorage.getItem('mf_org_cache') || '{}');
      localStorage.setItem('mf_org_cache', JSON.stringify({
        ...cached,
        name: data.data?.name ?? cached.name,
        type: data.data?.type ?? cached.type,
      }));
    } catch (_) {}
    return data;
  }, [organisasi?.id]);

  // ✅ Fetch agendas dari backend
  const fetchAgendas = useCallback(async () => {
    if (!organisasi?.id) return;
    try {
      const { data } = await api.get('/agendas');
      const mapped = (data.data || []).map(a => ({
        id: a.id,
        name: a.title,
        amount: Number(a.description?.replace('Jumlah: ', '') || 0),
        date: a.start_at ? a.start_at.split('T')[0] : '',
      }));
      setState(s => ({ ...s, agendas: mapped }));
    } catch (error) {
      console.error('Gagal fetch agendas:', error);
    }
  }, [organisasi?.id]);

  // ✅ Tambah agenda via API
  const addAgenda = useCallback(async (agenda) => {
    if (!organisasi?.id) return;
    try {
      const { data } = await api.post('/agendas', {
        organisasi_id: organisasi.id,
        title: agenda.name,
        description: `Jumlah: ${agenda.amount}`,
        start_at: agenda.date,
        type: 'lainnya',
      });
      const newAgenda = {
        id: data.data?.id,
        name: agenda.name,
        amount: agenda.amount,
        date: agenda.date,
      };
      setState((s) => ({ ...s, agendas: [...s.agendas, newAgenda] }));
    } catch (error) {
      console.error('Gagal menambah agenda:', error);
      throw error;
    }
  }, [organisasi?.id]);

  // ✅ Edit agenda via API
  const editAgenda = useCallback(async (id, data) => {
    try {
      await api.put(`/agendas/${id}`, {
        title: data.name,
        description: `Jumlah: ${data.amount}`,
        start_at: data.date,
      });
      setState((s) => ({ ...s, agendas: s.agendas.map((a) => (a.id === id ? { ...a, ...data } : a)) }));
    } catch (error) {
      console.error('Gagal edit agenda:', error);
      setState((s) => ({ ...s, agendas: s.agendas.map((a) => (a.id === id ? { ...a, ...data } : a)) }));
    }
  }, []);

  // ✅ Hapus agenda via API
  const deleteAgenda = useCallback(async (id) => {
    try {
      await api.delete(`/agendas/${id}`);
    } catch (error) {
      console.error('Gagal hapus agenda:', error);
    }
    setState((s) => ({ ...s, agendas: s.agendas.filter((a) => a.id !== id) }));
  }, []);

  // ✅ Fetch anggota kas dari backend
  const fetchMembers = useCallback(async () => {
    if (!organisasi?.id) return;
    try {
      const { data } = await api.get(`/kas-anggota?organisasi_id=${organisasi.id}`);
      const mapped = (data.data || []).map(a => ({
        id: a.id,
        name: a.name,
        nim: a.nim || '',
        phone: a.phone || '',
        isPaid: false,
      }));
      setState(s => ({ ...s, members: mapped }));
    } catch (error) {
      console.error('Gagal fetch kas anggota:', error);
    }
  }, [organisasi?.id]);

  // ✅ Tambah anggota kas via API
  const addMember = useCallback(async (member) => {
    if (!organisasi?.id) return;
    try {
      const { data } = await api.post('/kas-anggota', {
        organisasi_id: organisasi.id,
        name: member.name,
        nim: member.nim || '',
        phone: member.phone || '',
      });
      const newMember = { id: data.data.id, name: data.data.name, nim: data.data.nim || '', phone: data.data.phone || '', isPaid: false };
      setState((s) => ({ ...s, members: [...s.members, newMember] }));
    } catch (error) {
      console.error('Gagal menambah anggota:', error);
      throw error;
    }
  }, [organisasi?.id]);

  const toggleMemberPayment = useCallback((id) => {
    setState((s) => ({
      ...s,
      members: s.members.map((m) => (m.id === id ? { ...m, isPaid: !m.isPaid } : m)),
    }));
  }, []);

  const toggleAllPayments = useCallback((status) => {
    setState((s) => ({ ...s, members: s.members.map((m) => ({ ...m, isPaid: status })) }));
  }, []);

  // ✅ Hapus anggota kas via API
  const deleteMember = useCallback(async (id) => {
    try {
      await api.delete(`/kas-anggota/${id}`);
    } catch (error) {
      console.error('Gagal hapus anggota:', error);
    }
    setState((s) => ({ ...s, members: s.members.filter((m) => m.id !== id) }));
  }, []);

  const saveDuesSettings = useCallback(async (settings) => {
    // Tandai hasSaved = true saat user menyimpan pengaturan
    const newSettings = { ...settings, hasSaved: true };
    setState((s) => ({ ...s, duesSettings: newSettings }));
    if (!organisasi?.id) return;
    try {
      await api.put(`/organisasi/${organisasi.id}`, {
        dues_interval: settings.interval,
        dues_amount: settings.amount,
      });
    } catch (error) {
      console.error('Gagal menyimpan pengaturan iuran:', error);
      throw error;
    }
  }, [organisasi?.id]);

  // ✅ Fetch program anggaran dari backend
  const fetchPrograms = useCallback(async () => {
    if (!organisasi?.id) return;
    try {
      const { data } = await api.get(`/program-anggaran?organisasi_id=${organisasi.id}`);
      const mapped = (data.data || []).map(p => ({ id: p.id, name: p.name, progress: p.progress }));
      if (mapped.length > 0) setState(s => ({ ...s, programs: mapped }));
    } catch (error) {
      console.error('Gagal fetch program anggaran:', error);
    }
  }, [organisasi?.id]);

  // ✅ Update programs via API (sync)
  const updatePrograms = useCallback(async (programs) => {
    // Update lokal dulu agar UI langsung responsif
    setState((s) => ({ ...s, programs }));
    if (!organisasi?.id) return;
    try {
      await api.post('/program-anggaran/sync', {
        organisasi_id: organisasi.id,
        programs: programs.map(p => ({ name: p.name, progress: p.progress })),
      });
    } catch (error) {
      console.error('Gagal sync program anggaran:', error);
    }
  }, [organisasi?.id]);

  // ✅ recordAllDues sekarang memanggil API transaksi untuk setiap anggota
  const recordAllDues = useCallback(async () => {
    const today = TODAY.toISOString().split('T')[0];
    const days = state.duesSettings.interval;
    const amount = state.duesSettings.amount;
    const paidMembers = state.members.filter((m) => m.isPaid);
    if (!paidMembers.length || !organisasi?.id) return;

    for (const m of paidMembers) {
      try {
        await api.post('/transaksi', {
          organisasi_id: organisasi.id,
          type: 'pemasukan',
          category: 'Iuran',
          description: `Iuran ${days} Hari - ${m.name}`,
          amount: Number(amount),
          date: today,
          notes: m.nim ? `NIM: ${m.nim}` : '',
        });
      } catch (err) {
        console.error('Gagal mencatat iuran untuk', m.name, err);
      }
    }
    // Refresh transaksi setelah semua iuran tercatat
    await fetchTransactions();
  }, [state.duesSettings, state.members, organisasi?.id, fetchTransactions]);

  // ✅ FIX: Ganti PUT ke POST untuk menghindari error 405
  const markAllRead = useCallback(() => {
    setState((s) => ({
        ...s,
        notifications: s.notifications.map((n) => ({ ...n, read: true })),
    }));
    // ✅ Ganti dari '/notifications/read-all' menjadi '/notifications/mark-all-read'
    api.post('/notifications/mark-all-read').catch((err) => {
        console.error('Gagal mark all read:', err);
    });
  }, []);
  
  // ✅ FIX: Ganti PUT ke POST
  const markOneRead = useCallback((id) => {
    setState((s) => ({
        ...s,
        notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
    }));
    // ✅ Ganti dari '/notifications/${id}/read' menjadi sesuai route
    api.post(`/notifications/${id}/read`).catch((err) => {
        console.error('Gagal mark read:', err);
    });
  }, []);

  const unreadCount = state.notifications.filter((n) => !n.read).length;

  return (
    <AppContext.Provider value={{
      // Global State
      state, TODAY,
      isDataLoading,  // ✅ Loading state untuk skeleton
      
      // Auth & User State
      user,
      isAuthenticated,
      isLoading,
      organisasi,
      organisasiList,
      
      // Auth Actions
      fetchUser,
      fetchUserOrganisasi,
      loginWithGoogle,
      logout,
      updateUser,
      changePassword,
      uploadAvatar,
      uploadOrgLogo,    // ✅ Upload logo organisasi
      deleteOrgLogo,    // ✅ Hapus logo organisasi
      setActiveOrganisasi,

      // App Actions
      updateProfile,
      updateOrganisasi,
      addTransaction, editTransaction, deleteTransaction,
      updatePrograms,
      addAgenda, editAgenda, deleteAgenda,
      fetchAgendas,
      fetchMembers, addMember, toggleMemberPayment, toggleAllPayments, deleteMember, saveDuesSettings, recordAllDues,
      fetchPrograms,
      markAllRead, markOneRead,
      unreadCount,
      fetchNotifications,
      fetchTransactions,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}