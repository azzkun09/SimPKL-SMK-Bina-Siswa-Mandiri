import { useState } from 'react';
import { Activity } from 'lucide-react';
import { Player } from "@lottiefiles/react-lottie-player";

export default function Login({ setUser, daftarSiswa, daftarGuru, supabase, pengaturan }) {

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

  // 🔥 LOGIN SUPABASE (INI YANG PENTING)
  const handleLogin = async () => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: username + "@mail.com",
    password: password,
  });

  if (error) {
    alert("Login gagal: " + error.message);
    return;
  }

  // 🔥 ambil user login
  const user = data.user;

  // 🔥 cek ke tabel user kamu (misal: users)
  const { data: userData, error: roleError } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (roleError) {
    alert("Gagal ambil data user");
    return;
  }

  // 🔥 VALIDASI ROLE
  if (userData.role !== loginRole) {
    alert("Role tidak sesuai!");
    await supabase.auth.signOut();
    return;
  }

  // ✅ kalau cocok → masuk
  if (loginRole === "admin") {
    navigate("/admin");
  } else if (loginRole === "guru") {
    navigate("/guru");
  } else {
    navigate("/siswa");
  }
};

  return (
    <div className={`min-h-screen flex flex-col justify-between relative overflow-x-hidden bg-gradient-to-br ${bgThemes[loginRole]}`}>

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

        <div className="leading-tight">
          <h1 className="text-white font-bold text-sm">
            {pengaturan?.namaAplikasi || 'SimPKL'}
          </h1>
          <p className="text-white/70 text-[11px]">
            {pengaturan?.namaSekolah || 'SMK Bina Siswa Mandiri'}
          </p>
        </div>
      </div>

      {/* GLOW */}
      <div className="absolute inset-0 pointer-events-none">
        <div className={`absolute -top-40 -left-32 w-[500px] h-[500px] rounded-full ${glowThemes[loginRole]} blur-[140px]`} />
        <div className={`absolute bottom-[-100px] right-[-80px] w-[400px] h-[400px] rounded-full ${glowThemes[loginRole]} blur-[120px]`} />
      </div>

      {/* HERO */}
      <div className={`w-full h-[250px] md:h-[320px] bg-gradient-to-r ${heroThemes[loginRole]} rounded-b-[60px] md:rounded-b-[70px] relative flex items-end justify-center`}>

        {/* LOTTIE */}
        <div className="absolute bottom-[-10px] md:bottom-[-50px] z-0 pointer-events-none">
          <Player
            autoplay
            loop
            src="/lottie/login.json"
            className="w-[230px] sm:w-[260px] md:w-[320px] lg:w-[380px]"
          />
        </div>

      </div>

      {/* CARD */}
      <div className="w-full flex justify-center px-4 mt-10 md:mt-20">

        <div className="
          w-full 
          max-w-[330px] md:max-w-[420px]
          bg-white/80 
          backdrop-blur-2xl 
          p-5 md:p-8 
          rounded-[24px] md:rounded-[28px]
          shadow-[0_15px_40px_rgba(0,0,0,0.25)]
          border border-white/20
          relative z-20
        ">

          {/* HEADER */}
          <div className="text-center mb-4">
            <h1 className="text-lg md:text-2xl font-bold text-gray-800">
              {loginRole === 'siswa' && 'Login Siswa'}
              {loginRole === 'guru' && 'Login Guru'}
              {loginRole === 'admin' && 'Login Admin'}
            </h1>

            <p className="text-gray-400 text-xs md:text-sm mt-1">
              {pengaturan?.namaSekolah || 'SMK Bina Siswa Mandiri'}
            </p>
          </div>

          {/* ROLE */}
          <div className="flex gap-2 mb-3">
            {['siswa', 'guru', 'admin'].map(r => (
              <button
                key={r}
                onClick={() => setLoginRole(r)}
                className={`flex-1 py-2 rounded-lg text-sm capitalize transition-all duration-300
                ${
                  loginRole === r
                    ? `${buttonThemes[r]} text-white shadow-md scale-105`
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
            className="w-full mb-3 py-2.5 px-4 rounded-xl text-sm bg-white/80 focus:ring-2 focus:ring-emerald-400 outline-none"
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full mb-4 py-2.5 px-4 rounded-xl text-sm bg-white/80 focus:ring-2 focus:ring-emerald-400 outline-none"
          />

          {/* BUTTON */}
          <button
            onClick={handleLogin}
            className={`
              w-full py-2.5
              rounded-xl
              text-white text-sm font-semibold
              shadow-md hover:shadow-lg
              transition-all duration-300
              ${buttonThemes[loginRole]}
            `}
          >
            Masuk →
          </button>

        </div>
      </div>

      {/* FOOTER */}
      <footer className="text-center text-gray-300 text-xs md:text-sm pb-6 mt-6">
        © 2026 {pengaturan?.namaSekolah || 'SMK Bina Siswa Mandiri'}
      </footer>

    </div>
  );
}