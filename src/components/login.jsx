import { useState } from 'react';
import { Activity } from 'lucide-react';
import { Player } from "@lottiefiles/react-lottie-player";

export default function Login({ setUser, daftarSiswa, daftarGuru, supabase, pengaturan, changeMenu }) {

  const [loginRole, setLoginRole] = useState('siswa');

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

  return (
    <div className={`min-h-screen flex flex-col justify-between bg-gradient-to-br ${bgThemes[loginRole]}`}>

      {/* HEADER */}
      <div className="px-4 pt-6">
        <div className="max-w-md mx-auto flex items-center gap-3 px-4 py-2 rounded-2xl 
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
      </div>

      {/* HERO */}
      <div className={`relative w-full h-[240px] md:h-[300px] bg-gradient-to-r ${heroThemes[loginRole]} rounded-b-[50px] flex items-end justify-center`}>

        {/* LOTTIE FIX */}
        <div className="absolute -bottom-12 md:-bottom-16 z-20 w-full flex justify-center">
          <div className="w-[220px] sm:w-[260px] md:w-[320px]">
            <Player
              autoplay
              loop
              src="/lottie/login.json"
              className="w-full h-full"
            />
          </div>
        </div>

      </div>

      {/* CARD */}
      <div className="w-full flex justify-center px-4 mt-16 md:mt-24">

        <div className="
          w-full 
          max-w-md
          bg-white/90 
          backdrop-blur-xl 
          p-5 md:p-7
          rounded-2xl
          shadow-xl
        ">

          {/* HEADER */}
          <div className="text-center mb-4">
            <h1 className="text-lg md:text-xl font-bold text-gray-800">
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
                className={`flex-1 py-2 rounded-lg text-sm capitalize transition
                ${
                  loginRole === r
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
            className="w-full mb-3 py-2.5 px-4 rounded-xl text-sm bg-gray-100 focus:ring-2 focus:ring-emerald-400 outline-none"
          />

          <input
            type="password"
            placeholder="Password"
            className="w-full mb-4 py-2.5 px-4 rounded-xl text-sm bg-gray-100 focus:ring-2 focus:ring-emerald-400 outline-none"
          />

          {/* BUTTON */}
          <button className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-sm font-semibold">
            Masuk →
          </button>

        </div>
      </div>

      {/* FOOTER FIX */}
      <div className="text-center text-white/70 text-sm pb-6 mt-6">
        © 2026 {pengaturan?.namaSekolah || 'SMK Bina Siswa Mandiri'}
      </div>

    </div>
  );
}