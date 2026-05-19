import { createContext, useContext, useState, useCallback, useRef } from 'react';

const COLORS = ['#6366F1', '#8B5CF6', '#EC4899', '#14B8A6', '#F59E0B', '#10B981', '#3B82F6', '#EF4444'];

const AdminContext = createContext(null);

/* ── KOMPONEN PROVIDER: State Global Khusus Admin ── */
/* Mengelola seluruh data organisasi klien yang terdaftar di sistem */
export function AdminProvider({ children }) {
  const [orgs, setOrgs] = useState([]);
  const [adminStats, setAdminStats] = useState({
    total_users: 0,
    total_organisasi: 0,
    total_transaksi: 0,
    pending_transaksi: 0,
    total_pemasukan: 0,
    total_pengeluaran: 0
  });
  const [isLoading, setIsLoading] = useState(false);
  const hasFetchedAdmin = useRef(false);

  /* ── LAPORAN KEUANGAN ADMIN ── */
  const [laporanKeuangan, setLaporanKeuangan] = useState([]);
  const [laporanSummary, setLaporanSummary] = useState({
    total_saldo: 0,
    total_pemasukan: 0,
    total_pengeluaran: 0,
    total_organisasi: 0,
    total_anggota: 0
  });
  const [laporanLoading, setLaporanLoading] = useState(false);
  const hasFetchedLaporan = useRef(false);

  // Import api instance
  const fetchAdminData = useCallback(async () => {
    if (!hasFetchedAdmin.current) {
      setIsLoading(true);
    }
    try {
      const { default: api } = await import('../utils/api');
      
      const [orgsRes, statsRes] = await Promise.all([
        api.get('/admin/organisasi'),
        api.get('/admin/stats')
      ]);

      // Adaptasi data backend ke frontend structure
      const fetchedOrgs = orgsRes.data.data.map(org => ({
        id: org.id,
        name: org.name,
        type: org.type,
        email: org.email || '',
        phone: org.phone || '',
        description: org.description || '',
        logo_url: org.logo_url || null,   // ✅ Logo organisasi
        status: org.is_active ? 'Aktif' : 'Non-aktif',
        isSuspended: org.is_suspended || false,
        suspendedReason: org.suspended_reason || '',
        suspendedAt: org.suspended_at || null,
        hasPendingBanding: org.has_pending_banding || false,
        lastActiveAt: org.last_active_at || null,
        memberCount: org.anggota_count || 0,
        // ✅ balance sekarang dikembalikan langsung dari backend (withSum)
        balance: parseFloat(org.balance || 0),
        total_pemasukan: parseFloat(org.total_pemasukan || 0),
        total_pengeluaran: parseFloat(org.total_pengeluaran || 0),
        createdAt: org.created_at ? org.created_at.split('T')[0] : '',
        color: COLORS[org.id % COLORS.length]
      }));

      setOrgs(fetchedOrgs);
      setAdminStats(statsRes.data);
    } catch (error) {
      console.error("Gagal mengambil data admin:", error);
    } finally {
      setIsLoading(false);
      hasFetchedAdmin.current = true;
    }
  }, []);

  // ✅ Fetch laporan keuangan untuk semua organisasi
  const fetchLaporanKeuangan = useCallback(async () => {
    if (!hasFetchedLaporan.current) {
      setLaporanLoading(true);
    }
    try {
      const { default: api } = await import('../utils/api');
      const res = await api.get('/admin/laporan/keuangan');
      
      setLaporanKeuangan(res.data.data || []);
      setLaporanSummary(res.data.summary || {});
      
      return res.data;
    } catch (error) {
      console.error("Gagal mengambil laporan keuangan:", error);
    } finally {
      setLaporanLoading(false);
      hasFetchedLaporan.current = true;
    }
  }, []);

  // ✅ Refresh semua data admin (dipanggil setelah ada transaksi baru)
  const refreshAdminData = useCallback(async () => {
    console.log('Refreshing admin data...');
    await Promise.all([
      fetchAdminData(),
      fetchLaporanKeuangan()
    ]);
  }, [fetchAdminData, fetchLaporanKeuangan]);

  const addOrg = useCallback(async (data) => {
    try {
      const { default: api } = await import('../utils/api');
      // Auto-generate kode unik dari nama organisasi
      const code = data.name
        .replace(/[^a-zA-Z0-9]/g, '')
        .toUpperCase()
        .substring(0, 6) + Date.now().toString().slice(-4);

      const res = await api.post('/admin/organisasi', {
        name: data.name,
        code,
        type: data.type,
        email: data.email,
        phone: data.phone,
        description: data.description || '',
        status: data.status || 'Aktif',
      });
      // Refresh data admin agar list terupdate
      await fetchAdminData();
      return res.data;
    } catch (error) {
      console.error('Gagal menambah organisasi:', error);
      throw error;
    }
  }, [fetchAdminData]);

  const editOrg = useCallback(async (id, data) => {
    try {
      const { default: api } = await import('../utils/api');
      const res = await api.put(`/organisasi/${id}`, {
        name: data.name,
        type: data.type,
        email: data.email,
        phone: data.phone,
        description: data.description || '',
        status: data.status,  // Backend OrganisasiController sudah handle is_active mapping
      });
      // Refresh dari backend agar data konsisten
      await fetchAdminData();
      return res.data;
    } catch (error) {
      console.error('Gagal edit organisasi:', error);
      throw error;
    }
  }, [fetchAdminData]);

  const deleteOrg = useCallback(async (id) => {
    const { default: api } = await import('../utils/api');
    await api.delete(`/admin/organisasi/${id}`);
    setOrgs((prev) => prev.filter((o) => o.id !== id));
  }, []);

  /* ── SUSPEND / UNSUSPEND ── */
  const suspendOrg = useCallback(async (id, reason) => {
    const { default: api } = await import('../utils/api');
    const res = await api.post(`/admin/organisasi/${id}/suspend`, { reason });
    setOrgs((prev) => prev.map((o) =>
      o.id === id ? { ...o, isSuspended: true, suspendedReason: reason, suspendedAt: new Date().toISOString() } : o
    ));
    return res.data;
  }, []);

  const unsuspendOrg = useCallback(async (id) => {
    const { default: api } = await import('../utils/api');
    const res = await api.post(`/admin/organisasi/${id}/unsuspend`);
    setOrgs((prev) => prev.map((o) =>
      o.id === id ? { ...o, isSuspended: false, suspendedReason: '', suspendedAt: null } : o
    ));
    return res.data;
  }, []);

  /* ── BANDING ── */
  const [bandings, setBandings] = useState([]);
  const [bandingsLoading, setBandingsLoading] = useState(false);

  const fetchBandings = useCallback(async (status = 'all') => {
    setBandingsLoading(true);
    try {
      const { default: api } = await import('../utils/api');
      const res = await api.get(`/admin/bandings?status=${status}`);
      setBandings(res.data.data || []);
      return res.data;
    } catch (error) {
      console.error("Gagal mengambil data banding:", error);
    } finally {
      setBandingsLoading(false);
    }
  }, []);

  const resolveBanding = useCallback(async (id, status, adminNote = '') => {
    const { default: api } = await import('../utils/api');
    const res = await api.post(`/admin/bandings/${id}/resolve`, { status, admin_note: adminNote });
    
    setBandings((prev) => prev.map((b) =>
      b.id === id ? { ...b, status, admin_note: adminNote, resolved_at: new Date().toISOString() } : b
    ));
    
    // Jika diterima, update status suspend di orgs
    if (status === 'accepted') {
      setBandings((prev) => {
        const banding = prev.find(b => b.id === id);
        if (banding?.organisasi?.id) {
          setOrgs((orgsArr) => orgsArr.map((o) =>
            o.id === banding.organisasi.id ? { ...o, isSuspended: false, suspendedReason: '', suspendedAt: null } : o
          ));
        }
        return prev;
      });
    }
    
    // ✅ Kirim event untuk refresh notifikasi di user panel (akun organisasi)
    window.dispatchEvent(new CustomEvent('notification:refresh'));
    
    return res.data;
  }, []);

  // Compute UI stats based on backend response and local orgs
  const stats = {
    total:     orgs.length,
    aktif:     orgs.filter((o) => o.status === 'Aktif' && !o.isSuspended).length,
    pending:   orgs.filter((o) => o.status === 'Pending' && !o.isSuspended).length,
    nonAktif:  orgs.filter((o) => o.status === 'Non-aktif' && !o.isSuspended).length,
    suspended: orgs.filter((o) => o.isSuspended).length,
    // ✅ totalBalance dihitung dari balance per org (backend withSum)
    totalBalance:
      orgs.length > 0
        ? orgs.reduce((sum, o) => sum + parseFloat(o.balance || 0), 0)
        : parseFloat(laporanSummary.total_saldo || adminStats.total_pemasukan - adminStats.total_pengeluaran || 0),
    // ✅ totalMembers dihitung dari anggota per org
    totalMembers:
      orgs.length > 0
        ? orgs.reduce((sum, o) => sum + (o.memberCount || 0), 0)
        : (laporanSummary.total_anggota || adminStats.total_users || 0),
    pendingBandings: bandings.filter(b => b.status === 'pending').length,
    // ✅ Total pemasukan & pengeluaran seluruh sistem
    totalPemasukan:
      orgs.reduce((sum, o) => sum + parseFloat(o.total_pemasukan || 0), 0) ||
      parseFloat(adminStats.total_pemasukan || 0),
    totalPengeluaran:
      orgs.reduce((sum, o) => sum + parseFloat(o.total_pengeluaran || 0), 0) ||
      parseFloat(adminStats.total_pengeluaran || 0),
  };

  return (
    <AdminContext.Provider value={{
      orgs, stats,
      addOrg, editOrg, deleteOrg,
      suspendOrg, unsuspendOrg,
      bandings, bandingsLoading, fetchBandings, resolveBanding,
      fetchAdminData, isLoading,
      // ✅ Tambahan untuk laporan
      laporanKeuangan, laporanSummary, laporanLoading, fetchLaporanKeuangan,
      // ✅ Tambahan untuk refresh data
      refreshAdminData,
    }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  return useContext(AdminContext);
}