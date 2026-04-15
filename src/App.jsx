import React, { useState, useEffect } from 'react';
import { 
  Users, MapPin, FileText, Camera, LogOut, CheckCircle, 
  Map, UserPlus, Clock, BookOpen, Activity, User, Building, Settings, Home,
  Plus, Upload, Filter, X, Download, Eye, CheckSquare, ChevronRight, Edit, Database, Lock, Trash2, Key, RotateCcw, AlertCircle, XCircle
} from 'lucide-react';

import { supabase } from './lib/supabase';
import { getDistanceFromLatLonInM } from './utils/distance';
import { compressImage } from './utils/image';
import { handlePrintAction } from './utils/print';
import Login from './components/login';
import Dashboard from './components/dashboard';
import GuruBimbingan from './components/guruBimbingan';
import GuruMonitoring from './components/guruMonitoring';

// --- MOCK DATA (Data Cadangan Jika Database Kosong/Error) ---
const INITIAL_LOKASI = [
  { id: 'L1', nama: 'PT Teknologi Digital Maju', lat: -6.2088, lng: 106.8456, radius: 500, jamMasuk: '08:00', jamPulang: '17:00' }
];
const INITIAL_GURU = [
  { id: 'G1', username: 'guru1', nama: 'Ahmad Dahlan, S.Kom', nip: '198001012005011001', linkFolder: '' }
];
const INITIAL_SISWA = [
  { id: 'S1', username: 'siswa1', nama: 'Aziz Tamvan :v', nis: '100101', kelas: 'XII RPL 1', guruId: 'G1', lokasiId: 'L1' },
  { id: 'S2', username: 'siswa2', nama: 'Siti Aminah', nis: '100102', kelas: 'XII RPL 1', guruId: 'G1', lokasiId: 'L1' }
];
const INITIAL_ADMIN = [
  { id: 'A1', username: 'admin', nama: 'Administrator Sekolah' }
];

const formatDateIndo = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
};

export default function App() {
  // --- STATE MANAGEMENT ---
  const [user, setUser] = useState(null); 
  const [activeMenu, setActiveMenu] = useState('dashboard');

  const changeMenu = (menu) => {
  setActiveMenu(menu);
  localStorage.setItem('activeMenu', menu);
  };

  useEffect(() => {
  const savedUser = localStorage.getItem('user');
  const savedMenu = localStorage.getItem('activeMenu');

  if (savedUser) {
    setUser(JSON.parse(savedUser));
  }

  if (savedMenu) {
    setActiveMenu(savedMenu); // 🔥 INI YANG KURANG
  }
}, []);
  const [loginRole, setLoginRole] = useState('siswa'); 
  
  // State Data
  const [absensi, setAbsensi] = useState([]);
  const [jurnal, setJurnal] = useState([]);
  const [monitoring, setMonitoring] = useState([]);
  const [daftarSiswa, setDaftarSiswa] = useState(INITIAL_SISWA);
  const [daftarGuru, setDaftarGuru] = useState(INITIAL_GURU);
  const [daftarLokasi, setDaftarLokasi] = useState(INITIAL_LOKASI);
  const [pengaturan, setPengaturan] = useState(null);

  // --- SUPABASE REALTIME FETCHING ---
  const fetchData = async () => {
    try {
      const [resAbsensi, resJurnal, resMonitoring, resSiswa, resGuru, resLokasi, resPengaturan] = await Promise.all([
        supabase.from('absensi').select('*').order('timestamp', { ascending: false }),
        supabase.from('jurnal').select('*').order('timestamp', { ascending: false }),
        supabase.from('monitoring').select('*').order('timestamp', { ascending: false }),
        supabase.from('siswa').select('*'),
        supabase.from('guru').select('*'),
        supabase.from('lokasi').select('*'),
        supabase.from('pengaturan').select('*').eq('id', 'global').single()
      ]);

      if (resAbsensi?.data) setAbsensi(resAbsensi.data);
      if (resJurnal?.data) setJurnal(resJurnal.data);
      if (resMonitoring?.data) setMonitoring(resMonitoring.data);
      if (resSiswa?.data && resSiswa.data.length > 0) setDaftarSiswa(resSiswa.data);
      if (resGuru?.data && resGuru.data.length > 0) setDaftarGuru(resGuru.data);
      if (resLokasi?.data && resLokasi.data.length > 0) setDaftarLokasi(resLokasi.data);
      if (resPengaturan?.data) setPengaturan(resPengaturan.data);
    } catch (error) {
      console.warn("Error fetching dari Supabase:", error);
    }
  };

  useEffect(() => {
    fetchData();
    try {
      const channel = supabase.channel('schema-db-changes')
        .on('postgres_changes', { event: '*', schema: 'public' }, () => {
          fetchData();
        })
        .subscribe();
      return () => { supabase.removeChannel(channel); };
    } catch (err) {}
  }, []);

  // --- KOMPONEN: LOGIN PAGE ---
  if (!user) {
  return (
    <Login
      setUser={setUser}
      daftarSiswa={daftarSiswa}
      daftarGuru={daftarGuru}
      supabase={supabase}
      pengaturan={pengaturan}
      changeMenu={changeMenu}
    />
  );
}

  const menus = {
    admin: [
      { id: 'dashboard', label: 'Dashboard', icon: Home },
     { id: 'siswa', label: 'Data Pengguna', icon: Users },
     { id: 'lokasi', label: 'Lokasi PKL', icon: Building },
     { id: 'laporan', label: 'Kunjungan', icon: FileText },
     { id: 'pengaturan', label: 'Pengaturan', icon: Settings },
     { id: 'admin_manage', label: 'Kelola Admin', icon: Key },
   ],
    guru: [
      { id: 'dashboard', label: 'Dashboard', icon: Home },
      { id: 'siswa_bimbingan', label: 'Bimbingan', icon: Users },
      { id: 'approve_jurnal', label: 'Validasi Jurnal', icon: CheckSquare },
      { id: 'approve_izin', label: 'Validasi Izin', icon: AlertCircle },
      { id: 'monitoring', label: 'Kunjungan', icon: MapPin },
      { id: 'laporan_akhir', label: 'Laporan Akhir', icon: FileText },
    ],
    siswa: [
      { id: 'dashboard', label: 'Dashboard', icon: Home },
      { id: 'absensi', label: 'Absen Lokasi', icon: MapPin },
      { id: 'jurnal', label: 'Jurnal Harian', icon: BookOpen },
      { id: 'laporan_pkl', label: 'Laporan PKL', icon: FileText },
    ]
  };

  const SiswaAbsensi = () => {
    const [lokasiSaatIni, setLokasiSaatIni] = useState(null);
    const [statusLokasi, setStatusLokasi] = useState('');
    const [foto, setFoto] = useState(null);
    const [showIzinModal, setShowIzinModal] = useState(false);
    const [jenisIzin, setJenisIzin] = useState('Izin');
    const [keteranganIzin, setKeteranganIzin] = useState('');
    
    const lokasiPkl = daftarLokasi.find(l => l.id === user.lokasiId);
    const myGuru = daftarGuru.find(g => g.id === user.guruId);

    const hariIni = new Date().toLocaleDateString();
    const absensiSiswa = absensi.filter(a => a.siswaId === user.id);
    const absensiHariIni = absensiSiswa.filter(a => a.tanggal === hariIni || (a.waktu && a.waktu.includes(hariIni)));
    const sudahMasuk = absensiHariIni.some(a => a.jenis === 'Masuk');
    const sudahPulang = absensiHariIni.some(a => a.jenis === 'Pulang');
    const sudahIzin = absensiHariIni.some(a => a.jenis === 'Izin' || a.jenis === 'Sakit');

    const jalankanSimulasi = () => {
      const simulatedLat = (lokasiPkl?.lat || 0) + 0.0001; 
      const simulatedLng = (lokasiPkl?.lng || 0) + 0.0001;
      const jarak = getDistanceFromLatLonInM(simulatedLat, simulatedLng, lokasiPkl?.lat || 0, lokasiPkl?.lng || 0);
      setLokasiSaatIni({ lat: simulatedLat, lng: simulatedLng, jarak });
      setStatusLokasi(`(Mode Simulasi) Terverifikasi. Jarak: ${jarak}m`);
    };

    const dapatkanLokasi = () => {
      if (!lokasiPkl) {
        setStatusLokasi('Lokasi PKL belum diatur oleh admin.');
        return;
      }
      setStatusLokasi('Mencari lokasi akurat...');
      const onGpsError = () => {
         setStatusLokasi('Membuka mode simulasi GPS...');
         setTimeout(() => jalankanSimulasi(), 800);
      };
      try {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const { latitude, longitude } = position.coords;
              const jarak = getDistanceFromLatLonInM(latitude, longitude, lokasiPkl.lat, lokasiPkl.lng);
              setLokasiSaatIni({ lat: latitude, lng: longitude, jarak });
              if (jarak <= lokasiPkl.radius) {
                setStatusLokasi(`Terverifikasi. Anda berada ${jarak}m dari area.`);
              } else {
                setStatusLokasi(`Di luar jangkauan. Anda berjarak ${jarak}m (Maks: ${lokasiPkl.radius}m)`);
              }
            },
            (error) => {
               console.warn("Peringatan GPS:", error?.message || "Akses ditolak");
               onGpsError();
            },
            { enableHighAccuracy: true, timeout: 5000 } 
          );
        } else {
          onGpsError();
        }
      } catch (err) {
        onGpsError();
      }
    };

    const handleAbsen = async (jenis) => {
      if (loading) return;
       setLoading(true);

      // VALIDASI DASAR
      if (!jenis) {
        setLoading(false);
        return alert('Jenis absen belum dipilih!');
      }

      if (!foto) {
        setLoading(false);
        return alert('Wajib melampirkan foto selfie!');
      }

      if (!lokasiSaatIni) {
        setLoading(false);
        return alert('Lokasi belum terdeteksi, silakan aktifkan GPS!');
      }

      if (typeof lokasiSaatIni.jarak !== 'number') {
        setLoading(false);
        return alert('Gagal membaca jarak lokasi!');
      }

      if (!lokasiPkl) {
        setLoading(false);
        return alert('Lokasi PKL belum diatur!');
      }

      // AMBIL RADIUS DARI LOKASI
      const MAX_RADIUS = lokasiPkl.radius || 100;

      if (lokasiSaatIni.jarak > MAX_RADIUS) {
        setLoading(false);
        return alert(`Anda berada di luar area (${MAX_RADIUS} meter)!`);
      }

      // LOGIKA STATUS
      let statusAbsen = 'Hadir'; 
      const now = new Date();

      if (jenis === 'Masuk' && lokasiPkl?.jamMasuk) {
        const [jamM, menitM] = (lokasiPkl.jamMasuk || '00:00').split(':').map(Number);
        const batasMasuk = new Date();
        batasMasuk.setHours(jamM, menitM, 0, 0);
        statusAbsen = now > batasMasuk ? 'Terlambat' : 'Tepat Waktu';
      } 

      else if (jenis === 'Pulang' && lokasiPkl?.jamPulang) {
        const [jamP, menitP] = lokasiPkl.jamPulang.split(':').map(Number);
        const batasPulang = new Date();
        batasPulang.setHours(jamP, menitP, 0, 0);
        statusAbsen = now < batasPulang ? 'Pulang Awal' : 'Tepat Waktu';
      }

      try {
        const { error } = await supabase.from('absensi').insert([{
          siswaId: user.id,
          namaSiswa: user.nama,
          waktu: now.toLocaleTimeString('id-ID', { 
            hour: '2-digit', 
            minute: '2-digit' 
          }),
          tanggal: now.toLocaleDateString(), 
          jenis,
          foto,
          jarak: lokasiSaatIni.jarak,
          status: statusAbsen,
          timestamp: Date.now() 
        }]);

        if (error) throw error;

        setFoto(null);
        await fetchData();

        alert(`Berhasil Absen ${jenis}! (${statusAbsen})`);

      } catch (error) {
        console.error("Absen Error:", error);
        alert('Gagal Absen: Terdapat error saat mengirim data ke database.');
      }
      setLoading(false);
    };

    const handleAjukanIzin = async (e) => {
      e.preventDefault();
      if (jenisIzin === 'Sakit' && !foto) return alert('Wajib melampirkan foto Surat Keterangan Sakit dari Dokter/Klinik!');
      if (!keteranganIzin) return alert('Harap berikan keterangan/alasan dengan jelas!');

      try {
        await supabase.from('absensi').insert([{
          siswaId: user.id,
          namaSiswa: user.nama,
          waktu: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
          tanggal: new Date().toLocaleDateString(), 
          jenis: jenisIzin,
          keterangan: keteranganIzin,
          foto: foto || null,
          jarak: 0,
          status: 'Menunggu',
          timestamp: Date.now() 
        }]);
        setShowIzinModal(false);
        setFoto(null);
        setKeteranganIzin('');
        alert(`Pengajuan ${jenisIzin} berhasil dikirim ke Pembimbing!`);
      } catch (error) {
        alert('Gagal mengirim pengajuan.');
      }
    };

    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <header>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Absensi Digital</h2>
          <p className="text-slate-500 mt-1">Sistem pelacakan berbasis Geofencing</p>
        </header>
        
        <div className="bg-white p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
          <div className="flex items-center gap-5 mb-8">
            <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-inner shrink-0">
              <Building size={28}/>
            </div>
            <div>
              <h3 className="font-bold text-xl text-slate-800">{lokasiPkl?.nama || 'Belum diatur'}</h3>
              <div className="text-slate-500 text-sm font-medium mt-1 flex flex-wrap items-center gap-3">
                <span className="flex items-center gap-1.5"><MapPin size={14}/> Radius Maks: <span className="text-indigo-600 font-bold">{lokasiPkl?.radius || 0}m</span></span>
                <span className="hidden sm:inline text-slate-300">•</span>
                <span className="flex items-center gap-1.5"><Clock size={14}/> Jadwal: <span className="text-emerald-600 font-bold">{lokasiPkl?.jamMasuk || '08:00'} - {lokasiPkl?.jamPulang || '17:00'}</span></span>
              </div>
            </div>
          </div>

          <button onClick={dapatkanLokasi} className="w-full md:w-auto px-8 py-3.5 bg-slate-900 text-white rounded-xl font-bold shadow-lg shadow-slate-900/20 flex items-center justify-center gap-2 hover:bg-slate-800 transform hover:-translate-y-0.5 transition-all">
            <Map size={18} /> Pindai Lokasi Saat Ini
          </button>

          {statusLokasi && (
            <div className={`mt-6 p-4 rounded-xl text-sm font-medium border ${lokasiSaatIni && lokasiSaatIni.jarak <= (lokasiPkl?.radius || 0) ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100'}`}>
              <div className="flex items-center gap-2">
                {lokasiSaatIni && lokasiSaatIni.jarak <= (lokasiPkl?.radius || 0) ? <CheckCircle size={16}/> : <X size={16}/>}
                {statusLokasi}
              </div>
            </div>
          )}

          {lokasiSaatIni && lokasiSaatIni.jarak <= (lokasiPkl?.radius || 0) && !sudahIzin && (
            <div className="mt-8 pt-8 border-t border-slate-100 space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-3">Unggah Bukti Kehadiran (Selfie)</label>
                <div className="flex items-center gap-4">
                  <label className="cursor-pointer bg-white px-6 py-3.5 rounded-xl border-2 border-dashed border-slate-300 hover:border-indigo-400 hover:bg-indigo-50 flex items-center gap-2 transition-all font-medium text-slate-600">
                    <Camera size={20}/> Ambil Selfie Kehadiran
                    <input type="file" accept="image/*" capture="user" className="hidden" onChange={async (e) => {
                      const file = e.target.files[0];
                      if (file) {
                        const compressedBase64 = await compressImage(file, 600, 600, 0.6);
                        setFoto(compressedBase64);
                      }
                    }} />
                  </label>
                  {foto && <img src={foto} alt="Preview" className="h-20 w-20 object-cover rounded-xl shadow-md border-2 border-white" />}
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                {sudahMasuk ? (
                  <button disabled className="flex-1 bg-slate-100 text-slate-400 py-4 rounded-xl font-bold flex items-center justify-center gap-2 cursor-not-allowed border border-slate-200">
                    <CheckCircle size={20} /> Masuk Tersimpan
                  </button>
                ) : (
                  <button
                    onClick={() => handleAbsen('Masuk')}
                    disabled={loading}
                    className={`flex-1 py-4 rounded-xl font-bold shadow-lg flex items-center justify-center gap-2 transition-all ${
                      loading
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-emerald-500 to-emerald-600 shadow-emerald-500/30 hover:-translate-y-0.5'
                    }`}
                  >
                    <Clock size={20} />
                    {loading ? 'Memproses...' : 'Absen Masuk Sekarang'}
                  </button>
                )}

                {sudahPulang ? (
                   <button disabled className="flex-1 bg-slate-100 text-slate-400 py-4 rounded-xl font-bold flex items-center justify-center gap-2 cursor-not-allowed border border-slate-200">
                     <CheckCircle size={20} /> Pulang Tersimpan
                   </button>
                ) : (
                  <button
                      onClick={() => handleAbsen('Pulang')}
                      disabled={!sudahMasuk || loading}
                      className={`flex-1 py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                        !sudahMasuk || loading
                          ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                          : 'bg-gradient-to-r from-rose-500 to-rose-600 text-white shadow-lg shadow-rose-500/30 transform hover:-translate-y-0.5'
                      }`}
                      title={!sudahMasuk ? 'Absen masuk terlebih dahulu' : ''}
                    >
                    <LogOut size={20} />
                    {loading ? 'Memproses...' : 'Absen Pulang'}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Tombol Ajukan Izin */}
          {!sudahMasuk && !sudahIzin && (
            <div className="mt-6">
               <button onClick={() => setShowIzinModal(true)} className="text-sm font-bold text-slate-500 hover:text-indigo-600 flex items-center gap-2 transition-colors">
                  <AlertCircle size={16} /> Tidak bisa hadir? Ajukan Izin / Sakit di sini.
               </button>
            </div>
          )}
        </div>

        {/* RIWAYAT TERAKHIR */}
        <div>
          <div className="flex justify-between items-center mb-4">
             <h3 className="font-bold text-xl text-slate-800">Riwayat Terakhir</h3>
             {absensiSiswa.length > 0 && (
               <button onClick={() => handlePrintAction('print-absensi-siswa')} className="text-xs sm:text-sm font-bold text-indigo-600 bg-indigo-50 px-4 py-2 rounded-xl hover:bg-indigo-100 transition-colors flex items-center gap-2 border border-indigo-100 shadow-sm">
                 <Download size={16} /> Unduh Rekap
               </button>
             )}
          </div>
          
          <div className="grid gap-4 md:grid-cols-2">
            {absensiSiswa.length === 0 ? (
              <p className="text-slate-500 text-sm bg-white p-6 rounded-2xl border border-slate-100 text-center col-span-full">Belum ada riwayat kehadiran tercatat.</p>
            ) : (
              absensiSiswa.sort((a,b) => b.timestamp - a.timestamp).slice(0,6).map(item => (
                <div key={item.id} className="flex items-center justify-between p-4 bg-white rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.02)] border border-slate-100">
                  <div className="flex items-center gap-4">
                    {item.foto ? (
                      <img src={item.foto} alt="Bukti" className="w-12 h-12 object-cover rounded-xl shadow-sm border border-slate-100" />
                    ) : (
                      <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center">
                         {item.jenis === 'Izin' || item.jenis === 'Sakit' ? <FileText size={20} className="text-slate-400"/> : <Camera size={20} className="text-slate-400"/>}
                      </div>
                    )}
                    <div>
                      <span className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-md ${
                          item.jenis === 'Masuk' ? 'bg-emerald-100 text-emerald-700' : 
                          item.jenis === 'Pulang' ? 'bg-rose-100 text-rose-700' : 
                          'bg-amber-100 text-amber-700'
                        }`}>
                        {item.jenis} {item.status && item.status !== 'Menunggu' ? ` • ${item.status}` : ''}
                      </span>
                      <p className="text-sm font-bold text-slate-800 mt-1.5">{item.waktu}</p>
                      {item.jarak > 0 ? (
                        <p className="text-xs text-slate-500 mt-0.5 font-medium">Jarak valid: {item.jarak}m</p>
                      ) : (
                         <p className="text-xs text-slate-500 mt-0.5 font-medium italic truncate max-w-[150px]">{item.keterangan || 'Menunggu verifikasi guru'}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* MODAL PENGAJUAN IZIN */}
        {showIzinModal && (
          <div className="fixed top-0 left-0 w-full h-screen z-[9999] flex items-center justify-center p-4 bg-black/40 backdrop-blur-[3px] animate-in fade-in duration-200 print:hidden">
            <form onSubmit={handleAjukanIzin} className="bg-white w-full max-w-[500px] rounded-[16px] shadow-xl flex flex-col max-h-[90vh] overflow-hidden scale-in-center relative">
              <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center shrink-0 bg-white">
                <div>
                  <h3 className="font-bold text-lg text-slate-900">Pengajuan Izin / Sakit</h3>
                  <p className="text-xs text-slate-500 mt-1">Formulir ketidakhadiran PKL</p>
                </div>
                <button type="button" onClick={() => { setShowIzinModal(false); setFoto(null); setKeteranganIzin(''); }} className="p-2 bg-slate-50 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-colors shrink-0">
                  <X size={18}/>
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-slate-50/50 custom-scrollbar min-h-0">
                 <div>
                   <label className="block text-[11px] font-bold text-slate-500 mb-2 uppercase tracking-widest">Jenis Pengajuan</label>
                   <select value={jenisIzin} onChange={(e) => setJenisIzin(e.target.value)} className="w-full border-slate-200 bg-white p-3.5 text-sm font-medium rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 border appearance-none">
                     <option value="Izin">Izin (Keperluan Mendesak)</option>
                     <option value="Sakit">Sakit (Butuh Surat Dokter)</option>
                   </select>
                 </div>
                 
                 <div>
                   <label className="block text-[11px] font-bold text-slate-500 mb-2 uppercase tracking-widest">Keterangan / Alasan</label>
                   <textarea value={keteranganIzin} onChange={(e) => setKeteranganIzin(e.target.value)} required placeholder="Jelaskan alasan secara singkat..." className="w-full border-slate-200 bg-white p-3.5 text-sm font-medium rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 border h-28 resize-none"></textarea>
                 </div>

                 {jenisIzin === 'Sakit' && (
                   <div className="bg-amber-50 p-4 rounded-xl border border-amber-200">
                     <label className="block text-[11px] font-bold text-amber-800 mb-2 uppercase tracking-widest flex items-center gap-1.5"><AlertCircle size={14}/> Lampiran Surat Dokter (Wajib)</label>
                     <div className="flex items-center gap-4 mt-3">
                        <label className="cursor-pointer bg-white px-4 py-2.5 rounded-lg border border-amber-200 hover:bg-amber-100 flex items-center gap-2 transition-all font-bold text-sm text-amber-700 shadow-sm">
                          <Camera size={16}/> Ambil / Unggah Foto
                          <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                            const file = e.target.files[0];
                            if (file) {
                              const compressedBase64 = await compressImage(file, 800, 800, 0.6);
                              setFoto(compressedBase64);
                            }
                          }} />
                        </label>
                        {foto && <img src={foto} alt="Preview" className="h-12 w-12 object-cover rounded-lg shadow-sm border border-white" />}
                     </div>
                   </div>
                 )}
              </div>
              
              <div className="px-6 py-4 border-t border-slate-100 bg-white shrink-0 flex justify-end gap-3">
                <button type="button" onClick={() => { setShowIzinModal(false); setFoto(null); setKeteranganIzin(''); }} className="px-6 py-2.5 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-200 transition-colors w-full sm:w-auto">Batal</button>
                <button type="submit" className="w-full sm:w-auto py-2.5 px-6 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-sm shadow-md transition-all">Kirim Pengajuan</button>
              </div>
            </form>
          </div>
        )}

        {/* --- DOKUMEN CETAK REKAP ABSENSI KHUSUS SISWA --- */}
        <div id="print-absensi-siswa" className="hidden print:block bg-white p-10 text-black font-serif min-h-screen">
          <div className="flex items-center justify-between border-b-4 border-black pb-6 mb-6">
            {pengaturan?.logo && <img src={pengaturan.logo} alt="Logo" className="w-24 h-24 object-contain" />}
            <div className="flex-1 text-center px-4">
              <h1 className="text-2xl font-bold uppercase leading-tight">{pengaturan?.namaSekolah || 'SMK BINA SISWA MANDIRI'}</h1>
              <p className="text-sm font-medium mt-1">REKAPITULASI KEHADIRAN PRAKTIK KERJA LAPANGAN (PKL)</p>
              <p className="text-xs mt-0.5 tracking-widest italic text-gray-600">
                Tahun Ajaran {pengaturan?.periode || '-'}
              </p>
            </div>
            <div className="w-24 h-24 invisible"></div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
            <div>
              <table className="w-full">
                <tbody>
                  <tr><td className="py-1 w-32 font-bold">Nama Lengkap</td><td className="py-1">: {user.nama}</td></tr>
                  <tr><td className="py-1 font-bold">NIS</td><td className="py-1">: {user.nis}</td></tr>
                  <tr><td className="py-1 font-bold">Kelas</td><td className="py-1">: {user.kelas}</td></tr>
                </tbody>
              </table>
            </div>
            <div>
              <table className="w-full">
                <tbody>
                  <tr><td className="py-1 w-32 font-bold">Tempat PKL</td><td className="py-1">: {lokasiPkl?.nama || '-'}</td></tr>
                  <tr><td className="py-1 font-bold">Pembimbing</td><td className="py-1">: {myGuru?.nama || '-'}</td></tr>
                </tbody>
              </table>
            </div>
          </div>

          <table className="w-full border-collapse border border-black text-[12px] mt-4">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-black px-3 py-2 w-10 text-center">NO</th>
                <th className="border border-black px-3 py-2 w-32 text-center">TANGGAL</th>
                <th className="border border-black px-3 py-2 w-32 text-center">WAKTU</th>
                <th className="border border-black px-3 py-2 w-32 text-center">JENIS ABSEN</th>
                <th className="border border-black px-3 py-2">KETERANGAN / STATUS</th>
              </tr>
            </thead>
            <tbody>
              {(absensiSiswa || [])
              .sort((a,b) => b.timestamp - a.timestamp)
              .map((a, idx) => (
                <tr key={a.id} className="break-inside-avoid">
                  <td className="border border-black px-3 py-2 text-center align-top">{idx + 1}</td>
                  <td className="border border-black px-3 py-2 text-center align-top font-semibold">{a.tanggal}</td>
                  <td className="border border-black px-3 py-2 text-center align-top">{a.waktu}</td>
                  <td className="border border-black px-3 py-2 text-center align-top font-bold">{a.jenis}</td>
                  <td className="border border-black px-3 py-2 align-top whitespace-pre-wrap">
                    {a.jarak > 0 
                      ? `Jarak valid: ${a.jarak}m (${a.status || 'Tepat Waktu'})` 
                      : (a.keterangan 
                          ? `${a.keterangan} (Status: ${a.status || 'Menunggu'})` 
                          : '-')}
                  </td>
                </tr>
            ))}
            </tbody>
          </table>

          <div className="mt-16 grid grid-cols-2 text-center break-inside-avoid">
            <div className="space-y-20">
               <div>
                 <p className="text-sm font-bold">Peserta PKL</p>
               </div>
               <div>
                 <p className="text-sm font-bold underline decoration-1 underline-offset-4">{user.nama}</p>
                 <p className="text-[10px]">NIS. {user.nis}</p>
               </div>
            </div>
            <div className="space-y-20">
               <div>
                 <p className="text-sm">Bogor, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                 <p className="text-sm font-bold">Guru Pembimbing</p>
               </div>
               <div>
                 <p className="text-sm font-bold underline decoration-1 underline-offset-4">{myGuru?.nama || '-'}</p>
                 <p className="text-[10px]">Pembimbing Instansi Sekolah</p>
               </div>
            </div>
          </div>
        </div>

      </div>
    );
  };

  const SiswaJurnal = () => {
    const [kegiatan, setKegiatan] = useState('');
    const [fotoJurnal, setFotoJurnal] = useState(null);
    const [selectedJurnal, setSelectedJurnal] = useState(null); 

    const myJournals = jurnal.filter(j => j.siswaId === user.id).sort((a,b) => b.timestamp - a.timestamp);

          const submitJurnal = async (e) => {
        e.preventDefault();

        if (!kegiatan.trim()) {
          return alert('Isi kegiatan dahulu!');
        }

        try {
          const { error } = await supabase.from('jurnal').insert([{
            siswaId: user.id,
            namaSiswa: user.nama,
            tanggal: new Date().toLocaleDateString(),
            kegiatan,
            foto: fotoJurnal || null,
            status: 'Menunggu',
            timestamp: Date.now()
          }]);

          if (error) throw error;

          setKegiatan('');
          setFotoJurnal(null);

          await fetchData(); // 🔥 WAJIB

          alert('Jurnal berhasil disimpan!');

        } catch (error) {
          console.error("Jurnal Submit Error:", error);
          alert('Gagal menyimpan jurnal!');
        }
      };

    const handleDeleteJurnal = async (id, status) => {
        if (status === 'Disetujui') {
          return alert('Jurnal yang sudah disetujui tidak dapat dihapus.');
        }

        if (window.confirm('Yakin ingin menghapus entri jurnal ini?')) {
          try {
            const { error } = await supabase
              .from('jurnal')
              .delete()
              .eq('id', id);

            if (error) throw error;

            await fetchData(); // 🔥 WAJIB

            alert('Jurnal berhasil dihapus!');

          } catch (err) {
            console.error(err);
            alert('Gagal menghapus jurnal.');
          }
        }
      };

    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 print:hidden">
          <div>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Buku Jurnal</h2>
            <p className="text-slate-500 mt-1">Catat aktivitas dan progres harian Anda</p>
          </div>
          {myJournals.length > 0 && (
            <button 
              onClick={() => handlePrintAction('print-area')} 
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm px-6 py-3.5 rounded-xl flex items-center gap-2 transition shadow-lg shadow-indigo-600/20 transform hover:-translate-y-0.5"
            >
              <Download size={18}/> Unduh Riwayat (PDF)
            </button>
          )}
        </header>
        
        <form onSubmit={submitJurnal} className="bg-white p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 print:hidden">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Aktivitas Hari Ini</label>
              <textarea 
                value={kegiatan} onChange={(e)=>setKegiatan(e.target.value)} required
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-2xl p-4 h-36 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium resize-none" 
                placeholder="Ceritakan detail tugas atau materi yang Anda pelajari hari ini..."
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Dokumentasi (Opsional)</label>
              <div className="flex items-start gap-4">
                <label className="cursor-pointer bg-white px-6 py-3.5 rounded-xl border-2 border-dashed border-slate-300 hover:border-indigo-400 hover:bg-indigo-50 flex items-center gap-2 transition-all font-medium text-slate-600">
                  <Camera size={20}/> Lampirkan Foto
                  <input type="file" accept="image/*" capture="environment" className="hidden" onChange={async (e) => {
                    const file = e.target.files[0];
                    if (file) {
                      const compressedBase64 = await compressImage(file, 600, 600, 0.6);
                      setFotoJurnal(compressedBase64);
                    }
                  }} />
                </label>
                {fotoJurnal && <img src={fotoJurnal} className="h-24 w-24 object-cover rounded-xl shadow-md border-2 border-white" alt="Preview" />}
              </div>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-slate-100">
            <button type="submit" className="bg-slate-900 text-white px-8 py-3.5 rounded-xl font-bold shadow-lg shadow-slate-900/20 hover:bg-slate-800 transform hover:-translate-y-0.5 transition-all w-full sm:w-auto">
              Simpan ke Jurnal
            </button>
          </div>
        </form>

        <div className="print:hidden space-y-4">
           <h3 className="font-bold text-xl text-slate-800">Catatan Jurnal Saya</h3>
           
           <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden">
             <div className="overflow-x-auto">
               <table className="w-full text-sm text-left">
                 <thead className="bg-slate-50 text-slate-500 border-b border-slate-100">
                   <tr>
                     <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs">Tanggal</th>
                     <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs">Aktivitas</th>
                     <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs">Status</th>
                     <th className="px-6 py-4 text-center font-bold uppercase tracking-wider text-xs">Aksi</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-50">
                   {myJournals.length === 0 ? <tr><td colSpan="4" className="text-center py-10 text-slate-400 font-medium">Belum ada jurnal yang dicatat.</td></tr> : null}
                   {myJournals.map(item => (
                     <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                       <td className="px-6 py-4 font-medium text-slate-600">{item.tanggal}</td>
                       <td className="px-6 py-4 text-slate-500 truncate max-w-[250px]">{item.kegiatan}</td>
                       <td className="px-6 py-4">
                         <span className={`text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-md font-bold ${item.status === 'Disetujui' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                           {item.status}
                         </span>
                       </td>
                       <td className="px-6 py-4 text-center">
                         <div className="flex items-center justify-center gap-2">
                           <button 
                             onClick={() => setSelectedJurnal(item)} 
                             className="bg-white border border-slate-200 text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 p-2.5 rounded-xl transition-all shadow-sm"
                             title="Lihat Rincian Jurnal"
                           >
                             <Eye size={16} />
                           </button>
                           <button 
                             onClick={() => handleDeleteJurnal(item.id, item.status)} 
                             className="bg-white border border-slate-200 text-slate-700 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 p-2.5 rounded-xl transition-all shadow-sm"
                             title="Hapus Jurnal"
                           >
                             <Trash2 size={16} />
                           </button>
                         </div>
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
           </div>
        </div>

        {/* Modal Tampilan Rapi Jurnal Siswa */}
        {selectedJurnal && (
          <div className="fixed top-0 left-0 w-full h-screen z-[9999] flex items-center justify-center p-4 bg-black/40 backdrop-blur-[3px] print:hidden animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-[600px] rounded-[16px] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden scale-in-center relative">
              
              <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center shrink-0 bg-white">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center font-bold text-lg shrink-0">
                    {selectedJurnal.namaSiswa.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-slate-900 leading-tight">Rincian Jurnal Saya</h3>
                    <p className="text-[11px] font-semibold text-slate-500 mt-0.5">{selectedJurnal.tanggal}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedJurnal(null)} className="p-2 bg-slate-50 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-colors shrink-0">
                  <X size={18} />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 bg-white custom-scrollbar space-y-6 min-h-0">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">Rincian Pekerjaan</label>
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                    {selectedJurnal.kegiatan}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">Lampiran Visual</label>
                  {selectedJurnal.foto ? (
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-2 flex justify-center items-center">
                       <img src={selectedJurnal.foto} alt="Dokumentasi" className="max-w-full rounded-lg object-contain max-h-[40vh]" />
                    </div>
                  ) : (
                    <div className="bg-slate-50 border border-slate-200 border-dashed rounded-xl py-8 flex flex-col items-center justify-center text-slate-400">
                      <Camera size={32} className="mb-3 opacity-20"/>
                      <p className="text-xs font-semibold uppercase tracking-widest">Tidak ada lampiran</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="px-6 py-4 border-t border-slate-100 bg-white shrink-0 flex flex-col sm:flex-row justify-end gap-3">
                <button onClick={() => setSelectedJurnal(null)} className="px-6 py-2.5 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-200 transition-colors w-full sm:w-auto">
                  Tutup Rincian
                </button>
              </div>
              
            </div>
          </div>
        )}

        {/* --- DOKUMEN CETAK RESMI (Hanya muncul saat print) --- */}
        <div id="print-area" className="hidden print:block bg-white p-10 text-black font-serif min-h-screen">
          <div className="flex items-center justify-between border-b-4 border-black pb-6 mb-6">
            {pengaturan?.logo && <img src={pengaturan.logo} alt="Logo" className="w-24 h-24 object-contain" />}
            <div className="flex-1 text-center px-4">
              <h1 className="text-2xl font-bold uppercase leading-tight">{pengaturan?.namaSekolah || 'SMK BINA SISWA MANDIRI'}</h1>
              <p className="text-sm font-medium mt-1">BUKU JURNAL PRAKTIK KERJA LAPANGAN (PKL)</p>
              <p className="text-xs mt-0.5 tracking-widest italic text-gray-600">
                Tahun Ajaran {pengaturan?.periode || '-'} 
                {pengaturan?.tanggalMulai && pengaturan?.tanggalSelesai ? ` | Waktu Pelaksanaan: ${formatDateIndo(pengaturan.tanggalMulai)} - ${formatDateIndo(pengaturan.tanggalSelesai)}` : ''}
              </p>
            </div>
            <div className="w-24 h-24 invisible"></div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
            <div>
              <table className="w-full">
                <tbody>
                  <tr><td className="py-1 w-32 font-bold">Nama Lengkap</td><td className="py-1">: {user.nama}</td></tr>
                  <tr><td className="py-1 font-bold">NIS</td><td className="py-1">: {user.nis}</td></tr>
                  <tr><td className="py-1 font-bold">Kelas</td><td className="py-1">: {user.kelas}</td></tr>
                </tbody>
              </table>
            </div>
            <div>
              <table className="w-full">
                <tbody>
                  <tr><td className="py-1 w-32 font-bold">Tempat PKL</td><td className="py-1">: {daftarLokasi.find(l => l.id === user.lokasiId)?.nama || '-'}</td></tr>
                  <tr><td className="py-1 font-bold">Pembimbing</td><td className="py-1">: {daftarGuru.find(g => g.id === user.guruId)?.nama || '-'}</td></tr>
                </tbody>
              </table>
            </div>
          </div>

          <table className="w-full border-collapse border border-black text-[12px] mt-4">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-black px-3 py-2 w-10 text-center">NO</th>
                <th className="border border-black px-3 py-2 w-24 text-center">TANGGAL</th>
                <th className="border border-black px-3 py-2">URAIAN KEGIATAN</th>
                <th className="border border-black px-3 py-2 w-40 text-center">DOKUMENTASI</th>
                <th className="border border-black px-3 py-2 w-20 text-center">STATUS</th>
              </tr>
            </thead>
            <tbody>
              {myJournals.map((j, idx) => (
                <tr key={j.id} className="break-inside-avoid">
                  <td className="border border-black px-3 py-2 text-center align-top">{idx + 1}</td>
                  <td className="border border-black px-3 py-2 text-center align-top font-semibold">{j.tanggal}</td>
                  <td className="border border-black px-3 py-2 align-top whitespace-pre-wrap">{j.kegiatan}</td>
                  <td className="border border-black px-3 py-2 text-center align-top">
                    {j.foto ? <img src={j.foto} alt="Lampiran" className="max-w-[140px] max-h-[140px] object-contain mx-auto border border-gray-200" /> : '-'}
                  </td>
                  <td className="border border-black px-3 py-2 text-center align-top">{j.status}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-16 grid grid-cols-2 text-center break-inside-avoid">
            <div className="space-y-20">
               <div>
                 <p className="text-sm font-bold">Peserta PKL</p>
               </div>
               <div>
                 <p className="text-sm font-bold underline decoration-1 underline-offset-4">{user.nama}</p>
                 <p className="text-[10px]">NIS. {user.nis}</p>
               </div>
            </div>
            <div className="space-y-20">
               <div>
                 <p className="text-sm">Bogor, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                 <p className="text-sm font-bold">Guru Pembimbing</p>
               </div>
               <div>
                 <p className="text-sm font-bold underline decoration-1 underline-offset-4">{daftarGuru.find(g => g.id === user.guruId)?.nama || '-'}</p>
                 <p className="text-[10px]">Pembimbing Instansi Sekolah</p>
               </div>
            </div>
          </div>
        </div>

      </div>
    );
  };

  const SiswaLaporan = () => {
    const myGuru = daftarGuru.find(g => g.id === user.guruId);
    const isUploadOpen = pengaturan?.statusUpload;

    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <header>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Laporan Akhir PKL</h2>
          <p className="text-slate-500 mt-1">Penyusunan dan pengumpulan laporan resmi hasil kegiatan</p>
        </header>

        <div className="bg-white p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
          {!isUploadOpen ? (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-10 flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mb-5 shadow-sm">
                <Lock size={36} />
              </div>
              <h3 className="font-extrabold text-2xl text-amber-900 mb-3">Akses Saat Ini Ditutup</h3>
              <p className="text-amber-800/80 font-medium max-w-md leading-relaxed">
                Jadwal penyusunan dan pengumpulan Laporan Akhir PKL belum dibuka oleh Administrator Sekolah. Harap menunggu instruksi selanjutnya.
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-8">
              <div className="border-2 border-slate-100 rounded-2xl p-8 hover:border-indigo-300 hover:bg-indigo-50/20 transition-all group">
                <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Download size={28} />
                </div>
                <h3 className="font-bold text-xl text-slate-800 mb-3">1. Unduh Template Laporan</h3>
                <p className="text-sm text-slate-500 mb-8 leading-relaxed">
                  Gunakan format dokumen resmi yang telah disediakan oleh pihak sekolah untuk mulai menyusun laporan Anda.
                </p>
                <a 
                  href={pengaturan?.linkTemplate || '#'} 
                  target="_blank" 
                  rel="noreferrer" 
                  className={`block w-full text-center py-3.5 rounded-xl font-bold transition-all ${pengaturan?.linkTemplate ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/20' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}
                >
                  {pengaturan?.linkTemplate ? 'Unduh Format Laporan' : 'Template Belum Tersedia'}
                </a>
              </div>

              <div className="border-2 border-slate-100 rounded-2xl p-8 hover:border-emerald-300 hover:bg-emerald-50/20 transition-all group">
                <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Upload size={28} />
                </div>
                <h3 className="font-bold text-xl text-slate-800 mb-3">2. Kumpulkan File Final</h3>
                <p className="text-sm text-slate-500 mb-8 leading-relaxed">
                  Unggah file laporan yang sudah selesai dikerjakan langsung ke dalam folder GDrive milik Guru Pembimbing Anda.
                </p>
                <a 
                  href={myGuru?.linkFolder || '#'} 
                  target="_blank" 
                  rel="noreferrer" 
                  className={`block w-full text-center py-3.5 rounded-xl font-bold transition-all ${myGuru?.linkFolder ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}
                >
                  {myGuru?.linkFolder ? 'Buka Folder Pengumpulan' : 'Link Pembimbing Kosong'}
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };
  const AdminManage = () => {
  const [editId, setEditId] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [admins, setAdmins] = useState([]);

  const fetchAdmin = async () => {
    const { data } = await supabase.from('admin').select('*');
    if (data) setAdmins(data);
  };

  useEffect(() => {
    fetchAdmin();
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();

    const { error } = await supabase.from('admin').insert([{
      id: Date.now().toString(),
      username,
      password,
      nama: username
    }]);
    

    if (!error) {
      setUsername('');
      setPassword('');
      fetchAdmin();
    }
  };
  const handleDelete = async (id) => {
  const confirmDelete = window.confirm("Yakin ingin menghapus admin ini?");
  if (!confirmDelete) return;

  const { error } = await supabase
    .from('admin')
    .delete()
    .eq('id', id);

  if (error) {
    alert("Gagal menghapus admin!");
  } else {
    fetchAdmin(); // refresh data
  }
};

  return (
    <div className="p-6 space-y-6">

      <div>
        <h1 className="text-2xl font-bold text-slate-800">Kelola Admin</h1>
        <p className="text-slate-500">Tambah dan kelola akun administrator</p>
      </div>

      <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
        <h2 className="font-semibold mb-4 text-slate-700">Tambah Admin</h2>

        <form onSubmit={handleAdd} className="grid md:grid-cols-2 gap-4">
          
          <input
            placeholder="Username"
            value={username}
            onChange={(e)=>setUsername(e.target.value)}
            className="border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-purple-500/30 outline-none"
            required
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e)=>setPassword(e.target.value)}
            className="border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-purple-500/30 outline-none"
            required
          />

          <div className="md:col-span-2">
            <button className="bg-purple-600 hover:bg-purple-700 transition text-white px-5 py-2.5 rounded-xl shadow-md shadow-purple-500/30">
              + Tambah Admin
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
        <h2 className="font-semibold mb-4 text-slate-700">Daftar Admin</h2>
      <div className="space-y-3">
  {admins.map((a) => (
    <div 
      key={a.id} 
      className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200"
    >

      <span className="font-medium text-slate-700">{a.username}</span>

      {editId === a.id ? (
        <div className="flex gap-2">
          <input
            type="password"
            placeholder="Password baru"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="border rounded-lg px-2 py-1 text-sm"
          />

          <button 
            onClick={() => handleUpdatePassword(a.id)}
            className="bg-green-500 text-white px-2 py-1 rounded-lg text-sm"
          >
            Simpan
          </button>

          <button 
            onClick={() => setEditId(null)}
            className="bg-gray-300 px-2 py-1 rounded-lg text-sm"
          >
            Batal
          </button>
        </div>
      ) : (
        <div className="flex gap-2">
          <button 
            onClick={() => setEditId(a.id)}
            className="text-blue-500 text-sm hover:underline"
          >
            Edit
          </button>

          <button 
            onClick={() => handleDelete(a.id)}
            className="text-red-500 text-sm hover:underline"
          >
            Hapus
          </button>
        </div>
      )}

    </div>
  ))}
</div>
      </div>

    </div>
  );
};
  const GuruApproveIzin = () => {
    const [selectedIzin, setSelectedIzin] = useState(null);
    const siswaBimbinganIds = daftarSiswa.filter(s => s.guruId === user.id).map(s => s.id);
    const izinBimbingan = absensi.filter(a => (a.jenis === 'Izin' || a.jenis === 'Sakit') && siswaBimbinganIds.includes(a.siswaId)).sort((a,b) => b.timestamp - a.timestamp);

    const handleApprove = async (izinId, setujui) => {
      try {
        await supabase.from('absensi').update({ status: setujui ? 'Disetujui' : 'Ditolak' }).eq('id', izinId);
        setSelectedIzin(null);
      } catch (error) {
        alert('Gagal memproses validasi.');
      }
    };

    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <header>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Validasi Izin & Sakit</h2>
          <p className="text-slate-500 mt-1">Evaluasi permohonan ketidakhadiran siswa bimbingan</p>
        </header>

        <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs">Tanggal</th>
                  <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs">Siswa</th>
                  <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs">Jenis</th>
                  <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs">Keterangan</th>
                  <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs">Status</th>
                  <th className="px-6 py-4 text-center font-bold uppercase tracking-wider text-xs">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {izinBimbingan.length === 0 ? <tr><td colSpan="6" className="text-center py-10 text-slate-400 font-medium">Belum ada pengajuan izin/sakit.</td></tr> : null}
                {izinBimbingan.map(i => (
                  <tr key={i.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4 font-medium text-slate-600">{i.tanggal}</td>
                    <td className="px-6 py-4 font-bold text-slate-900">{i.namaSiswa}</td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-md ${i.jenis === 'Sakit' ? 'bg-amber-100 text-amber-700' : 'bg-indigo-100 text-indigo-700'}`}>
                        {i.jenis}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500 truncate max-w-[150px]">{i.keterangan || '-'}</td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-md font-bold ${
                        i.status === 'Disetujui' ? 'bg-emerald-100 text-emerald-700' : 
                        i.status === 'Ditolak' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {i.status || 'Menunggu'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button 
                        onClick={() => setSelectedIzin(i)} 
                        className="bg-white border border-slate-200 text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 p-2.5 rounded-xl transition-all shadow-sm"
                        title="Evaluasi Izin"
                      >
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Validasi Izin */}
        {selectedIzin && (
          <div className="fixed top-0 left-0 w-full h-screen z-[9999] flex items-center justify-center p-4 bg-black/40 backdrop-blur-[3px] print:hidden animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-[600px] rounded-[16px] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden scale-in-center relative">
              
              <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center shrink-0 bg-white">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg shrink-0 ${selectedIzin.jenis === 'Sakit' ? 'bg-amber-50 text-amber-600' : 'bg-indigo-50 text-indigo-600'}`}>
                    {selectedIzin.namaSiswa.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-slate-900 leading-tight">Pengajuan {selectedIzin.jenis}</h3>
                    <p className="text-[11px] font-semibold text-slate-500 mt-0.5">{selectedIzin.namaSiswa} • {selectedIzin.tanggal}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedIzin(null)} className="p-2 bg-slate-50 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-colors shrink-0">
                  <X size={18} />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 bg-white custom-scrollbar space-y-6 min-h-0">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">Keterangan / Alasan</label>
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                    {selectedIzin.keterangan || '-'}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">Lampiran / Bukti Surat</label>
                  {selectedIzin.foto ? (
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-2 flex justify-center items-center">
                       <img src={selectedIzin.foto} alt="Dokumentasi" className="max-w-full rounded-lg object-contain max-h-[40vh]" />
                    </div>
                  ) : (
                    <div className="bg-slate-50 border border-slate-200 border-dashed rounded-xl py-8 flex flex-col items-center justify-center text-slate-400">
                      <Camera size={32} className="mb-3 opacity-20"/>
                      <p className="text-xs font-semibold uppercase tracking-widest">Tidak ada lampiran</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="px-6 py-4 border-t border-slate-100 bg-white shrink-0 flex flex-col sm:flex-row justify-end gap-3">
                <button onClick={() => setSelectedIzin(null)} className="px-6 py-2.5 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-200 transition-colors w-full sm:w-auto">
                  Kembali
                </button>
                {(!selectedIzin.status || selectedIzin.status === 'Menunggu') && (
                  <>
                    <button 
                      onClick={() => handleApprove(selectedIzin.id, false)} 
                      className="px-6 py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-bold text-sm shadow-md shadow-rose-500/20 flex items-center justify-center gap-2 transition-all w-full sm:w-auto"
                    >
                      <XCircle size={16} /> Tolak
                    </button>
                    <button 
                      onClick={() => handleApprove(selectedIzin.id, true)} 
                      className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold text-sm shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all w-full sm:w-auto"
                    >
                      <CheckCircle size={16} /> Setujui
                    </button>
                  </>
                )}
              </div>
              
            </div>
          </div>
        )}
      </div>
    );
  };

  const GuruApproveJurnal = () => {
    const [selectedJurnal, setSelectedJurnal] = useState(null);
    const siswaBimbinganIds = daftarSiswa.filter(s => s.guruId === user.id).map(s => s.id);
    const jurnalBimbingan = jurnal.filter(j => siswaBimbinganIds.includes(j.siswaId)).sort((a,b) => b.timestamp - a.timestamp);

    const handleApprove = async (jurnalId) => {
      try {
        await supabase.from('jurnal').update({ status: 'Disetujui' }).eq('id', jurnalId);
        setSelectedJurnal(null);
      } catch (error) {
        alert('Gagal menyetujui jurnal.');
      }
    };

    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <header>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Validasi Jurnal</h2>
          <p className="text-slate-500 mt-1">Evaluasi dan berikan persetujuan pada log harian siswa</p>
        </header>

        <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs">Tanggal</th>
                  <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs">Siswa</th>
                  <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs">Aktivitas</th>
                  <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs">Status</th>
                  <th className="px-6 py-4 text-center font-bold uppercase tracking-wider text-xs">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {jurnalBimbingan.length === 0 ? <tr><td colSpan="5" className="text-center py-10 text-slate-400 font-medium">Belum ada jurnal yang diajukan.</td></tr> : null}
                {jurnalBimbingan.map(j => (
                  <tr key={j.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4 font-medium text-slate-600">{j.tanggal}</td>
                    <td className="px-6 py-4 font-bold text-slate-900">{j.namaSiswa}</td>
                    <td className="px-6 py-4 text-slate-500 truncate max-w-[200px]">{j.kegiatan}</td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-md font-bold ${j.status === 'Disetujui' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                        {j.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button 
                        onClick={() => setSelectedJurnal(j)} 
                        className="bg-white border border-slate-200 text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 p-2.5 rounded-xl transition-all shadow-sm"
                        title="Evaluasi Jurnal"
                      >
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Validasi Jurnal */}
        {selectedJurnal && (
          <div className="fixed top-0 left-0 w-full h-screen z-[9999] flex items-center justify-center p-4 bg-black/40 backdrop-blur-[3px] print:hidden animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-[600px] rounded-[16px] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden scale-in-center relative">
              
              <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center shrink-0 bg-white">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center font-bold text-lg shrink-0">
                    {selectedJurnal.namaSiswa.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-slate-900 leading-tight">{selectedJurnal.namaSiswa}</h3>
                    <p className="text-[11px] font-semibold text-slate-500 mt-0.5">{selectedJurnal.tanggal}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedJurnal(null)} className="p-2 bg-slate-50 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-colors shrink-0">
                  <X size={18} />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 bg-white custom-scrollbar space-y-6 min-h-0">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">Rincian Pekerjaan</label>
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                    {selectedJurnal.kegiatan}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">Lampiran Visual</label>
                  {selectedJurnal.foto ? (
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-2 flex justify-center items-center">
                       <img src={selectedJurnal.foto} alt="Dokumentasi" className="max-w-full rounded-lg object-contain max-h-[40vh]" />
                    </div>
                  ) : (
                    <div className="bg-slate-50 border border-slate-200 border-dashed rounded-xl py-8 flex flex-col items-center justify-center text-slate-400">
                      <Camera size={32} className="mb-3 opacity-20"/>
                      <p className="text-xs font-semibold uppercase tracking-widest">Tidak ada lampiran</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="px-6 py-4 border-t border-slate-100 bg-white shrink-0 flex flex-col sm:flex-row justify-end gap-3">
                <button onClick={() => setSelectedJurnal(null)} className="px-6 py-2.5 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-200 transition-colors w-full sm:w-auto">
                  Kembali
                </button>
                {selectedJurnal.status !== 'Disetujui' && (
                  <button 
                    onClick={() => handleApprove(selectedJurnal.id)} 
                    className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold text-sm shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all w-full sm:w-auto"
                  >
                    <CheckSquare size={16} /> Setujui Laporan
                  </button>
                )}
              </div>
              
            </div>
          </div>
        )}
      </div>
    );
  };

  const GuruLaporanAkhir = () => {
    const [detailSiswa, setDetailSiswa] = useState(null);
    const siswaBimbingan = daftarSiswa.filter(s => s.guruId === user.id);
    
    const userName = user?.nama || 'Guru';

    const exportCSV = () => {
      let csv = "NIS,Nama Siswa,Kelas,Perusahaan,Total Kehadiran (Hari),Total Terlambat,Total Izin,Total Sakit,Total Jurnal,Jurnal Disetujui\n";
      siswaBimbingan.forEach(s => {
        const lokasi = daftarLokasi.find(l => l.id === s.lokasiId)?.nama || '-';
        const totalHadir = absensi.filter(a => a.siswaId === s.id && a.jenis === 'Masuk').length;
        const totalTerlambat = absensi.filter(a => a.siswaId === s.id && a.jenis === 'Masuk' && a.status === 'Terlambat').length;
        const totalIzin = absensi.filter(a => a.siswaId === s.id && a.jenis === 'Izin' && a.status === 'Disetujui').length;
        const totalSakit = absensi.filter(a => a.siswaId === s.id && a.jenis === 'Sakit' && a.status === 'Disetujui').length;
        const sJurnal = jurnal.filter(j => j.siswaId === s.id);
        const totalJurnal = sJurnal.length;
        const disetujui = sJurnal.filter(j => j.status === 'Disetujui').length;
        
        csv += `"${s.nis}","${s.nama}","${s.kelas}","${lokasi}","${totalHadir}","${totalTerlambat}","${totalIzin}","${totalSakit}","${totalJurnal}","${disetujui}"\n`;
      });
      
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); 
      a.href = url; 
      a.download = `Laporan_Akhir_Bimbingan_${userName.replace(/\s+/g, '_')}.csv`; 
      a.click(); 
      URL.revokeObjectURL(url);
    };

    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 print:hidden">
          <div>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Laporan Akhir</h2>
            <p className="text-slate-500 mt-1">Rekapitulasi absensi dan jurnal siswa bimbingan</p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={exportCSV} 
              className="bg-emerald-50 text-emerald-700 font-bold text-sm px-6 py-3.5 rounded-xl flex items-center gap-2 transition border border-emerald-200 shadow-sm hover:bg-emerald-100"
            >
              <Database size={18}/> Export CSV
            </button>
            <button 
              onClick={() => handlePrintAction()} 
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm px-6 py-3.5 rounded-xl flex items-center gap-2 transition shadow-lg shadow-indigo-600/20 transform hover:-translate-y-0.5"
            >
              <FileText size={18}/> Cetak Laporan (PDF)
            </button>
          </div>
        </header>

        <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden print:hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-400 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">Identitas Siswa</th>
                  <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">Tempat PKL</th>
                  <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px] text-center">Kehadiran (H/T/I/S)</th>
                  <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px] text-center">Rekap Jurnal</th>
                  <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px] text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {siswaBimbingan.length === 0 ? <tr><td colSpan="5" className="text-center py-10 text-slate-400 font-medium">Belum ada siswa bimbingan.</td></tr> : null}
                {siswaBimbingan.map(s => {
                  const lokasi = daftarLokasi.find(l => l.id === s.lokasiId)?.nama || '-';
                  const totalHadir = absensi.filter(a => a.siswaId === s.id && a.jenis === 'Masuk').length;
                  const totalTerlambat = absensi.filter(a => a.siswaId === s.id && a.jenis === 'Masuk' && a.status === 'Terlambat').length;
                  const totalIzin = absensi.filter(a => a.siswaId === s.id && a.jenis === 'Izin' && a.status === 'Disetujui').length;
                  const totalSakit = absensi.filter(a => a.siswaId === s.id && a.jenis === 'Sakit' && a.status === 'Disetujui').length;
                  const sJurnal = jurnal.filter(j => j.siswaId === s.id);
                  const disetujui = sJurnal.filter(j => j.status === 'Disetujui').length;

                  return (
                    <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900">{s.nama}</div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">{s.nis} • {s.kelas}</div>
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-600"><span className="bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">{lokasi}</span></td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex flex-col items-center gap-1.5">
                           <span className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-lg text-xs font-bold border border-emerald-100">{totalHadir} Hadir</span>
                           <span className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded-md text-[10px] font-bold border border-amber-100">{totalTerlambat} Tlt / {totalIzin} Izn / {totalSakit} Skt</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex flex-col items-center gap-1.5">
                          <span className="text-slate-700 font-bold">{sJurnal.length} Diajukan</span>
                          <span className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded border border-indigo-100 font-bold">{disetujui} Approved</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button onClick={() => setDetailSiswa(s)} className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-900 hover:text-white hover:border-slate-900 p-2.5 rounded-xl transition-all shadow-sm" title="Lihat Rincian">
                          <Eye size={16} />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="hidden print:block bg-white p-10 text-black font-serif min-h-screen" id="print-area">
          <div className="flex items-center justify-between border-b-4 border-black pb-6 mb-8">
            {pengaturan?.logo && <img src={pengaturan.logo} alt="Logo" className="w-24 h-24 object-contain" />}
            <div className="flex-1 text-center px-4">
              <h1 className="text-2xl font-bold uppercase leading-tight">{pengaturan?.namaSekolah || 'SMK BINA SISWA MANDIRI'}</h1>
              <p className="text-sm font-medium mt-1">LAPORAN REKAPITULASI MONITORING PRAKTIK KERJA LAPANGAN (PKL)</p>
              <p className="text-xs mt-0.5 tracking-widest italic text-gray-600">
                Tahun Ajaran {pengaturan?.periode || '-'}
                {pengaturan?.tanggalMulai && pengaturan?.tanggalSelesai ? ` | Waktu Pelaksanaan: ${formatDateIndo(pengaturan.tanggalMulai)} - ${formatDateIndo(pengaturan.tanggalSelesai)}` : ''}
              </p>
            </div>
            <div className="w-24 h-24 invisible"></div>
          </div>

          <div className="mb-6 space-y-1">
            <p className="text-sm font-bold">Guru Pembimbing : <span className="font-normal">{user.nama}</span></p>
            <p className="text-sm font-bold">Tanggal Cetak : <span className="font-normal">{new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span></p>
          </div>

          <table className="w-full border-collapse border border-black text-[12px]">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-black px-3 py-2">NO</th>
                <th className="border border-black px-3 py-2">NAMA SISWA</th>
                <th className="border border-black px-3 py-2">NIS</th>
                <th className="border border-black px-3 py-2">TEMPAT PKL</th>
                <th className="border border-black px-3 py-2 text-center">KEHADIRAN (H/T/I/S)</th>
                <th className="border border-black px-3 py-2 text-center">JURNAL (OK/TOTAL)</th>
              </tr>
            </thead>
            <tbody>
              {siswaBimbingan.map((s, idx) => {
                const lokasi = daftarLokasi.find(l => l.id === s.lokasiId)?.nama || '-';
                const totalHadir = absensi.filter(a => a.siswaId === s.id && a.jenis === 'Masuk').length;
                const totalTerlambat = absensi.filter(a => a.siswaId === s.id && a.jenis === 'Masuk' && a.status === 'Terlambat').length;
                const totalIzin = absensi.filter(a => a.siswaId === s.id && a.jenis === 'Izin' && a.status === 'Disetujui').length;
                const totalSakit = absensi.filter(a => a.siswaId === s.id && a.jenis === 'Sakit' && a.status === 'Disetujui').length;
                const sJurnal = jurnal.filter(j => j.siswaId === s.id);
                const disetujui = sJurnal.filter(j => j.status === 'Disetujui').length;
                return (
                  <tr key={s.id}>
                    <td className="border border-black px-3 py-2 text-center">{idx + 1}</td>
                    <td className="border border-black px-3 py-2 font-bold uppercase">{s.nama}</td>
                    <td className="border border-black px-3 py-2 text-center">{s.nis}</td>
                    <td className="border border-black px-3 py-2">{lokasi}</td>
                    <td className="border border-black px-3 py-2 text-center">{totalHadir} / {totalTerlambat} / {totalIzin} / {totalSakit}</td>
                    <td className="border border-black px-3 py-2 text-center font-bold">{disetujui} / {sJurnal.length}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div className="mt-16 grid grid-cols-2 text-center break-inside-avoid">
            <div className="space-y-20">
               <div>
                 <p className="text-sm">Mengetahui,</p>
                 <p className="text-sm font-bold">Kepala Sekolah</p>
               </div>
               <div>
                 <p className="text-sm font-bold underline decoration-1 underline-offset-4">{pengaturan?.namaKepsek || '..............................'}</p>
                 <p className="text-[10px]">NIP. ....................................</p>
               </div>
            </div>
            <div className="space-y-20">
               <div>
                 <p className="text-sm">Bogor, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                 <p className="text-sm font-bold">Guru Pembimbing</p>
               </div>
               <div>
                 <p className="text-sm font-bold underline decoration-1 underline-offset-4">{user.nama}</p>
                 <p className="text-[10px]">NIP. {user.nip || '....................................'}</p>
               </div>
            </div>
          </div>
        </div>

        {/* Modal Rincian Laporan Siswa */}
        {detailSiswa && (
          <div className="fixed top-0 left-0 w-full h-screen z-[9999] flex items-center justify-center p-4 bg-black/40 backdrop-blur-[3px] print:hidden animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-[600px] rounded-[16px] shadow-xl flex flex-col max-h-[90vh] overflow-hidden scale-in-center relative">
              
              <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center shrink-0 bg-white">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center font-bold text-lg shrink-0">
                    {detailSiswa.nama.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-slate-900 leading-tight">Rincian Laporan Siswa</h3>
                    <p className="text-[11px] font-semibold text-slate-500 mt-0.5">{detailSiswa.nama} • {detailSiswa.kelas}</p>
                  </div>
                </div>
                <button onClick={() => setDetailSiswa(null)} className="p-2 bg-slate-50 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-colors shrink-0">
                  <X size={18} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 custom-scrollbar space-y-6 min-h-0">
                
                <div>
                  <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2"><MapPin size={14}/> Riwayat Kehadiran</h4>
                  <div className="space-y-3">
                    {absensi.filter(a => a.siswaId === detailSiswa.id).sort((a,b) => b.timestamp - a.timestamp).length === 0 ? (
                      <div className="bg-white border border-slate-200 rounded-xl p-4 text-sm text-center text-slate-400 italic">Belum ada data absensi.</div>
                    ) : (
                      absensi.filter(a => a.siswaId === detailSiswa.id).sort((a,b) => b.timestamp - a.timestamp).slice(0, 5).map(a => (
                        <div key={a.id} className="bg-white border border-slate-200 rounded-xl p-3 flex justify-between items-center shadow-sm">
                          <div>
                            <p className="text-sm font-bold text-slate-800">{a.tanggal}</p>
                            <p className="text-xs font-medium text-slate-500 mt-0.5 flex items-center gap-1"><Clock size={12}/> {a.waktu}</p>
                          </div>
                          <span className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-md ${
                              a.jenis === 'Masuk' ? 'bg-emerald-100 text-emerald-700' : 
                              a.jenis === 'Pulang' ? 'bg-rose-100 text-rose-700' : 
                              'bg-amber-100 text-amber-700'
                            }`}>
                            {a.jenis} {a.status && a.status !== 'Menunggu' ? ` • ${a.status}` : ''}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
                
                <div>
                  <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2"><BookOpen size={14}/> Riwayat Jurnal</h4>
                  <div className="space-y-3">
                    {jurnal.filter(j => j.siswaId === detailSiswa.id).sort((a,b) => b.timestamp - a.timestamp).length === 0 ? (
                      <div className="bg-white border border-slate-200 rounded-xl p-4 text-sm text-center text-slate-400 italic">Belum ada jurnal dikirim.</div>
                    ) : (
                      jurnal.filter(j => j.siswaId === detailSiswa.id).sort((a,b) => b.timestamp - a.timestamp).slice(0, 5).map(j => (
                        <div key={j.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-xs font-bold text-slate-500 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">{j.tanggal}</span>
                            <span className={`text-[10px] uppercase tracking-wider px-2 py-1 rounded-md font-bold ${j.status === 'Disetujui' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                              {j.status}
                            </span>
                          </div>
                          <p className="text-sm text-slate-700 font-medium leading-relaxed line-clamp-2">{j.kegiatan}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-slate-100 bg-white shrink-0 flex justify-end">
                <button onClick={() => setDetailSiswa(null)} className="px-6 py-2.5 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-200 transition-colors w-full sm:w-auto">
                  Tutup Rincian
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const guruMonitoring = () => {
    const [catatan, setCatatan] = useState('');
    const [fotoKunjungan, setFotoKunjungan] = useState(null);
    const [tanggalKunjungan, setTanggalKunjungan] = useState(new Date().toISOString().split('T')[0]);
    const [lokasiId, setLokasiId] = useState(''); 
    const [selectedLaporan, setSelectedLaporan] = useState(null);

    const siswaBimbingan = daftarSiswa.filter(s => s.guruId === user.id);
    const lokasiIds = [...new Set(siswaBimbingan.map(s => s.lokasiId))];
    const lokasiBimbingan = daftarLokasi.filter(l => lokasiIds.includes(l.id));

    const myMonitoring = monitoring.filter(m => m.guruId === user.id).sort((a,b) => b.timestamp - a.timestamp);

    const submitMonitoring = async (e) => {
      e.preventDefault();
      if (!lokasiId) return alert('Silakan pilih perusahaan/lokasi kunjungan terlebih dahulu!');
      
      const lokasi = daftarLokasi.find(l => l.id === lokasiId);

      if (!catatan.trim()) {
        return alert('Catatan tidak boleh kosong!');
      }
      try {
      const { error } = await supabase.from('monitoring').insert([{
        guruId: user.id,
        namaGuru: user.nama,
        lokasiId: lokasiId,
        namaLokasi: lokasi?.nama || '-',
        tanggal: new Date(tanggalKunjungan).toLocaleDateString('id-ID', { 
          day: '2-digit', 
          month: 'long', 
          year: 'numeric' 
        }),
        catatan,
        foto: fotoKunjungan || null,
        timestamp: new Date(tanggalKunjungan).getTime()
      }]);

      if (error) {
        throw error; // biar masuk catch
      }

      // RESET FORM
      setCatatan('');
      setFotoKunjungan(null);
      setLokasiId('');
      setTanggalKunjungan(new Date().toISOString().split('T')[0]); 

      // PENTING BANGET
      fetchData(); // biar langsung update tanpa refresh

      alert('Laporan berhasil terkirim!');

    } catch (error) {
      console.error(error);
      alert('Gagal mengirim laporan!');
    }
    };

    const handleDeleteMonitoring = async (id) => {
      if (window.confirm('Yakin ingin menghapus laporan kunjungan ini?')) {
        try {
          const { error } = await supabase
            .from('monitoring')
            .delete()
            .eq('id', id);

          if (error) throw error;

          fetchData(); // 🔥 WAJIB
          alert('Laporan berhasil dihapus!');
        } catch (err) {
          console.error(err);
          alert('Gagal menghapus laporan.');
        }
      }
    };

    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 print:hidden">
          <div>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Kunjungan Industri</h2>
            <p className="text-slate-500 mt-1">Formulir pelaporan hasil monitoring langsung ke perusahaan</p>
          </div>
          {myMonitoring.length > 0 && (
            <button 
              onClick={() => handlePrintAction('print-area')} 
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm px-6 py-3.5 rounded-xl flex items-center gap-2 transition shadow-lg shadow-indigo-600/20 transform hover:-translate-y-0.5"
            >
              <Download size={18}/> Unduh Riwayat (PDF)
            </button>
          )}
        </header>
        
        <form onSubmit={submitMonitoring} className="bg-white p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 print:hidden">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Perusahaan yang Dikunjungi</label>
                <select 
                  value={lokasiId} 
                  onChange={(e)=>setLokasiId(e.target.value)} 
                  required
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-2xl p-4 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium appearance-none"
                >
                  <option value="" disabled>-- Pilih Perusahaan --</option>
                  {lokasiBimbingan.map(l => (
                    <option key={l.id} value={l.id}>{l.nama}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Tanggal Kunjungan</label>
                <input 
                  type="date" 
                  value={tanggalKunjungan} 
                  onChange={(e)=>setTanggalKunjungan(e.target.value)} 
                  required
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-2xl p-4 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium" 
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Hasil Evaluasi / Catatan</label>
              <textarea 
                value={catatan} onChange={(e)=>setCatatan(e.target.value)} required
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-2xl p-4 h-36 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium resize-none" 
                placeholder="Deskripsikan kondisi siswa, lingkungan kerja, dan arahan dari pihak industri..."
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Dokumentasi Lapangan</label>
              <div className="flex items-start gap-4">
                 <label className="cursor-pointer bg-white px-6 py-3.5 rounded-xl border-2 border-dashed border-slate-300 hover:border-indigo-400 hover:bg-indigo-50 flex items-center gap-2 transition-all font-medium text-slate-600">
                   <Camera size={20}/> Lampirkan Foto
                   <input type="file" accept="image/*" onChange={async (e) => {
                     const file = e.target.files[0];
                     if (file) {
                       const compressedBase64 = await compressImage(file, 800, 800, 0.5);
                       setFotoKunjungan(compressedBase64);
                     }
                   }} className="hidden" required />
                 </label>
                 {fotoKunjungan && <img src={fotoKunjungan} className="h-24 w-24 object-cover rounded-xl shadow-md border-2 border-white" alt="Preview" />}
              </div>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-slate-100">
            <button type="submit" className="bg-slate-900 text-white px-8 py-3.5 rounded-xl font-bold shadow-lg shadow-slate-900/20 hover:bg-slate-800 transform hover:-translate-y-0.5 transition-all w-full sm:w-auto">
              Kirim Laporan
            </button>
          </div>
        </form>

        {/* RIWAYAT KUNJUNGAN */}
        <div className="print:hidden space-y-4 mt-8">
           <h3 className="font-bold text-xl text-slate-800">Riwayat Kunjungan Saya</h3>
           
           <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden">
             <div className="overflow-x-auto">
               <table className="w-full text-sm text-left">
                 <thead className="bg-slate-50 text-slate-500 border-b border-slate-100">
                   <tr>
                     <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs">Tanggal</th>
                     <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs">Perusahaan</th>
                     <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs">Catatan</th>
                     <th className="px-6 py-4 text-center font-bold uppercase tracking-wider text-xs">Aksi</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-50">
                   {myMonitoring.length === 0 ? <tr><td colSpan="4" className="text-center py-10 text-slate-400 font-medium">Belum ada riwayat kunjungan.</td></tr> : null}
                   {myMonitoring.map(item => (
                     <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                       <td className="px-6 py-4 font-medium text-slate-600">{item.tanggal}</td>
                       <td className="px-6 py-4 font-bold text-indigo-600">{item.namaLokasi || '-'}</td>
                       <td className="px-6 py-4 text-slate-500 truncate max-w-[200px]">{item.catatan}</td>
                       <td className="px-6 py-4 text-center">
                         <div className="flex items-center justify-center gap-2">
                           <button 
                             onClick={() => setSelectedLaporan(item)} 
                             className="bg-white border border-slate-200 text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 p-2.5 rounded-xl transition-all shadow-sm"
                             title="Lihat Rincian Laporan"
                           >
                             <Eye size={16} />
                           </button>
                           <button 
                             onClick={() => handleDeleteMonitoring(item.id)} 
                             className="bg-white border border-slate-200 text-slate-700 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 p-2.5 rounded-xl transition-all shadow-sm"
                             title="Hapus Laporan"
                           >
                             <Trash2 size={16} />
                           </button>
                         </div>
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
           </div>
        </div>

        {/* Modal Tampilan Rincian Kunjungan */}
        {selectedLaporan && (
          <div className="fixed top-0 left-0 w-full h-screen z-[9999] flex items-center justify-center p-4 bg-black/40 backdrop-blur-[3px] print:hidden animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-[600px] rounded-[16px] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden scale-in-center relative">
              <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center shrink-0 bg-white">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center font-bold text-lg shrink-0">
                    <Building size={20}/>
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-slate-900 leading-tight">{selectedLaporan.namaLokasi || 'Perusahaan'}</h3>
                    <p className="text-[11px] font-semibold text-slate-500 mt-0.5">{selectedLaporan.tanggal}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedLaporan(null)} className="p-2 bg-slate-50 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-colors shrink-0">
                  <X size={18} />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 bg-white custom-scrollbar space-y-6 min-h-0">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">Hasil Evaluasi / Catatan</label>
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                    {selectedLaporan.catatan}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">Dokumentasi Lapangan</label>
                  {selectedLaporan.foto ? (
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-2 flex justify-center items-center">
                       <img src={selectedLaporan.foto} alt="Dokumentasi" className="max-w-full rounded-lg object-contain max-h-[40vh]" />
                    </div>
                  ) : (
                    <div className="bg-slate-50 border border-slate-200 border-dashed rounded-xl py-8 flex flex-col items-center justify-center text-slate-400">
                      <Camera size={32} className="mb-3 opacity-20"/>
                      <p className="text-xs font-semibold uppercase tracking-widest">Tidak ada lampiran</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="px-6 py-4 border-t border-slate-100 bg-white shrink-0 flex justify-end">
                <button onClick={() => setSelectedLaporan(null)} className="px-6 py-2.5 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-200 transition-colors w-full sm:w-auto">
                  Tutup Rincian
                </button>
              </div>
            </div>
          </div>
        )}

        {/* --- DOKUMEN CETAK RESMI --- */}
        <div id="print-area" className="hidden print:block bg-white p-10 text-black font-serif min-h-screen">
          <div className="flex items-center justify-between border-b-4 border-black pb-6 mb-6">
            {pengaturan?.logo && <img src={pengaturan.logo} alt="Logo" className="w-24 h-24 object-contain" />}
            <div className="flex-1 text-center px-4">
              <h1 className="text-2xl font-bold uppercase leading-tight">{pengaturan?.namaSekolah || 'SMK BINA SISWA MANDIRI'}</h1>
              <p className="text-sm font-medium mt-1">LAPORAN KUNJUNGAN INDUSTRI (MONITORING PKL)</p>
              <p className="text-xs mt-0.5 tracking-widest italic text-gray-600">
                Tahun Ajaran {pengaturan?.periode || '-'}
                {pengaturan?.tanggalMulai && pengaturan?.tanggalSelesai ? ` | Waktu Pelaksanaan: ${formatDateIndo(pengaturan.tanggalMulai)} - ${formatDateIndo(pengaturan.tanggalSelesai)}` : ''}
              </p>
            </div>
            <div className="w-24 h-24 invisible"></div>
          </div>

          <div className="mb-6 space-y-1">
            <p className="text-sm font-bold">Nama Guru : <span className="font-normal">{user.nama}</span></p>
            <p className="text-sm font-bold">NIP : <span className="font-normal">{user.nip || '-'}</span></p>
          </div>

          <table className="w-full border-collapse border border-black text-[12px] mt-4">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-black px-3 py-2 w-10 text-center">NO</th>
                <th className="border border-black px-3 py-2 w-24 text-center">TANGGAL</th>
                <th className="border border-black px-3 py-2 w-48">PERUSAHAAN</th>
                <th className="border border-black px-3 py-2">CATATAN & HASIL EVALUASI</th>
                <th className="border border-black px-3 py-2 w-32 text-center">DOKUMENTASI</th>
              </tr>
            </thead>
            <tbody>
              {myMonitoring.map((m, idx) => (
                <tr key={m.id} className="break-inside-avoid">
                  <td className="border border-black px-3 py-2 text-center align-top">{idx + 1}</td>
                  <td className="border border-black px-3 py-2 text-center align-top font-semibold">{m.tanggal}</td>
                  <td className="border border-black px-3 py-2 align-top font-bold">{m.namaLokasi || '-'}</td>
                  <td className="border border-black px-3 py-2 align-top whitespace-pre-wrap">{m.catatan}</td>
                  <td className="border border-black px-3 py-2 text-center align-top">
                    {m.foto ? <img src={m.foto} alt="Lampiran" className="max-w-[100px] max-h-[100px] object-contain mx-auto border border-gray-200" /> : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-16 grid grid-cols-2 text-center break-inside-avoid">
            <div className="space-y-20">
               <div>
                 <p className="text-sm font-bold">Mengetahui,</p>
                 <p className="text-sm font-bold">Kepala Sekolah</p>
               </div>
               <div>
                 <p className="text-sm font-bold underline decoration-1 underline-offset-4">{pengaturan?.namaKepsek || '..............................'}</p>
                 <p className="text-[10px]">NIP. ....................................</p>
               </div>
            </div>
            <div className="space-y-20">
               <div>
                 <p className="text-sm">Bogor, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                 <p className="text-sm font-bold">Guru Pembimbing</p>
               </div>
               <div>
                 <p className="text-sm font-bold underline decoration-1 underline-offset-4">{user.nama}</p>
                 <p className="text-[10px]">NIP. {user.nip || '....................................'}</p>
               </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const AdminSiswaGuru = () => {
    const [tab, setTab] = useState('siswa');
    const [filterKelas, setFilterKelas] = useState('');
    const [filterGuruId, setFilterGuruId] = useState('');
    const [showModalSiswa, setShowModalSiswa] = useState(false);
    const [showModalGuru, setShowModalGuru] = useState(false);
    const [editingSiswa, setEditingSiswa] = useState(null);
    const [editingGuru, setEditingGuru] = useState(null);

    const uniqueKelas = [...new Set(daftarSiswa.map(s => s.kelas))].filter(Boolean);
    const filteredSiswa = daftarSiswa.filter(s => {
      return (filterKelas ? s.kelas === filterKelas : true) && (filterGuruId ? s.guruId === filterGuruId : true);
    });

    const downloadTemplate = (type) => {
      const headers = type === 'siswa' ? "NIS,Nama Lengkap,Kelas,Username,ID_Guru,ID_Lokasi\n100103,Aziz,XII RPL 1,siswa3,G1,L1" : "NIP,Nama Lengkap,Username\n19800101,Pak Guru,guru2";
      const blob = new Blob([headers], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `Template_${type}.csv`; a.click(); URL.revokeObjectURL(url);
    };

    const handleSaveSiswa = async (e) => {
        e.preventDefault();
        const form = e.target;

        const data = {
          nis: form.nis.value,
          nama: form.nama.value,
          kelas: form.kelas.value,
          username: form.username.value,
          guruId: form.guruId.value,
          lokasiId: form.lokasiId.value,
          timestamp: editingSiswa ? editingSiswa.timestamp : Date.now()
        };

        try {
          if (editingSiswa) {
            const { error } = await supabase
              .from('siswa')
              .update(data)
              .eq('id', editingSiswa.id);

            if (error) throw error;

          } else {
            const { error } = await supabase
              .from('siswa')
              .insert([data]);

            if (error) throw error;
          }

          await fetchData(); // 🔥 WAJIB

          form.reset();
          setShowModalSiswa(false);
          setEditingSiswa(null);

        } catch (err) {
          console.error(err);
          alert('Gagal menyimpan data siswa.');
        }
      };

    const handleSaveGuru = async (e) => {
      e.preventDefault();
      const form = e.target;

      const data = {
        nip: form.nip.value,
        nama: form.nama.value,
        username: form.username.value,
        linkFolder: form.linkFolder.value,
        timestamp: editingGuru ? editingGuru.timestamp : Date.now()
      };

      try {
        if (editingGuru) {
          const { error } = await supabase
            .from('guru')
            .update(data)
            .eq('id', editingGuru.id);

          if (error) throw error;

        } else {
          const { error } = await supabase
            .from('guru')
            .insert([data]);

          if (error) throw error;
        }

        await fetchData(); // 🔥 WAJIB

        form.reset();
        setShowModalGuru(false);
        setEditingGuru(null);

      } catch (err) {
        console.error(err);
        alert('Gagal menyimpan data guru.');
      }
    };

    const handleDeleteSiswa = async (id) => {
      if (window.confirm('Yakin ingin menghapus data siswa ini?')) {
        try {
          const { error } = await supabase
            .from('siswa')
            .delete()
            .eq('id', id);

          if (error) throw error;

          await fetchData(); // 🔥 WAJIB

          alert('Data siswa berhasil dihapus.');

        } catch (err) {
          console.error(err);
          alert('Gagal menghapus data siswa.');
        }
      }
    };

    const handleResetProgressSiswa = async (id, nama) => {
      if (window.confirm(`Yakin ingin mereset seluruh progres (Absensi & Jurnal) untuk siswa ${nama}? Data yang direset tidak dapat dikembalikan.`)) {
        try {
          await supabase.from('absensi').delete().eq('siswaId', id);
          await supabase.from('jurnal').delete().eq('siswaId', id);
          alert(`Progres siswa ${nama} berhasil direset.`);
        } catch (err) {
          alert('Gagal mereset progres siswa.');
        }
      }
    };

    const handleDeleteGuru = async (id) => {
      if (window.confirm('Yakin ingin menghapus data guru pembimbing ini?')) {
        try {
          await supabase.from('guru').delete().eq('id', id);
          alert('Data guru berhasil dihapus.');
        } catch (err) {
          alert('Gagal menghapus data guru.');
        }
      }
    };

    const handleResetPassword = (nama) => {
      if (window.confirm(`Reset kata sandi (password) untuk ${nama} ke pengaturan default (123456)?`)) {
        alert(`Kata sandi akun ${nama} berhasil direset! (Simulasi UI)`);
      }
    };

    const handleCsvUpload = (e, type) => {
      const file = e.target.files[0]; if (!file) return;
      const reader = new FileReader();
      reader.onload = async (evt) => {
        const lines = evt.target.result.split('\n'); let count = 0;
        for (let i = 1; i < lines.length; i++) { 
          const cols = lines[i].split(',').map(item => item?.trim() || '');
          if (!cols[0]) continue; 
          try {
            if (type === 'siswa' && cols.length >= 2) {
              await supabase.from('siswa').insert([{ nis: cols[0], nama: cols[1], kelas: cols[2] || '', username: cols[3] || cols[0], guruId: cols[4] || 'G1', lokasiId: cols[5] || 'L1', timestamp: Date.now() }]); count++;
            } else if (type === 'guru' && cols.length >= 2) {
              await supabase.from('guru').insert([{ nip: cols[0], nama: cols[1], username: cols[2] || cols[0], linkFolder: '', timestamp: Date.now() }]); count++;
            }
          } catch (err) {}
        }
        alert(`${count} data di-import!`);
      };
      reader.readAsText(file); e.target.value = null; 
    };

    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Data Entitas</h2>
            <p className="text-slate-500 mt-1">Pusat kontrol pengguna sistem</p>
          </div>
          <div className="flex bg-slate-200/50 p-1 rounded-xl">
             <button onClick={() => setTab('siswa')} className={`py-2 px-6 rounded-lg font-bold text-sm transition-all ${tab === 'siswa' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Siswa</button>
             <button onClick={() => setTab('guru')} className={`py-2 px-6 rounded-lg font-bold text-sm transition-all ${tab === 'guru' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Pembimbing</button>
          </div>
        </header>

        {tab === 'siswa' && (
          <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex flex-col xl:flex-row justify-between gap-4 bg-slate-50/50">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-wider"><Filter size={16}/> Saring:</div>
                <select value={filterKelas} onChange={e => setFilterKelas(e.target.value)} className="bg-white border border-slate-200 rounded-lg px-4 py-2 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-sm">
                  <option value="">Semua Kelas</option>
                  {uniqueKelas.map(k => <option key={k} value={k}>{k}</option>)}
                </select>
                <select value={filterGuruId} onChange={e => setFilterGuruId(e.target.value)} className="bg-white border border-slate-200 rounded-lg px-4 py-2 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-sm">
                  <option value="">Semua Pembimbing</option>
                  {daftarGuru.map(g => <option key={g.id} value={g.id}>{g.nama}</option>)}
                </select>
              </div>

              <div className="flex flex-wrap gap-3">
                <button onClick={() => downloadTemplate('siswa')} className="bg-white hover:bg-slate-50 text-slate-700 font-bold text-sm px-5 py-2.5 rounded-xl flex items-center gap-2 transition border border-slate-200 shadow-sm">
                  <Download size={16}/> Template
                </button>
                <label className="cursor-pointer bg-white hover:bg-slate-50 text-slate-700 font-bold text-sm px-5 py-2.5 rounded-xl flex items-center gap-2 transition border border-slate-200 shadow-sm">
                  <Upload size={16}/> CSV Import
                  <input type="file" accept=".csv" className="hidden" onChange={(e) => handleCsvUpload(e, 'siswa')} />
                </label>
                <button onClick={() => { setEditingSiswa(null); setShowModalSiswa(true); }} className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm px-5 py-2.5 rounded-xl flex items-center gap-2 transition shadow-lg shadow-slate-900/20">
                  <Plus size={16}/> Entri Manual
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-white text-slate-400 border-b border-slate-100">
                  <tr><th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">Identitas</th><th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">Nama Lengkap</th><th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">Kelas</th><th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">Pembimbing</th><th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px] text-center">Aksi</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredSiswa.map(s => (
                    <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                         <div className="font-bold text-slate-900">{s.nis}</div>
                         <div className="text-xs text-slate-500 font-medium mt-0.5">@{s.username}</div>
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-700">{s.nama}</td>
                      <td className="px-6 py-4 font-medium text-slate-600"><span className="bg-slate-100 px-2.5 py-1 rounded-md">{s.kelas}</span></td>
                      <td className="px-6 py-4 font-medium text-slate-600">{daftarGuru.find(g => g.id === s.guruId)?.nama || '-'}</td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => { setEditingSiswa(s); setShowModalSiswa(true); }} className="bg-white border border-slate-200 text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 p-2 rounded-xl transition-all shadow-sm" title="Edit Siswa">
                            <Edit size={16} />
                          </button>
                          <button onClick={() => handleResetPassword(s.nama)} className="bg-white border border-slate-200 text-slate-700 hover:bg-amber-50 hover:text-amber-600 hover:border-amber-200 p-2 rounded-xl transition-all shadow-sm" title="Reset Password Default">
                            <Key size={16} />
                          </button>
                          <button onClick={() => handleResetProgressSiswa(s.id, s.nama)} className="bg-white border border-slate-200 text-slate-700 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 p-2 rounded-xl transition-all shadow-sm" title="Reset Progres (Absen & Jurnal)">
                            <RotateCcw size={16} />
                          </button>
                          <button onClick={() => handleDeleteSiswa(s.id)} className="bg-white border border-slate-200 text-slate-700 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 p-2 rounded-xl transition-all shadow-sm" title="Hapus Siswa">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'guru' && (
          <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-end bg-slate-50/50 gap-3">
               <button onClick={() => downloadTemplate('guru')} className="bg-white hover:bg-slate-50 text-slate-700 font-bold text-sm px-5 py-2.5 rounded-xl flex items-center gap-2 transition border border-slate-200 shadow-sm"><Download size={16}/> Template</button>
               <label className="cursor-pointer bg-white hover:bg-slate-50 text-slate-700 font-bold text-sm px-5 py-2.5 rounded-xl flex items-center gap-2 transition border border-slate-200 shadow-sm"><Upload size={16}/> CSV Import<input type="file" accept=".csv" className="hidden" onChange={(e) => handleCsvUpload(e, 'guru')} /></label>
               <button onClick={() => { setEditingGuru(null); setShowModalGuru(true); }} className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm px-5 py-2.5 rounded-xl flex items-center gap-2 transition shadow-lg shadow-slate-900/20"><Plus size={16}/> Tambah Guru</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-white text-slate-400 border-b border-slate-100">
                  <tr><th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">Identitas (NIP)</th><th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">Nama Lengkap</th><th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">Kapasitas</th><th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px] text-center">Aksi</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {daftarGuru.map(g => (
                    <tr key={g.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4"><div className="font-bold text-slate-900">{g.nip}</div><div className="text-xs text-slate-500 font-medium mt-0.5">@{g.username}</div></td>
                      <td className="px-6 py-4 font-bold text-slate-700">{g.nama}</td>
                      <td className="px-6 py-4"><span className="bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-lg text-xs font-bold border border-indigo-100">{daftarSiswa.filter(s => s.guruId === g.id).length} Bimbingan</span></td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => { setEditingGuru(g); setShowModalGuru(true); }} className="bg-white border border-slate-200 text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 p-2 rounded-xl transition-all shadow-sm" title="Edit Guru">
                            <Edit size={16} />
                          </button>
                          <button onClick={() => handleResetPassword(g.nama)} className="bg-white border border-slate-200 text-slate-700 hover:bg-amber-50 hover:text-amber-600 hover:border-amber-200 p-2 rounded-xl transition-all shadow-sm" title="Reset Password Default">
                            <Key size={16} />
                          </button>
                          <button onClick={() => handleDeleteGuru(g.id)} className="bg-white border border-slate-200 text-slate-700 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 p-2 rounded-xl transition-all shadow-sm" title="Hapus Guru">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modal Entry Siswa */}
        {showModalSiswa && (
          <div className="fixed top-0 left-0 w-full h-screen z-[9999] flex items-center justify-center p-4 bg-black/40 backdrop-blur-[3px] print:hidden animate-in fade-in duration-200">
            <form onSubmit={handleSaveSiswa} className="bg-white w-full max-w-[600px] rounded-[16px] shadow-xl flex flex-col max-h-[90vh] overflow-hidden scale-in-center relative">
              
              <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center shrink-0 bg-white">
                <div>
                  <h3 className="font-bold text-lg text-slate-900">{editingSiswa ? 'Edit Data Siswa' : 'Registrasi Siswa'}</h3>
                  <p className="text-xs text-slate-500 mt-1">Lengkapi data profil pengguna</p>
                </div>
                <button type="button" onClick={() => { setShowModalSiswa(false); setEditingSiswa(null); }} className="p-2 bg-slate-50 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-colors shrink-0">
                  <X size={18}/>
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50 custom-scrollbar min-h-0">
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-[11px] font-bold text-slate-500 mb-2 uppercase tracking-widest">NIS</label><input name="nis" defaultValue={editingSiswa?.nis} required className="w-full border-slate-200 bg-white p-3 text-sm font-medium rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 border" /></div>
                  <div><label className="block text-[11px] font-bold text-slate-500 mb-2 uppercase tracking-widest">Username</label><input name="username" defaultValue={editingSiswa?.username} required className="w-full border-slate-200 bg-white p-3 text-sm font-medium rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 border" /></div>
                </div>
                <div><label className="block text-[11px] font-bold text-slate-500 mb-2 uppercase tracking-widest">Nama Lengkap</label><input name="nama" defaultValue={editingSiswa?.nama} required className="w-full border-slate-200 bg-white p-3 text-sm font-medium rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 border" /></div>
                <div><label className="block text-[11px] font-bold text-slate-500 mb-2 uppercase tracking-widest">Kelas</label><input name="kelas" defaultValue={editingSiswa?.kelas} required className="w-full border-slate-200 bg-white p-3 text-sm font-medium rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 border" /></div>
                <div><label className="block text-[11px] font-bold text-slate-500 mb-2 uppercase tracking-widest">Pembimbing</label><select name="guruId" defaultValue={editingSiswa?.guruId} className="w-full border-slate-200 bg-white p-3 text-sm font-medium rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 border">{daftarGuru.map(g => <option key={g.id} value={g.id}>{g.nama}</option>)}</select></div>
                <div><label className="block text-[11px] font-bold text-slate-500 mb-2 uppercase tracking-widest">Lokasi Penempatan</label><select name="lokasiId" defaultValue={editingSiswa?.lokasiId} className="w-full border-slate-200 bg-white p-3 text-sm font-medium rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 border">{daftarLokasi.map(l => <option key={l.id} value={l.id}>{l.nama}</option>)}</select></div>
              </div>
              
              <div className="px-6 py-4 border-t border-slate-100 bg-white shrink-0 flex justify-end gap-3">
                <button type="button" onClick={() => { setShowModalSiswa(false); setEditingSiswa(null); }} className="px-6 py-2.5 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-200 transition-colors w-full sm:w-auto">Batal</button>
                <button type="submit" className="w-full sm:w-auto py-2.5 px-6 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold text-sm shadow-md shadow-emerald-500/20 transition-all">{editingSiswa ? 'Perbarui Data' : 'Simpan Data'}</button>
              </div>
            </form>
          </div>
        )}

        {/* Modal Entry Guru */}
        {showModalGuru && (
           <div className="fixed top-0 left-0 w-full h-screen z-[9999] flex items-center justify-center p-4 bg-black/40 backdrop-blur-[3px] animate-in fade-in duration-200 print:hidden">
             <form onSubmit={handleSaveGuru} className="bg-white w-full max-w-[600px] rounded-[16px] shadow-xl flex flex-col max-h-[90vh] overflow-hidden scale-in-center relative">
               
               <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center shrink-0 bg-white">
                 <div>
                   <h3 className="font-bold text-lg text-slate-900">{editingGuru ? 'Edit Data Guru' : 'Registrasi Guru'}</h3>
                   <p className="text-xs text-slate-500 mt-1">Lengkapi data profil pengguna</p>
                 </div>
                 <button type="button" onClick={() => { setShowModalGuru(false); setEditingGuru(null); }} className="p-2 bg-slate-50 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-colors shrink-0">
                   <X size={18}/>
                 </button>
               </div>
               
               <div className="flex-1 overflow-y-auto p-6 bg-white space-y-4 custom-scrollbar min-h-0">
                 <div><label className="block text-[11px] font-bold text-slate-500 mb-2 uppercase tracking-widest">NIP</label><input name="nip" defaultValue={editingGuru?.nip} required className="w-full border-slate-200 bg-slate-50 p-3 text-sm font-medium rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 border" /></div>
                 <div><label className="block text-[11px] font-bold text-slate-500 mb-2 uppercase tracking-widest">Nama Lengkap & Gelar</label><input name="nama" defaultValue={editingGuru?.nama} required className="w-full border-slate-200 bg-slate-50 p-3 text-sm font-medium rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 border" /></div>
                 <div><label className="block text-[11px] font-bold text-slate-500 mb-2 uppercase tracking-widest">Username</label><input name="username" defaultValue={editingGuru?.username} required className="w-full border-slate-200 bg-slate-50 p-3 text-sm font-medium rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 border" /></div>
                 <div><label className="block text-[11px] font-bold text-slate-500 mb-2 uppercase tracking-widest">Link GDrive Pengumpulan (Opsional)</label><input name="linkFolder" defaultValue={editingGuru?.linkFolder} className="w-full border-slate-200 bg-slate-50 p-3 text-sm font-medium rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 border" placeholder="https://drive.google.com/..." /></div>
               </div>
               
               <div className="px-6 py-4 border-t border-slate-100 bg-white shrink-0 flex justify-end gap-3">
                 <button type="button" onClick={() => { setShowModalGuru(false); setEditingGuru(null); }} className="px-6 py-2.5 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-200 transition-colors w-full sm:w-auto">Batal</button>
                 <button type="submit" className="w-full sm:w-auto py-2.5 px-6 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold text-sm shadow-md shadow-emerald-500/20 transition-all">{editingGuru ? 'Perbarui Data' : 'Simpan Data'}</button>
               </div>
             </form>
           </div>
        )}
      </div>
    );
  };

  const AdminLokasi = () => {
    const [showModal, setShowModal] = useState(false);
    const [editingLokasi, setEditingLokasi] = useState(null);
    const [modalLat, setModalLat] = useState('');
    const [modalLng, setModalLng] = useState('');

    const openAddModal = () => {
      setEditingLokasi(null);
      setModalLat('');
      setModalLng('');
      setShowModal(true);
    };

    const openEditModal = (lokasi) => {
      setEditingLokasi(lokasi);
      setModalLat(lokasi.lat || '');
      setModalLng(lokasi.lng || '');
      setShowModal(true);
    };

    const handleSaveLokasi = async (e) => {
      e.preventDefault(); const form = e.target;
      const data = {
        nama: form.nama.value,
        lat: parseFloat(modalLat),
        lng: parseFloat(modalLng),
        radius: parseInt(form.radius.value),
        jamMasuk: form.jamMasuk?.value || '08:00',
        jamPulang: form.jamPulang?.value || '17:00',
        timestamp: Date.now()
      };
      
      try {
        if (editingLokasi) {
          if (editingLokasi.id === 'L1' && !editingLokasi.timestamp) {
            alert("Data contoh bawaan sistem tidak dapat diedit secara permanen. Silakan buat lokasi baru.");
            return;
          }

          const { error } = await supabase
            .from('lokasi')
            .update(data)
            .eq('id', editingLokasi.id);

          if (error) throw error;

        } else {

          const { error } = await supabase
            .from('lokasi')
            .insert([data]);

          if (error) throw error;
        }

        // 🔥 WAJIB: refresh data
        fetchData();

        // 🔥 reset UI
        setShowModal(false);
        setEditingLokasi(null);

      } catch (err) { 
        console.error(err);
        alert('Gagal menyimpan data lokasi.'); 
      }
    };

    const handleDeleteLokasi = async (id) => {
      if (window.confirm('Yakin ingin menghapus perusahaan ini? Siswa yang ditempatkan di sini mungkin akan kehilangan referensi lokasinya.')) {
        try {
          await supabase.from('lokasi').delete().eq('id', id);
          alert('Data perusahaan berhasil dihapus.');
        } catch (err) {
          alert('Gagal menghapus data.');
        }
      }
    };

    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div><h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Mitra Industri</h2><p className="text-slate-500 mt-1">Titik absensi dan jadwal perusahaan</p></div>
          <button onClick={openAddModal} className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm px-6 py-3 rounded-xl flex items-center gap-2 transition shadow-lg shadow-slate-900/20"><Plus size={18}/> Entri Lokasi</button>
        </header>

        <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-400 border-b border-slate-100">
                <tr><th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">Perusahaan</th><th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">Koordinat Geografis</th><th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">Jadwal & Radius</th><th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px] text-center">Aksi</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {daftarLokasi.map(l => (
                  <tr key={l.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-900"><div className="flex items-center gap-3"><div className="bg-indigo-50 p-2 rounded-lg text-indigo-600"><Building size={16}/></div>{l.nama}</div></td>
                    <td className="px-6 py-4 font-medium text-slate-600 font-mono text-xs bg-slate-50 px-3 py-1 rounded inline-block mt-3 ml-6 border border-slate-200">{l.lat}, {l.lng}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span className="bg-emerald-50 text-emerald-700 font-bold px-2.5 py-1 rounded-md text-[10px] border border-emerald-100 w-fit"><Clock size={10} className="inline mr-1"/> {l.jamMasuk || '08:00'} - {l.jamPulang || '17:00'}</span>
                        <span className="text-slate-500 font-medium text-xs ml-1">Radius: {l.radius}m</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => openEditModal(l)} className="bg-white border border-slate-200 text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 p-2 rounded-xl transition-all shadow-sm" title="Edit Lokasi">
                          <Edit size={16} />
                        </button>
                        <button onClick={() => handleDeleteLokasi(l.id)} className="bg-white border border-slate-200 text-slate-700 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 p-2 rounded-xl transition-all shadow-sm" title="Hapus Lokasi">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Entry Mitra */}
        {showModal && (
          <div className="fixed top-0 left-0 w-full h-screen z-[9999] flex items-center justify-center p-4 bg-black/40 backdrop-blur-[3px] animate-in fade-in duration-200 print:hidden">
            <form onSubmit={handleSaveLokasi} className="bg-white w-full max-w-[600px] rounded-[16px] shadow-xl flex flex-col max-h-[90vh] overflow-hidden scale-in-center relative">
              
              <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center shrink-0 bg-white">
                <div>
                  <h3 className="font-bold text-lg text-slate-900">{editingLokasi ? 'Edit Data Perusahaan' : 'Titik Perusahaan Baru'}</h3>
                  <p className="text-xs text-slate-500 mt-1">Atur titik GPS penempatan PKL</p>
                </div>
                <button type="button" onClick={() => {setShowModal(false); setEditingLokasi(null);}} className="p-2 bg-slate-50 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-colors shrink-0">
                  <X size={18}/>
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 bg-white space-y-4 custom-scrollbar min-h-0">
                <div><label className="block text-[11px] font-bold text-slate-500 mb-2 uppercase tracking-widest">Nama Perusahaan</label><input name="nama" defaultValue={editingLokasi?.nama || ''} required className="w-full border-slate-200 bg-slate-50 p-3 text-sm font-medium rounded-xl border focus:border-indigo-500 outline-none transition-colors" /></div>
                
                <div className="grid grid-cols-2 gap-4 relative">
                  {/* Tombol Ambil Koordinat Saat Ini */}
                  <div className="col-span-2 flex justify-end">
                      <button type="button" onClick={() => {
                        if (navigator.geolocation) {
                          navigator.geolocation.getCurrentPosition(
                            (pos) => {
                              setModalLat(pos.coords.latitude);
                              setModalLng(pos.coords.longitude);
                              alert('Koordinat berhasil didapatkan!');
                            }, 
                            (err) => {
                              alert("Gagal mendapatkan lokasi GPS. Pastikan Anda mengizinkan akses lokasi pada browser Anda. (Error: " + err.message + ")");
                            }, 
                            { enableHighAccuracy: true }
                          );
                        } else {
                          alert("Browser Anda tidak mendukung layanan lokasi GPS.");
                        }
                      }} className="text-[10px] bg-indigo-50 text-indigo-600 font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 hover:bg-indigo-100 transition-colors">
                         <MapPin size={12}/> Ambil Titik GPS Saat Ini
                      </button>
                  </div>
                  <div><label className="block text-[11px] font-bold text-slate-500 mb-2 uppercase tracking-widest">Latitude</label><input name="lat" value={modalLat} onChange={(e) => setModalLat(e.target.value)} required type="number" step="any" className="w-full border-slate-200 bg-slate-50 p-3 text-sm font-medium rounded-xl border focus:border-indigo-500 outline-none transition-colors" /></div>
                  <div><label className="block text-[10px] font-bold text-slate-500 mb-2 uppercase tracking-widest">Longitude</label><input name="lng" value={modalLng} onChange={(e) => setModalLng(e.target.value)} required type="number" step="any" className="w-full border-slate-200 bg-slate-50 p-3 text-sm font-medium rounded-xl border focus:border-indigo-500 outline-none transition-colors" /></div>
                </div>

                <div><label className="block text-[11px] font-bold text-slate-500 mb-2 uppercase tracking-widest">Radius (Meter)</label><input name="radius" defaultValue={editingLokasi?.radius || 50} required type="number" className="w-full border-slate-200 bg-slate-50 p-3 text-sm font-medium rounded-xl border focus:border-indigo-500 outline-none transition-colors" /></div>
                
                <div className="pt-2 pb-1 border-t border-slate-200">
                   <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-3">Pengaturan Jadwal Kerja</p>
                   <div className="grid grid-cols-2 gap-4">
                     <div><label className="block text-xs font-bold text-slate-400 mb-1">Jam Datang</label><input name="jamMasuk" type="time" defaultValue={editingLokasi?.jamMasuk || '08:00'} required className="w-full border-slate-200 bg-slate-50 p-3 text-sm font-bold rounded-xl border focus:border-indigo-500 outline-none transition-colors" /></div>
                     <div><label className="block text-xs font-bold text-slate-400 mb-1">Jam Pulang</label><input name="jamPulang" type="time" defaultValue={editingLokasi?.jamPulang || '17:00'} required className="w-full border-slate-200 bg-slate-50 p-3 text-sm font-bold rounded-xl border focus:border-indigo-500 outline-none transition-colors" /></div>
                   </div>
                </div>
              </div>
              
              <div className="px-6 py-4 border-t border-slate-100 bg-white flex shrink-0 justify-end gap-3">
                <button type="button" onClick={() => {setShowModal(false); setEditingLokasi(null);}} className="px-6 py-2.5 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-200 transition-colors w-full sm:w-auto">Batal</button>
                <button type="submit" className="w-full sm:w-auto py-2.5 px-6 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold text-sm shadow-md shadow-emerald-500/20 transition-all">{editingLokasi ? 'Perbarui Lokasi' : 'Simpan Lokasi'}</button>
              </div>
              
            </form>
          </div>
        )}
      </div>
    );
  };

  const AdminPengaturan = () => {
    const [namaSekolah, setNamaSekolah] = useState(pengaturan?.namaSekolah || '');
    const [namaKepsek, setNamaKepsek] = useState(pengaturan?.namaKepsek || '');
    const [periode, setPeriode] = useState(pengaturan?.periode || '');
    const [tanggalMulai, setTanggalMulai] = useState(pengaturan?.tanggalMulai || '');
    const [tanggalSelesai, setTanggalSelesai] = useState(pengaturan?.tanggalSelesai || '');
    const [logo, setLogo] = useState(pengaturan?.logo || null);
    
    const [linkTemplate, setLinkTemplate] = useState(pengaturan?.linkTemplate || '');
    const [statusUpload, setStatusUpload] = useState(pengaturan?.statusUpload || false);

    const handleBackup = () => {
      const dataToExport = { absensi, jurnal, monitoring, siswa: daftarSiswa, guru: daftarGuru, lokasi: daftarLokasi, pengaturan };
      const jsonString = JSON.stringify(dataToExport, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup_simpkl_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    };

    const handleImport = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async (evt) => {
        try {
          const importedData = JSON.parse(evt.target.result);
          if (typeof importedData !== 'object') throw new Error("Format JSON tidak valid");

          alert("Proses impor dimulai. Memulihkan data ke sistem...");

          const tables = ['siswa', 'guru', 'lokasi', 'absensi', 'jurnal', 'monitoring'];
          for (const table of tables) {
            if (importedData[table] && Array.isArray(importedData[table])) {
               for(const item of importedData[table]) {
                 await supabase.from(table).upsert([item]);
               }
            }
          }
          if (importedData.pengaturan) {
             await supabase.from('pengaturan').upsert([importedData.pengaturan]);
          }

          alert("Impor berhasil! Halaman akan dimuat ulang.");
          window.location.reload();
        } catch (err) {
          alert("Gagal mengimpor data. Pastikan file berformat JSON hasil backup SimPKL.");
        }
      };
      reader.readAsText(file);
      e.target.value = null;
    };

    const handleImageUpload = async (e) => {
      const file = e.target.files[0];
      if (file) {
        const compressedBase64 = await compressImage(file, 400, 400, 0.9);
        setLogo(compressedBase64);
      }
    };

    const handleSave = async (e) => {
      e.preventDefault();
      try {
        await supabase.from('pengaturan').upsert([
          { id: 'global', namaSekolah, namaKepsek, periode, tanggalMulai, tanggalSelesai, logo, linkTemplate, statusUpload, timestamp: Date.now() }
        ]);
        alert('Pengaturan tersimpan!');
      } catch (err) {}
    };

    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <header>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Konfigurasi Global</h2>
          <p className="text-slate-500 mt-1">Identitas dan pengaturan inti sistem</p>
        </header>
        
        <form onSubmit={handleSave} className="bg-white p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 max-w-3xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
               <div><label className="block text-xs font-bold text-slate-500 mb-2 uppercase">Instansi</label><input type="text" value={namaSekolah} onChange={(e) => setNamaSekolah(e.target.value)} className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl p-4 font-medium outline-none focus:bg-white focus:border-indigo-500" required /></div>
               <div><label className="block text-xs font-bold text-slate-500 mb-2 uppercase">Pimpinan</label><input type="text" value={namaKepsek} onChange={(e) => setNamaKepsek(e.target.value)} className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl p-4 font-medium outline-none focus:bg-white focus:border-indigo-500" required /></div>
               <div><label className="block text-xs font-bold text-slate-500 mb-2 uppercase">Tahun Ajaran</label><input type="text" value={periode} onChange={(e) => setPeriode(e.target.value)} className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl p-4 font-medium outline-none focus:bg-white focus:border-indigo-500" required /></div>
               <div className="grid grid-cols-2 gap-4">
                 <div><label className="block text-xs font-bold text-slate-500 mb-2 uppercase">Mulai Pelaksanaan</label><input type="date" value={tanggalMulai} onChange={(e) => setTanggalMulai(e.target.value)} className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl p-4 font-medium outline-none focus:bg-white focus:border-indigo-500" required /></div>
                 <div><label className="block text-xs font-bold text-slate-500 mb-2 uppercase">Selesai Pelaksanaan</label><input type="date" value={tanggalSelesai} onChange={(e) => setTanggalSelesai(e.target.value)} className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl p-4 font-medium outline-none focus:bg-white focus:border-indigo-500" required /></div>
               </div>
            </div>
            
            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 flex flex-col items-center justify-center text-center">
              <label className="block text-xs font-bold text-slate-500 mb-4 uppercase w-full text-left">Logo Institusi</label>
              <div className="w-32 h-32 bg-white rounded-3xl shadow-sm border-2 border-dashed border-slate-300 flex items-center justify-center mb-6 relative overflow-hidden group">
                 {logo ? <img src={logo} alt="Preview Logo" className="w-full h-full object-contain p-2" /> : <Camera size={32} className="text-slate-300" />}
                 <div className="absolute inset-0 bg-slate-900/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-white text-xs font-bold">Ubah</span>
                 </div>
                 <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleImageUpload} />
              </div>
              <p className="text-xs text-slate-500 font-medium leading-relaxed px-4">Unggah aset resolusi tinggi (PNG transparan) untuk hasil terbaik.</p>
            </div>
          </div>

          <div className="pt-6 mt-8 border-t border-slate-200 space-y-6">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest">Pengaturan Laporan Akhir PKL</h3>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">Link Template Laporan (Google Docs / Word)</label>
              <input type="url" value={linkTemplate} onChange={(e) => setLinkTemplate(e.target.value)} className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl p-4 font-medium outline-none focus:bg-white focus:border-indigo-500" placeholder="https://docs.google.com/..." />
            </div>
            <label className="flex items-center gap-4 cursor-pointer bg-slate-50 p-4 rounded-xl border border-slate-200 hover:bg-slate-100 transition-colors">
               <input type="checkbox" checked={statusUpload} onChange={(e) => setStatusUpload(e.target.checked)} className="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500" />
               <div>
                  <p className="font-bold text-slate-800 text-sm">Buka Akses Pengumpulan Laporan</p>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">Izinkan siswa untuk mulai mengunduh template dan mengumpulkan laporan ke pembimbing.</p>
               </div>
            </label>
          </div>
          
          <div className="mt-8 pt-6 border-t border-slate-100 flex justify-end">
            <button type="submit" className="bg-slate-900 text-white px-8 py-3.5 rounded-xl font-bold shadow-lg shadow-slate-900/20 hover:bg-slate-800 transform hover:-translate-y-0.5 transition-all w-full md:w-auto">Simpan Konfigurasi</button>
          </div>
        </form>

        <div className="bg-white p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 max-w-3xl">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-indigo-50 p-2 rounded-lg text-indigo-600"><Database size={20} /></div>
            <h3 className="text-xl font-bold text-slate-900">Manajemen Data (Backup & Restore)</h3>
          </div>
          <p className="text-sm text-slate-500 mb-6">Amankan data sistem dengan mengunduh cadangan lokal atau pulihkan dari file backup sebelumnya (.json).</p>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <button onClick={handleBackup} type="button" className="flex-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-6 py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition border border-indigo-200 shadow-sm">
              <Download size={18}/> Ekspor Data (Backup)
            </button>
            
            <label className="flex-1 cursor-pointer bg-slate-50 hover:bg-slate-100 text-slate-700 px-6 py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition border border-slate-200 shadow-sm">
              <Upload size={18}/> Impor Data (Restore)
              <input type="file" accept=".json" className="hidden" onChange={handleImport} />
            </label>
          </div>
          <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider mt-4 text-center bg-amber-50 py-2 rounded-lg border border-amber-100">Peringatan: Impor data akan menambahkan/menimpa data yang sudah ada di sistem.</p>
        </div>
      </div>
    );
  };

  const AdminLaporan = () => {
    const [selectedLaporan, setSelectedLaporan] = useState(null);

    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <header>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Arsip Kunjungan</h2>
          <p className="text-slate-500 mt-1">Rekapitulasi hasil monitoring lapangan dari pembimbing</p>
        </header>
        <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-400 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">Tanggal</th>
                  <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">Asesor</th>
                  <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">Perusahaan</th>
                  <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">Catatan Evaluasi</th>
                  <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px] text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {monitoring.length === 0 ? <tr><td colSpan="5" className="text-center py-10 text-slate-400 font-medium">Belum ada laporan kunjungan.</td></tr> : null}
                {monitoring.sort((a,b) => b.timestamp - a.timestamp).map(m => (
                  <tr key={m.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-500">{m.tanggal}</td>
                    <td className="px-6 py-4 font-bold text-slate-900">{m.namaGuru}</td>
                    <td className="px-6 py-4 font-bold text-indigo-600">{m.namaLokasi || '-'}</td>
                    <td className="px-6 py-4 text-slate-700 font-medium"><div className="truncate max-w-[200px] md:max-w-[300px]">{m.catatan}</div></td>
                    <td className="px-6 py-4 text-center">
                      <button 
                        onClick={() => setSelectedLaporan(m)} 
                        className="bg-white border border-slate-200 text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 p-2.5 rounded-xl transition-all shadow-sm" 
                        title="Lihat Rincian"
                      >
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Rincian Kunjungan */}
        {selectedLaporan && (
          <div className="fixed top-0 left-0 w-full h-screen z-[9999] flex items-center justify-center p-4 bg-black/40 backdrop-blur-[3px] print:hidden animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-[600px] rounded-[16px] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden scale-in-center relative">
              
              {/* HEADER MODAL */}
              <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center shrink-0 bg-white">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center font-bold text-lg shrink-0">
                    {selectedLaporan.namaGuru?.charAt(0) || 'G'}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-slate-900 leading-tight">Rincian Kunjungan</h3>
                    <p className="text-[11px] font-semibold text-slate-500 mt-0.5">{selectedLaporan.tanggal} • {selectedLaporan.namaGuru}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedLaporan(null)} className="p-2 bg-slate-50 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-colors shrink-0">
                  <X size={18} />
                </button>
              </div>

              {/* BODY MODAL */}
              <div className="flex-1 overflow-y-auto p-6 bg-white custom-scrollbar space-y-6 min-h-0">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2"><Building size={14}/> Lokasi Perusahaan</label>
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 text-sm font-bold text-indigo-700">
                    {selectedLaporan.namaLokasi || '-'}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2"><FileText size={14}/> Catatan Evaluasi</label>
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                    {selectedLaporan.catatan}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2"><Camera size={14}/> Dokumentasi Lapangan</label>
                  {selectedLaporan.foto ? (
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-2 flex justify-center items-center">
                      <img src={selectedLaporan.foto} alt="Dokumentasi" className="max-w-full rounded-lg object-contain max-h-[40vh]" />
                    </div>
                  ) : (
                    <div className="bg-slate-50 border border-slate-200 border-dashed rounded-xl py-8 flex flex-col items-center justify-center text-slate-400">
                      <Camera size={32} className="mb-3 opacity-20"/>
                      <p className="text-xs font-semibold uppercase tracking-widest">Tidak ada lampiran</p>
                    </div>
                  )}
                </div>
              </div>

              {/* FOOTER MODAL */}
              <div className="px-6 py-4 border-t border-slate-100 bg-white shrink-0 flex justify-end">
                <button onClick={() => setSelectedLaporan(null)} className="px-6 py-2.5 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-200 transition-colors w-full sm:w-auto">
                  Tutup Rincian
                </button>
              </div>

            </div>
          </div>
        )}
      </div>
    );
  };

  const renderContent = () => {
  if (activeMenu === 'dashboard') {
    return (
      <Dashboard
        user={user}
        daftarSiswa={daftarSiswa}
        daftarGuru={daftarGuru}
        daftarLokasi={daftarLokasi}
        absensi={absensi}
        jurnal={jurnal}
      />
    );
  }

    if (activeMenu === 'absensi' && user.role === 'siswa') return <SiswaAbsensi />;
    if (activeMenu === 'jurnal' && user.role === 'siswa') return <SiswaJurnal />;
    if (activeMenu === 'laporan_pkl' && user.role === 'siswa') return <SiswaLaporan />;
    if (activeMenu === 'admin_manage' && user.role === 'admin') return <AdminManage />;

    if (activeMenu === 'siswa_bimbingan' && user.role === 'guru') {
      return (
        <GuruBimbingan
          user={user}
          daftarSiswa={daftarSiswa}
          daftarLokasi={daftarLokasi}
          supabase={supabase}
        />
      );
    }

    if (activeMenu === 'approve_jurnal' && user.role === 'guru') return <GuruApproveJurnal />;
    if (activeMenu === 'approve_izin' && user.role === 'guru') return <GuruApproveIzin />;

    if (activeMenu === 'monitoring' && user.role === 'guru') 
      return (<GuruMonitoring
      user={user}
      daftarSiswa={daftarSiswa}
      daftarLokasi={daftarLokasi}
      absensi={absensi}
      jurnal={jurnal}
      monitoring={monitoring}
      supabase={supabase}
    />);

    if (activeMenu === 'laporan_akhir' && user.role === 'guru') return <GuruLaporanAkhir />;

    if (activeMenu === 'siswa' && user.role === 'admin') return <AdminSiswaGuru />;
    if (activeMenu === 'lokasi' && user.role === 'admin') return <AdminLokasi />;
    if (activeMenu === 'pengaturan' && user.role === 'admin') return <AdminPengaturan />;
    if (activeMenu === 'laporan' && user.role === 'admin') return <AdminLaporan />;
    
    return null;
  };

  const roleTheme = {
    siswa: {
      sidebar: 'bg-gradient-to-b from-indigo-800 via-slate-900 to-black',
      activeMenu: 'bg-gradient-to-r from-indigo-600 to-indigo-500 shadow-indigo-500/25',
      iconBg: 'bg-indigo-600 shadow-indigo-500/20',
      textHighlight: 'text-indigo-500',
      glowMain: 'bg-indigo-100',
      mobileIcon: 'bg-indigo-600',
      mobileNavActive: 'text-indigo-600 bg-indigo-50',
      selection: 'selection:bg-indigo-100 selection:text-indigo-900'
    },
    guru: {
      sidebar: 'bg-gradient-to-b from-emerald-800 via-slate-900 to-black',
      activeMenu: 'bg-gradient-to-r from-emerald-600 to-emerald-500 shadow-emerald-500/25',
      iconBg: 'bg-emerald-600 shadow-emerald-500/20',
      textHighlight: 'text-emerald-500',
      glowMain: 'bg-emerald-100',
      mobileIcon: 'bg-emerald-600',
      mobileNavActive: 'text-emerald-600 bg-emerald-50',
      selection: 'selection:bg-emerald-100 selection:text-emerald-900'
    },
    admin: {
      sidebar: 'bg-gradient-to-b from-purple-800 via-slate-900 to-black',
      activeMenu: 'bg-gradient-to-r from-purple-600 to-purple-500 shadow-purple-500/25',
      iconBg: 'bg-purple-600 shadow-purple-500/20',
      textHighlight: 'text-purple-500',
      glowMain: 'bg-purple-100',
      mobileIcon: 'bg-purple-600',
      mobileNavActive: 'text-purple-600 bg-purple-50',
      selection: 'selection:bg-purple-100 selection:text-purple-900'
    }
  }[user.role] || {};

  return (
    <div className={`min-h-screen bg-[#F8FAFC] flex ${roleTheme.selection} font-sans transition-colors duration-500`}>
      <aside className={`w-[280px] ${roleTheme.sidebar} border-r border-slate-800/60 hidden md:flex flex-col relative z-20 transition-all duration-700`}>
        <div className="absolute top-0 right-0 w-full h-32 bg-gradient-to-b from-white/5 to-transparent pointer-events-none"></div>
        <div className="p-8 flex items-center gap-4 relative">
          {pengaturan?.logo ? (
            <img src={pengaturan.logo} alt="Logo" className="w-12 h-12 object-contain bg-white rounded-xl p-1" />
          ) : (
            <div className={`${roleTheme.iconBg} text-white w-12 h-12 rounded-xl flex items-center justify-center shadow-lg transition-colors duration-500`}><Activity size={24} /></div>
          )}
          <div className="overflow-hidden">
            <h1 className="font-extrabold text-xl text-white tracking-tight">Sim<span className={`${roleTheme.textHighlight} transition-colors duration-500`}>PKL</span></h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest truncate">{pengaturan?.namaSekolah || 'Bina Siswa'}</p>
          </div>
        </div>
        
        <div className="flex-1 py-6 px-4 space-y-1.5 overflow-y-auto custom-scrollbar relative">
          <p className="px-4 text-[10px] font-bold text-white/40 uppercase tracking-widest mb-4">Navigasi Utama</p>
          {menus[user.role].map(menu => {
            const isActive = activeMenu === menu.id;
            return (
              <button
                key={menu.id}
                onClick={() => changeMenu(menu.id)}
                className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all duration-300 ${
                  isActive ? `${roleTheme.activeMenu} text-white shadow-lg transform translate-x-1` : 'text-white/50 hover:text-white hover:bg-white/5'
                }`}
              >
                <menu.icon size={20} className={isActive ? 'text-white' : 'text-white/50'} />
                {menu.label}
              </button>
            )
          })}
        </div>

        <div className="p-6">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between hover:bg-white/10 transition-colors">
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-white truncate">{user.nama}</p>
              <p className="text-[10px] font-bold text-white/50 uppercase tracking-wider mt-0.5">{user.role}</p>
            </div>
            <button onClick={() => setUser(null)} className="p-2.5 text-rose-400 bg-rose-500/10 hover:bg-rose-500 hover:text-white rounded-xl transition-all" title="Keluar">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-64 bg-white/50 backdrop-blur-3xl -z-10 border-b border-slate-200/50"></div>
        <div className={`absolute top-0 right-0 w-[600px] h-[600px] ${roleTheme.glowMain} opacity-60 blur-[120px] rounded-full -z-20 transition-colors duration-700`}></div>

        <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/50 px-6 py-4 md:hidden flex justify-between items-center sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <div className={`${roleTheme.mobileIcon} p-1.5 rounded-lg text-white transition-colors duration-500`}><Activity size={18} /></div>
            <span className="font-extrabold text-slate-900 tracking-tight text-lg">Sim<span className={`${roleTheme.textHighlight} transition-colors duration-500`}>PKL</span></span>
          </div>
          <button onClick={() => setUser(null)} className="text-slate-400 hover:text-rose-500 p-2"><LogOut size={20} /></button>
        </header>

        <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col">
          <div className="min-h-full flex flex-col">
            <div className="flex-1 px-4 py-8 md:p-12 relative z-20 w-full">
              <div key={activeMenu} className="max-w-5xl mx-auto animate-page-enter">
                {renderContent()}
              </div>
            </div>

            <footer className="w-full bg-[#f5f5f5] min-h-[70px] py-5 px-6 md:px-10 flex flex-col md:flex-row items-center justify-between gap-4 mt-auto border-t border-slate-200 print:hidden relative z-10 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                  <Building size={14} className="text-slate-500" />
                </div>
                <p className="text-xs font-semibold text-slate-600">
                  © 2026 {pengaturan?.namaSekolah || 'SMK Bina Siswa Mandiri Bl. Limbangan'}
                </p>
              </div>
              <div className="bg-white px-5 py-2.5 rounded-full shadow-[0_2px_10px_rgb(0,0,0,0.06)] border border-slate-100 flex items-center gap-2 hover:shadow-md transition-shadow cursor-default">
                <span className="text-[11px] font-bold text-slate-600">Made with</span>
                <span className="text-rose-500 text-[11px] animate-pulse">❤️</span>
                <span className="text-[11px] font-bold text-slate-600">by AzzKun Ganteng Guru Bsm</span>
              </div>
            </footer>
          </div>
        </div>
        
        <nav className="md:hidden bg-white/80 backdrop-blur-xl border-t border-slate-200/50 p-2 pb-safe sticky bottom-0 z-30 print:hidden">
  
  <div className="flex overflow-x-auto no-scrollbar gap-2 px-2">

    {menus[user.role].map(menu => {
      const isActive = activeMenu === menu.id;
      const Icon = menu.icon;

      return (
        <button
          key={menu.id}
          onClick={() => changeMenu(menu.id)}
          className={`flex flex-col items-center justify-center min-w-[80px] px-3 py-2 rounded-2xl transition-all ${
            isActive
              ? roleTheme.mobileNavActive
              : 'text-slate-400 hover:bg-slate-50'
          }`}
        >
          <Icon size={20} className="mb-1" />
          <span className={`text-[11px] ${isActive ? 'font-bold' : 'font-medium'}`}>
            {menu.label.split(' ')[0]}
          </span>
        </button>
      );
    })}

  </div>
</nav>
      </main>

      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
        @keyframes scale-y { from { transform: scaleY(0); } to { transform: scaleY(1); } }
        .animate-scale-y { transform-origin: bottom; animation: scale-y 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @keyframes page-enter { 0% { opacity: 0; transform: translateY(20px) scale(0.98); filter: blur(5px); } 100% { opacity: 1; transform: none; filter: none; } }
        .animate-page-enter { animation: page-enter 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @keyframes scale-in-center { 0% { transform: scale(0.9); opacity: 0; } 100% { transform: none; opacity: 1; } }
        .scale-in-center { animation: scale-in-center 0.3s cubic-bezier(0.250, 0.460, 0.450, 0.940) both; }
      `}} />
    </div>
  );
}