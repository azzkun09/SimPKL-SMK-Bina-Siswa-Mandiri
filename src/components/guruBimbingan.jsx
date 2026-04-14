import { Users, User, Building } from 'lucide-react';

export default function GuruBimbingan({
  user,
  daftarSiswa,
  daftarLokasi,
  supabase
}) {

  const siswaBimbingan = daftarSiswa.filter(s => s.guruId === user.id);

  const groupedSiswa = siswaBimbingan.reduce((group, s) => {
    const key = s.lokasiId || 'unassigned';
    if (!group[key]) group[key] = [];
    group[key].push(s);
    return group;
  }, {});

  return (
    <>
      {<div className="space-y-8 animate-in fade-in duration-500">
                <header>
                  <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Siswa Bimbingan</h2>
                  <p className="text-slate-500 mt-1 font-medium">Dikelompokkan berdasarkan Mitra Industri tempat PKL</p>
                </header>
      
                <div className="space-y-8">
                  {Object.keys(groupedSiswa).map(lokasiId => {
                    const lokasi = daftarLokasi.find(l => l.id === lokasiId);
                    const siswaList = groupedSiswa[lokasiId];
      
                    const handleUpdateJadwal = async (e) => {
                       e.preventDefault();
                       if(lokasiId === 'unassigned') return;
                       try {
                         if (lokasiId === 'L1' && !lokasi.timestamp) {
                           alert("Data contoh bawaan sistem tidak dapat diedit secara permanen. Silakan gunakan akun admin untuk membuat perusahaan/lokasi baru terlebih dahulu.");
                           return;
                         }
                         await supabase.from('lokasi').update({
                           jamMasuk: e.target.jamMasuk.value,
                           jamPulang: e.target.jamPulang.value
                         }).eq('id', lokasiId);
                         alert('Jadwal absensi perusahaan berhasil diperbarui dan disinkronisasikan ke siswa!');
                       } catch (err) { alert('Gagal memperbarui jadwal!'); }
                    };
      
                    return (
                      <div key={lokasiId} className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden">
                        <div className="p-6 md:p-8 border-b border-slate-100 bg-slate-50/50 flex flex-col xl:flex-row justify-between gap-6 xl:items-center">
                          <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-inner shrink-0">
                              <Building size={24}/>
                            </div>
                            <div>
                              <h3 className="font-extrabold text-xl text-slate-900">{lokasi?.nama || 'Belum Ditugaskan / Lokasi Dihapus'}</h3>
                              <p className="text-sm font-medium text-slate-500 mt-1 flex items-center gap-2">
                                <Users size={14}/> {siswaList.length} Taruna/Siswa Bimbingan
                              </p>
                            </div>
                          </div>
      
                          {lokasi && (
                            <form onSubmit={handleUpdateJadwal} className="flex flex-wrap items-end gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                              <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-1">Jam Datang</label>
                                <input name="jamMasuk" type="time" defaultValue={lokasi.jamMasuk || '08:00'} className="bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-3 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors" required />
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-1">Jam Pulang</label>
                                <input name="jamPulang" type="time" defaultValue={lokasi.jamPulang || '17:00'} className="bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-3 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors" required />
                              </div>
                              <button type="submit" className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm px-5 py-2.5 rounded-xl transition shadow-lg shadow-slate-900/20 h-[38px] mt-auto">
                                Simpan Jadwal
                              </button>
                            </form>
                          )}
                        </div>
      
                        <div className="p-6 md:p-8 bg-white">
                          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                            {siswaList.map(s => (
                              <div key={s.id} className="flex items-center gap-4 p-4 rounded-2xl border border-slate-100 hover:border-indigo-100 hover:bg-indigo-50/30 transition-colors group">
                                <div className="bg-slate-100 group-hover:bg-indigo-100 w-12 h-12 rounded-xl flex items-center justify-center text-slate-400 group-hover:text-indigo-600 transition-colors shadow-inner shrink-0">
                                  <User size={20} />
                                </div>
                                <div className="overflow-hidden">
                                  <h4 className="font-extrabold text-slate-900 truncate">{s.nama}</h4>
                                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5 truncate">{s.nis} • {s.kelas}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            }
    </>
  );
}