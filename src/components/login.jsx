import { useState } from 'react';
import { Activity } from 'lucide-react';
import { Player } from "@lottiefiles/react-lottie-player";

export default function Login({ setUser, supabase, pengaturan }) {

  const [loginRole, setLoginRole] = useState('siswa');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const heroThemes = { 
    siswa: 'from-emerald-400 to-emerald-600',
    guru: 'from-indigo-500 to-indigo-700',
    admin: 'from-purple-500 to-purple-700'
  };

  const buttonThemes = { 
    siswa: 'bg-emerald-500 hover:bg-emerald-600', 
    guru: 'bg-indigo-500 hover:bg-indigo-600', 
    admin: 'bg-purple-500 hover:bg-purple-600' 
  };

  const bgThemes = {
    siswa: 'from-emerald-900 via-emerald-800 to-black',
    guru: 'from-indigo-900 via-indigo-800 to-black',
    admin: 'from-purple-900 via-purple-800 to-black'
  };

  const glowThemes = {
    siswa: 'bg-emerald-400/30',
    guru: 'bg-indigo-400/30',
    admin: 'bg-purple-400/30'
  };

  // 🔥 LOGIN FIX TANPA AUTH
  const handleLogin = async () => {
  if (!username || !password) {
    alert("Isi username & password dulu!");
    return;
  }

  const { data, error } = await supabase
    .from(loginRole)
    .select("*")
    .eq("username", username)
    .eq("password", password);

  // kalau error supabase
  if (error) {
    console.error(error);
    alert("Terjadi kesalahan server");
    return;
  }

  // 🔥 INI KUNCI NYA (BIAR GAK CRASH)
  if (!data || data.length === 0) {
    alert("Username atau password salah!");
    return;
  }

  // ambil user pertama
  const user = data[0];

  // 🔥 pastikan user valid
  if (!user) {
    alert("Data user tidak ditemukan!");
    return;
  }

  // simpan
  setUser(user);
  localStorage.setItem("user", JSON.stringify(user));
};

  return (
    <div className={`min-h-screen flex flex-col justify-between bg-gradient-to-br ${bgThemes[loginRole]}`}>

      {/* HEADER */}
      <div className="absolute top-4 left-6 z-30 flex items-center gap-3 px-4 py-2 rounded-2xl 
        bg-white/10 backdrop-blur-xl border border-white/20 shadow-lg">

        {pengaturan?.logo ? (
          <img src={pengaturan.logo} className="w-10 h-10 object-contain" />
        ) : (
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <Activity size={20} className="text-white"/>
          </div>
        )}

        <div>
          <h1 className="text-white font-bold text-sm">
            {pengaturan?.namaAplikasi || 'SimPKL'}
          </h1>
          <p className="text-white/70 text-[11px]">
            {pengaturan?.namaSekolah || 'SMK Bina Siswa Mandiri'}
          </p>
        </div>
      </div>

      {/* HERO */}
      <div className={`w-full h-[250px] md:h-[320px] bg-gradient-to-r ${heroThemes[loginRole]} rounded-b-[60px] flex items-end justify-center relative`}>

        {/* LOTTIE */}
        <div className="absolute bottom-[-15px] md:bottom-[-60px]">
          <Player
            autoplay
            loop
            src="/lottie/login.json"
            className="w-[260px] md:w-[320px]"
          />
        </div>

      </div>

      {/* CARD */}
      <div className="w-full flex justify-center px-4 mt-12 md:mt-24">

        <div className="w-full max-w-[340px] md:max-w-[420px] bg-white/80 backdrop-blur-2xl 
          p-5 md:p-8 rounded-[26px] shadow-xl border border-white/20">

          {/* HEADER */}
          <div className="text-center mb-4">
            <h1 className="text-lg md:text-2xl font-bold text-gray-800">
              Login {loginRole}
            </h1>

            <p className="text-gray-400 text-xs md:text-sm">
              {pengaturan?.namaSekolah}
            </p>
          </div>

          {/* ROLE */}
          <div className="flex gap-2 mb-3">
            {['siswa', 'guru', 'admin'].map(r => (
              <button
                key={r}
                onClick={() => setLoginRole(r)}
                className={`flex-1 py-2 rounded-lg text-sm capitalize
                ${loginRole === r
                    ? `${buttonThemes[r]} text-white`
                    : 'bg-gray-100 text-gray-500'
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          {/* INPUT */}
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full mb-3 py-2.5 px-4 rounded-xl bg-white"
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full mb-4 py-2.5 px-4 rounded-xl bg-white"
          />

          {/* BUTTON */}
          <button
            onClick={handleLogin}
            className={`w-full py-2.5 rounded-xl text-white font-semibold ${buttonThemes[loginRole]}`}
          >
            Masuk →
          </button>

        </div>
      </div>

      {/* FOOTER */}
      <footer className="text-center text-gray-300 text-xs pb-6 mt-6">
        © 2026 {pengaturan?.namaSekolah}
      </footer>

    </div>
  );
}