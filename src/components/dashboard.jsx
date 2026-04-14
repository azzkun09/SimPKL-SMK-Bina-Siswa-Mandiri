import { Users, User, Building, CheckCircle, BookOpen } from 'lucide-react';

export default function Dashboard({ user, daftarSiswa, daftarGuru, daftarLokasi, absensi, jurnal }) {
  return (
    <>
      { <div className="space-y-8 animate-in fade-in duration-500">
                <header>
                  <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Halo, {user.nama}!</h2>
                  <p className="text-slate-500 mt-1 font-medium">Ringkasan eksekutif hari ini.</p>
                </header>
      
                {user.role === 'admin' ? (
                  <>
                    {/* Kotak Statistik Admin */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="bg-white p-5 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex flex-col relative overflow-hidden group">
                         <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform"><Users size={80}/></div>
                         <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-3 shadow-inner"><Users size={20}/></div>
                         <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Siswa PKL</p>
                         <p className="font-extrabold text-2xl text-slate-900 mt-0.5">{daftarSiswa.length} <span className="text-xs font-medium text-slate-500">Siswa</span></p>
                      </div>
                      
                      <div className="bg-white p-5 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex flex-col relative overflow-hidden group">
                         <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform"><User size={80}/></div>
                         <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-3 shadow-inner"><User size={20}/></div>
                         <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Pembimbing</p>
                         <p className="font-extrabold text-2xl text-slate-900 mt-0.5">{daftarGuru.length} <span className="text-xs font-medium text-slate-500">Guru</span></p>
                      </div>
                      
                      <div className="bg-white p-5 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex flex-col relative overflow-hidden group">
                         <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform"><Building size={80}/></div>
                         <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center mb-3 shadow-inner"><Building size={20}/></div>
                         <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Perusahaan</p>
                         <p className="font-extrabold text-2xl text-slate-900 mt-0.5">{daftarLokasi.length} <span className="text-xs font-medium text-slate-500">Mitra</span></p>
                      </div>
                    </div>
      
                    {/* Grafik Aktivitas Siswa */}
                    <div className="bg-white p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 mt-6">
                       <div className="flex justify-between items-end mb-8">
                          <div>
                            <h3 className="font-extrabold text-xl text-slate-900">Aktivitas Kehadiran Siswa</h3>
                            <p className="text-sm font-medium text-slate-500 mt-1">Statistik absensi masuk 7 hari terakhir</p>
                          </div>
                          <div className="bg-indigo-50 text-indigo-700 font-bold text-xs px-3 py-1.5 rounded-lg border border-indigo-100">
                            Minggu Ini
                          </div>
                       </div>
      
                       <div className="h-64 flex items-end gap-3 sm:gap-6 pt-4">
                          {(() => {
                            const last7Days = Array.from({length: 7}, (_, i) => {
                              const d = new Date();
                              d.setDate(d.getDate() - (6 - i));
                              return d;
                            });
                            const absensiMasuk = absensi.filter(a => a.jenis === 'Masuk');
                            const maxAbsen = Math.max(...last7Days.map(d => absensiMasuk.filter(a => a.tanggal === d.toLocaleDateString()).length), 5);
      
                            return last7Days.map((d, idx) => {
                               const dateStr = d.toLocaleDateString();
                               const count = absensiMasuk.filter(a => a.tanggal === dateStr).length;
                               const label = d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
                               const percentage = count === 0 ? 0 : (count / maxAbsen) * 100;
                               const displayPercent = percentage === 0 ? 0 : Math.max(percentage, 5);
      
                               return (
                                 <div key={idx} className="flex-1 flex flex-col items-center gap-3 group">
                                    <div className="w-full relative flex-1 flex items-end bg-slate-50 rounded-2xl overflow-hidden">
                                       {/* Tooltip Hover */}
                                       <div className="absolute top-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-10 bg-slate-800 text-white text-[10px] font-bold px-2 py-1 rounded-md pointer-events-none whitespace-nowrap">
                                         {count} Hadir
                                       </div>
                                       <div 
                                         style={{ height: `${displayPercent}%` }} 
                                         className="w-full bg-gradient-to-t from-indigo-600 to-indigo-400 rounded-2xl transition-all duration-300 relative animate-scale-y group-hover:from-indigo-500 group-hover:to-indigo-300 shadow-[inset_0_-4px_12px_rgba(0,0,0,0.1)]"
                                       >
                                       </div>
                                    </div>
                                    <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</span>
                                 </div>
                               );
                            });
                          })()}
                       </div>
                    </div>
                  </>
                ) : user.role === 'siswa' ? (
                  <>
                    {/* Dashboard Khusus Siswa */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      <div className="bg-white p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex flex-col relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform"><Users size={80}/></div>
                        <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-4 shadow-inner"><Users size={20}/></div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Akses Pengguna</p>
                        <p className="font-extrabold text-3xl text-slate-900 mt-1 capitalize">{user.role}</p>
                      </div>
                      <div className="bg-white p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex flex-col relative overflow-hidden group">
                         <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform"><CheckCircle size={80}/></div>
                         <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-4 shadow-inner"><CheckCircle size={20}/></div>
                         <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Kehadiran</p>
                         <p className="font-extrabold text-3xl text-slate-900 mt-1">{absensi.filter(a=>a.siswaId===user.id).length} <span className="text-lg font-medium text-slate-500">Hari</span></p>
                      </div>
                      <div className="bg-white p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex flex-col relative overflow-hidden group">
                         <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform"><BookOpen size={80}/></div>
                         <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mb-4 shadow-inner"><BookOpen size={20}/></div>
                         <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Log Kegiatan</p>
                         <p className="font-extrabold text-3xl text-slate-900 mt-1">{jurnal.filter(a=>a.siswaId===user.id).length} <span className="text-lg font-medium text-slate-500">Entri</span></p>
                      </div>
      
                      <div className="col-span-full mt-4">
                        <div className="bg-gradient-to-br from-slate-900 to-[#1e293b] rounded-3xl p-8 relative overflow-hidden shadow-2xl shadow-slate-900/20">
                          <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl"></div>
                          <h3 className="font-bold text-white mb-6 text-xl">Profil Penempatan</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/10 flex items-start gap-4">
                              <div className="bg-white/20 p-3 rounded-xl text-white"><Building size={24} /></div>
                              <div><p className="text-xs text-slate-300 font-bold uppercase tracking-wider mb-1">Perusahaan</p><p className="font-bold text-white text-lg">{daftarLokasi.find(l => l.id === user.lokasiId)?.nama || '-'}</p></div>
                            </div>
                            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/10 flex items-start gap-4">
                              <div className="bg-white/20 p-3 rounded-xl text-white"><User size={24} /></div>
                              <div><p className="text-xs text-slate-300 font-bold uppercase tracking-wider mb-1">Pembimbing</p><p className="font-bold text-white text-lg">{daftarGuru.find(g => g.id === user.guruId)?.nama || '-'}</p></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                     {/* Dashboard Khusus Guru */}
                     {(() => {
                       const siswaBimbingan = daftarSiswa.filter(s => s.guruId === user.id);
                       const siswaBimbinganIds = siswaBimbingan.map(s => s.id);
                       const jumlahSiswa = siswaBimbingan.length;
                       const jumlahPerusahaan = new Set(siswaBimbingan.map(s => s.lokasiId)).size;
                       const jurnalMasuk = jurnal.filter(j => siswaBimbinganIds.includes(j.siswaId));
                       const jumlahJurnal = jurnalMasuk.length;
      
                       return (
                         <div className="space-y-6">
                           <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                              <div className="bg-white p-5 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex flex-col relative overflow-hidden group">
                                 <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform"><Users size={80}/></div>
                                 <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-3 shadow-inner"><Users size={20}/></div>
                                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Siswa Bimbingan</p>
                                 <p className="font-extrabold text-2xl text-slate-900 mt-0.5">{jumlahSiswa} <span className="text-xs font-medium text-slate-500">Siswa</span></p>
                              </div>
                              
                              <div className="bg-white p-5 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex flex-col relative overflow-hidden group">
                                 <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform"><Building size={80}/></div>
                                 <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center mb-3 shadow-inner"><Building size={20}/></div>
                                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Perusahaan Mitra</p>
                                 <p className="font-extrabold text-2xl text-slate-900 mt-0.5">{jumlahPerusahaan} <span className="text-xs font-medium text-slate-500">Titik</span></p>
                              </div>
                              
                              <div className="bg-white p-5 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex flex-col relative overflow-hidden group">
                                 <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform"><BookOpen size={80}/></div>
                                 <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-3 shadow-inner"><BookOpen size={20}/></div>
                                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Jurnal Terkumpul</p>
                                 <p className="font-extrabold text-2xl text-slate-900 mt-0.5">{jumlahJurnal} <span className="text-xs font-medium text-slate-500">Laporan</span></p>
                              </div>
                           </div>
      
                           {/* Grafik Aktivitas Bimbingan */}
                           <div className="bg-white p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
                               <div className="flex justify-between items-end mb-8">
                                  <div>
                                    <h3 className="font-extrabold text-xl text-slate-900">Aktivitas Bimbingan</h3>
                                    <p className="text-sm font-medium text-slate-500 mt-1">Kehadiran siswa bimbingan 7 hari terakhir</p>
                                  </div>
                                  <div className="bg-emerald-50 text-emerald-700 font-bold text-xs px-3 py-1.5 rounded-lg border border-emerald-100">
                                    Minggu Ini
                                  </div>
                               </div>
      
                               <div className="h-64 flex items-end gap-3 sm:gap-6 pt-4">
                                  {(() => {
                                    const last7Days = Array.from({length: 7}, (_, i) => {
                                      const d = new Date();
                                      d.setDate(d.getDate() - (6 - i));
                                      return d;
                                    });
                                    // Filter absensi hanya untuk siswa yang dibimbing oleh guru ini
                                    const absensiMasukGuru = absensi.filter(a => a.jenis === 'Masuk' && siswaBimbinganIds.includes(a.siswaId));
                                    const maxAbsen = Math.max(...last7Days.map(d => absensiMasukGuru.filter(a => a.tanggal === d.toLocaleDateString()).length), 5);
      
                                    return last7Days.map((d, idx) => {
                                       const dateStr = d.toLocaleDateString();
                                       const count = absensiMasukGuru.filter(a => a.tanggal === dateStr).length;
                                       const label = d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
                                       const percentage = count === 0 ? 0 : (count / maxAbsen) * 100;
                                       const displayPercent = percentage === 0 ? 0 : Math.max(percentage, 5);
      
                                       return (
                                         <div key={idx} className="flex-1 flex flex-col items-center gap-3 group">
                                            <div className="w-full relative flex-1 flex items-end bg-slate-50 rounded-2xl overflow-hidden">
                                               <div className="absolute top-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-10 bg-slate-800 text-white text-[10px] font-bold px-2 py-1 rounded-md pointer-events-none whitespace-nowrap">
                                                 {count} Hadir
                                               </div>
                                               <div 
                                                 style={{ height: `${displayPercent}%` }} 
                                                 className="w-full bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-2xl transition-all duration-300 relative animate-scale-y group-hover:from-emerald-500 group-hover:to-emerald-300 shadow-[inset_0_-4px_12px_rgba(0,0,0,0.1)]"
                                               >
                                               </div>
                                            </div>
                                            <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</span>
                                         </div>
                                       );
                                    });
                                  })()}
                               </div>
                           </div>
                         </div>
                       );
                     })()}
                  </>
                )}
              </div>
            }
    </>
  );
}