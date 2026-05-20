/**
 * Skeleton — Komponen loading placeholder dengan shimmer animation.
 * Digunakan di halaman user & admin saat data sedang dimuat.
 */

/* ── Base shimmer block ── */
export function Skeleton({ className = '', width, height, rounded = 'rounded-lg' }) {
  return (
    <div
      className={`skeleton-shimmer ${rounded} ${className}`}
      style={{ width, height }}
    />
  );
}

/* ── Stat Card skeleton (3 cards) ── */
export function SkeletonStatCards() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="bg-white rounded-2xl p-5 border border-neutral-light/30">
          <div className="flex items-center justify-between mb-3">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="w-9 h-9 rounded-lg" />
          </div>
          <Skeleton className="h-7 w-36 mb-2" />
          <Skeleton className="h-3 w-24" />
        </div>
      ))}
    </div>
  );
}

/* ── Transaction Table skeleton ── */
export function SkeletonTable({ rows = 5 }) {
  return (
    <div className="bg-white rounded-2xl border border-neutral-light/30 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-neutral-50/80">
              {['Tanggal','Keterangan','Kategori','Tipe','Jumlah','Status','Aksi'].map(h => (
                <th key={h} className="px-5 py-3 text-left">
                  <Skeleton className="h-3 w-16" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...Array(rows)].map((_, i) => (
              <tr key={i} className="border-t border-neutral-light/30">
                <td className="px-5 py-3.5"><Skeleton className="h-3 w-20" /></td>
                <td className="px-5 py-3.5"><Skeleton className="h-3 w-32" /></td>
                <td className="px-5 py-3.5"><Skeleton className="h-5 w-20 rounded-md" /></td>
                <td className="px-5 py-3.5"><Skeleton className="h-3 w-14" /></td>
                <td className="px-5 py-3.5"><Skeleton className="h-3 w-24 ml-auto" /></td>
                <td className="px-5 py-3.5 text-center"><Skeleton className="h-5 w-16 mx-auto rounded-md" /></td>
                <td className="px-5 py-3.5 text-center">
                  <div className="flex justify-center gap-2">
                    <Skeleton className="w-5 h-5 rounded" />
                    <Skeleton className="w-5 h-5 rounded" />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ── Chart Card skeleton ── */
export function SkeletonChart({ height = 'h-64' }) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-neutral-light/30">
      <Skeleton className="h-4 w-40 mb-4" />
      <div className={`${height} flex items-end gap-3 px-2`}>
        {[40,65,35,80,55,90].map((h, i) => (
          <div key={i} className="flex-1 flex flex-col gap-1 items-center justify-end">
            <Skeleton className="w-full rounded-t-md" style={{ height: `${h}%` }} />
            <Skeleton className="h-2 w-8" />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Recent transaction list skeleton (Beranda) ── */
export function SkeletonRecentList({ rows = 5 }) {
  return (
    <div className="space-y-3">
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3 rounded-xl">
          <Skeleton className="w-10 h-10 rounded-xl flex-shrink-0" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3.5 w-40" />
            <Skeleton className="h-2.5 w-24" />
          </div>
          <div className="text-right space-y-1.5">
            <Skeleton className="h-3.5 w-20 ml-auto" />
            <Skeleton className="h-2.5 w-12 ml-auto" />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Admin stat card skeleton ── */
export function SkeletonAdminStats({ count = 4 }) {
  return (
    <div className={`grid grid-cols-2 lg:grid-cols-${count} gap-4`}>
      {[...Array(count)].map((_, i) => (
        <div key={i} className="bg-white rounded-2xl p-5 border border-neutral-light/30">
          <div className="flex items-center justify-between mb-3">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="w-10 h-10 rounded-xl" />
          </div>
          <Skeleton className="h-8 w-32 mb-2" />
          <Skeleton className="h-2.5 w-20" />
        </div>
      ))}
    </div>
  );
}

/* ── Full Beranda skeleton ── */
export function SkeletonBeranda() {
  return (
    <div className="space-y-6">
      <SkeletonStatCards />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2"><SkeletonChart height="h-64" /></div>
        <div className="bg-white rounded-2xl p-5 border border-neutral-light/30">
          <Skeleton className="h-4 w-32 mb-4" />
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i}>
                <div className="flex justify-between mb-1">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-3 w-8" />
                </div>
                <Skeleton className="h-1.5 w-full rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-neutral-light/30">
          <Skeleton className="h-4 w-36 mb-4" />
          <SkeletonRecentList rows={4} />
        </div>
        <div className="bg-white rounded-2xl p-5 border border-neutral-light/30">
          <Skeleton className="h-4 w-32 mb-4" />
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-neutral-50">
                <Skeleton className="w-9 h-9 rounded-lg flex-shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3 w-28" />
                  <Skeleton className="h-2.5 w-20" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Full Transaksi/Laporan skeleton ── */
export function SkeletonTransaksi() {
  return (
    <div className="space-y-6">
      <SkeletonStatCards />
      {/* Filter bar skeleton */}
      <div className="flex flex-wrap gap-2">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-9 rounded-lg" style={{ width: i < 2 ? 80 : i < 4 ? 70 : 90 }} />
        ))}
        <Skeleton className="h-9 w-36 rounded-lg ml-auto" />
      </div>
      <SkeletonTable rows={6} />
    </div>
  );
}

/* ── Full Laporan skeleton (with chart) ── */
export function SkeletonLaporan() {
  return (
    <div className="space-y-6">
      <SkeletonStatCards />
      <div className="flex flex-wrap gap-2">
        {[...Array(7)].map((_, i) => (
          <Skeleton key={i} className="h-9 rounded-lg" style={{ width: i < 2 ? 80 : i < 4 ? 70 : 90 }} />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2"><SkeletonChart height="h-72" /></div>
        <div className="bg-white rounded-2xl p-5 border border-neutral-light/30">
          <Skeleton className="h-4 w-36 mb-4" />
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i}>
                <div className="flex justify-between mb-1">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-3 w-8" />
                </div>
                <Skeleton className="h-2 w-full rounded-full mb-1" />
                <Skeleton className="h-2.5 w-20" />
              </div>
            ))}
          </div>
        </div>
      </div>
      <SkeletonTable rows={5} />
    </div>
  );
}

/* ── Admin Dashboard skeleton ── */
export function SkeletonAdminDashboard() {
  return (
    <div className="space-y-6">
      <SkeletonAdminStats count={4} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SkeletonChart height="h-72" />
        <SkeletonChart height="h-72" />
      </div>
      <div className="bg-white rounded-2xl border border-neutral-light/30 overflow-hidden">
        <div className="p-5 border-b border-neutral-light/30">
          <Skeleton className="h-4 w-40" />
        </div>
        <SkeletonTable rows={5} />
      </div>
    </div>
  );
}

/* ── Generic page skeleton ── */
export function SkeletonPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-9 w-28 rounded-xl" />
      </div>
      <div className="bg-white rounded-2xl border border-neutral-light/30 overflow-hidden">
        <div className="p-5 border-b border-neutral-light/30">
          <Skeleton className="h-4 w-32" />
        </div>
        <SkeletonTable rows={6} />
      </div>
    </div>
  );
}
