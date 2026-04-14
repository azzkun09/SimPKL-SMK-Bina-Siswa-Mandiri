import { useState, useRef, useEffect } from "react";
import jsPDF from "jspdf";
// ❌ html2canvas tidak dipakai lagi

export default function GuruMonitoring({
  user,
  monitoring = [],
  setMonitoring,
  supabase
}) {
  const [catatan, setCatatan] = useState("");
  const [foto, setFoto] = useState(null);
  const [tanggal, setTanggal] = useState("");
  const pdfRef = useRef();

  const toBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
    });

  const fetchMonitoring = async () => {
    const { data, error } = await supabase
      .from("monitoring")
      .select("*")
      .order("timestamp", { ascending: false });

    if (!error) {
      setMonitoring(data);
    }
  };

  useEffect(() => {
    fetchMonitoring();
  }, []);

  const handleDelete = async (item) => {
    if (!confirm("Yakin mau hapus data ini?")) return;

    const { error } = await supabase
      .from("monitoring")
      .delete()
      .eq("timestamp", item.timestamp);

    if (error) {
      alert("Gagal hapus");
      return;
    }

    await fetchMonitoring();
  };

  const handleSave = async () => {
    let fotoBase64 = null;

    if (foto) {
      fotoBase64 = await toBase64(foto);
    }

    const dataBaru = {
      guruId: user.id,
      namaGuru: user.nama,
      tanggal: tanggal || new Date().toLocaleDateString("id-ID"),
      catatan,
      foto: fotoBase64,
      timestamp: Date.now(),
    };

    const { error } = await supabase
      .from("monitoring")
      .insert([dataBaru]);

    if (error) {
      alert("Gagal simpan");
      return;
    }

    await fetchMonitoring();

    setCatatan("");
    setFoto(null);
    setTanggal("");
  };

  // 🔥 PDF FIX TOTAL (PASTI WORK)
  const handleDownloadPDF = () => {
  const pdf = new jsPDF("p", "mm", "a4");

  // ===== HEADER =====
  pdf.setFont("Times", "Bold");
  pdf.setFontSize(14);
  pdf.text("SMK BINA SISWA MANDIRI", 105, 15, { align: "center" });

  pdf.setFontSize(11);
  pdf.text("LAPORAN MONITORING GURU PKL", 105, 21, { align: "center" });

  pdf.line(14, 25, 196, 25);

  // ===== INFO =====
  pdf.setFont("Times", "Normal");
  pdf.setFontSize(10);
  pdf.text(`Nama Guru : ${user?.nama}`, 14, 32);
  pdf.text(`Tanggal Cetak : ${new Date().toLocaleDateString("id-ID")}`, 14, 38);

  // ===== TABLE SETUP (LEBAR DIPERBESAR) =====
  let y = 48;

  const col = {
    no: 14,
    tanggal: 24,
    catatan: 60,
    foto: 150
  };

  const width = {
    no: 10,
    tanggal: 36,
    catatan: 90,
    foto: 46
  };

  // ===== HEADER TABLE =====
  pdf.setFillColor(230, 230, 230);
  pdf.setDrawColor(0);

  pdf.rect(col.no, y, width.no, 10, "FD");
  pdf.rect(col.tanggal, y, width.tanggal, 10, "FD");
  pdf.rect(col.catatan, y, width.catatan, 10, "FD");
  pdf.rect(col.foto, y, width.foto, 10, "FD");

  pdf.setFont("Times", "Bold");
  pdf.setFontSize(10);

  pdf.text("No", col.no + width.no / 2, y + 6, { align: "center" });
  pdf.text("Tanggal", col.tanggal + width.tanggal / 2, y + 6, { align: "center" });
  pdf.text("Catatan", col.catatan + width.catatan / 2, y + 6, { align: "center" });
  pdf.text("Dokumentasi", col.foto + width.foto / 2, y + 6, { align: "center" });

  y += 12;

  // ===== DATA =====
  pdf.setFont("Times", "Normal");
  pdf.setFontSize(10);

  monitoring.forEach((item, i) => {
    const catatanLines = pdf.splitTextToSize(item.catatan || "-", width.catatan - 6);
    const textHeight = catatanLines.length * 5;

    const imgHeight = 25;
    const rowHeight = Math.max(textHeight + 8, imgHeight + 6);

    // PAGE BREAK
    if (y + rowHeight > 270) {
      pdf.addPage();
      y = 20;
    }

    // BORDER
    pdf.rect(col.no, y, width.no, rowHeight);
    pdf.rect(col.tanggal, y, width.tanggal, rowHeight);
    pdf.rect(col.catatan, y, width.catatan, rowHeight);
    pdf.rect(col.foto, y, width.foto, rowHeight);

    // TEXT (ADA PADDING)
    pdf.text(String(i + 1), col.no + width.no / 2, y + 6, { align: "center" });

    pdf.text(
      item.tanggal || "-",
      col.tanggal + width.tanggal / 2,
      y + 6,
      { align: "center" }
    );

    pdf.text(
      catatanLines,
      col.catatan + 3,
      y + 6
    );

    // FOTO (FIX TIDAK LUBER)
    if (item.foto) {
      try {
        const imgWidth = 38;

        const imgX = col.foto + (width.foto - imgWidth) / 2;
        const imgY = y + (rowHeight - imgHeight) / 2;

        pdf.addImage(item.foto, "JPEG", imgX, imgY, imgWidth, imgHeight);
      } catch {
        pdf.text("-", col.foto + width.foto / 2, y + 6, { align: "center" });
      }
    }

    y += rowHeight;
  });

  // ===== TTD =====
  y += 15;

  pdf.text("Mengetahui,", 140, y);
  pdf.text("Guru Pembimbing", 140, y + 6);

  pdf.text(user?.nama || "-", 140, y + 22);

  pdf.save("laporan-monitoring.pdf");
};

  return (
    <div className="p-6">

      <h1 className="text-3xl font-bold text-gray-800">
        Monitoring Guru
      </h1>
      <p className="text-gray-500 mb-6">
        Catat kunjungan ke lokasi PKL siswa
      </p>

      {/* FORM */}
      <div className="bg-white rounded-3xl shadow-sm p-6 mb-8">

        <p className="font-semibold mb-2">Kunjungan Hari Ini</p>

        <div className="mb-4">
          <label className="text-sm text-gray-500 block mb-1">
            Tanggal Kunjungan
          </label>
          <input
            type="date"
            value={tanggal}
            onChange={(e) => setTanggal(e.target.value)}
            className="w-full bg-gray-100 rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>

        <textarea
          value={catatan}
          onChange={(e) => setCatatan(e.target.value)}
          placeholder="Tuliskan hasil kunjungan, kondisi siswa, dll..."
          className="w-full bg-gray-100 rounded-xl p-4 mb-4 outline-none focus:ring-2 focus:ring-indigo-400 min-h-[140px]"
        />

        <p className="text-sm text-gray-500 mb-2">
          Dokumentasi (Opsional)
        </p>

        <label className="block mb-4">
          <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center cursor-pointer hover:border-indigo-400 transition">
            {!foto ? (
              <div className="text-gray-500 text-sm">
                📷 Klik untuk upload foto kunjungan
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <img
                  src={URL.createObjectURL(foto)}
                  className="w-32 h-24 object-cover rounded-lg border"
                />
                <span className="text-xs text-gray-400">
                  Klik untuk ganti foto
                </span>
              </div>
            )}
          </div>

          <input
            type="file"
            accept="image/*"
            onChange={(e) => setFoto(e.target.files[0])}
            className="hidden"
          />
        </label>

        <button
          onClick={handleSave}
          className="bg-indigo-900 text-white px-6 py-2 rounded-xl shadow"
        >
          Simpan Kunjungan
        </button>
      </div>

      {/* HEADER */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-semibold text-gray-700">
          Riwayat Kunjungan
        </h2>

        <button
          onClick={handleDownloadPDF}
          className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm"
        >
          Download PDF
        </button>
      </div>

      {/* LIST */}
      <div className="bg-white rounded-3xl shadow-sm p-4">
        {monitoring.length > 0 ? (
          <div className="space-y-4">

            {monitoring.map((item, i) => (
              <div
                key={i}
                className="flex justify-between items-start border-b pb-3"
              >
                <div className="flex gap-3">
                  {item.foto && (
                    <img
                      src={item.foto}
                      className="w-20 h-16 object-cover rounded-lg border"
                    />
                  )}

                  <div>
                    <p className="text-xs text-gray-400">
                      {item.tanggal}
                    </p>

                    <p className="text-sm text-gray-800">
                      {item.catatan}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleDelete(item)}
                  className="text-red-500 text-xs hover:underline"
                >
                  Hapus
                </button>
              </div>
            ))}

          </div>
        ) : (
          <p className="text-gray-400">
            Belum ada kunjungan
          </p>
        )}
      </div>

    </div>
  );
}