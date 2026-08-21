import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  Send, Stethoscope, User2, Loader2, Heart, Sparkles, 
  MessageSquare, X, ChevronRight, AlertCircle, LayoutDashboard,
  FolderKanban, ClipboardList, Users, UserPlus, Building2, 
  BedDouble, Pill, LogOut, Menu, ShieldAlert
} from "lucide-react";
import ReactMarkdown from "react-markdown";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: "Klinik & Apotek Harapan Sehat — SIMRS" }] }),
  component: Index,
});

// 👇 UBAH URL INI NANTI SESUAI DENGAN LINK RAILWAY KAMU YANG BARU
const RAILWAY_BASE_URL = "https://klinik-harapan-sehat-ai-production-3384.up.railway.app";

type ChatMessage = { id: string; role: "user" | "doctor"; content: string; };

function makeId() { return Math.random().toString(36).slice(2) + Date.now().toString(36); }

const QUICK_PROMPTS = [
  "Saya demam dan pusing sejak kemarin",
  "Bagaimana pola makan sehat?",
  "Anak saya batuk pilek, apa yang harus dilakukan?",
];

function Avatar({ role }: { role: "user" | "doctor" }) {
  const isDoctor = role === "doctor";
  return (
    <div className={"flex h-8 w-8 shrink-0 items-center justify-center rounded-full shadow-md ring-2 ring-white " + (isDoctor ? "bg-indigo-600 text-white" : "bg-slate-200 text-slate-700")}>
      {isDoctor ? <Heart className="h-4 w-4" fill="currentColor" /> : <User2 className="h-4 w-4" />}
    </div>
  );
}

function MessageBubble({ message, onSend }: { message: ChatMessage, onSend: (text: string) => void }) {
  const isUser = message.role === "user";
  let mainText = message.content;
  let questions: string[] = [];
  let recommendationText = "";

  if (!isUser && message.content.includes("PERTANYAAN LANJUTAN UNTUK MEMASTIKAN:")) {
    const parts = message.content.split("PERTANYAAN LANJUTAN UNTUK MEMASTIKAN:");
    mainText = parts[0].trim();
    const subParts = parts[1].split("⚠️ **REKOMENDASI MEDIS:**");
    questions = subParts[0].split('\n').filter(q => q.trim().length > 3);
    if (subParts.length > 1) recommendationText = subParts[1].trim();
  } else if (!isUser && message.content.includes("⚠️ **REKOMENDASI MEDIS:**")) {
    const parts = message.content.split("⚠️ **REKOMENDASI MEDIS:**");
    mainText = parts[0].trim();
    recommendationText = parts[1].trim();
  }

  return (
    <div className={`flex items-end gap-2 my-2 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && <Avatar role="doctor" />}
      <div className={"relative max-w-[85%] rounded-2xl px-4 py-3 text-xs shadow-sm leading-relaxed " + (isUser ? "rounded-br-sm bg-indigo-600 text-white font-medium" : "rounded-bl-sm bg-white text-slate-800 border border-slate-200")}>
        <div className={!isUser ? "pr-6" : ""}>
          <ReactMarkdown components={{
              p: ({ node, ...props }) => <p className={`mb-2 last:mb-0 ${isUser ? "text-white" : "text-slate-800"}`} {...props} />,
              strong: ({ node, ...props }) => <strong className={`font-semibold ${isUser ? "text-white" : "text-slate-900"}`} {...props} />,
            }}>{mainText}</ReactMarkdown>

          {questions.length > 0 && (
            <div className="mt-3 pt-3 border-t border-indigo-100">
              <div className="flex flex-col gap-3">
                {questions.map((q, i) => {
                  const rawText = q.replace(/\*\*/g, '').trim();
                  if (!rawText) return null;
                  const match = rawText.match(/^([a-zA-Z0-9]\.)\s*(.*)/);
                  const prefix = match ? match[1].toUpperCase() : "•";
                  const cleanQ = match ? match[2] : rawText;

                  return (
                    <div key={i} className="flex flex-col rounded-lg border border-indigo-200 bg-indigo-50/80 p-2.5 transition-all hover:border-indigo-300 shadow-sm">
                      <div className="flex items-start text-xs font-medium text-indigo-900 mb-2.5">
                        <span className="font-extrabold text-indigo-700 w-5 shrink-0">{prefix}</span>
                        <span className="leading-relaxed">{cleanQ}</span>
                      </div>
                      <div className="flex items-center gap-2 ml-5">
                        <button onClick={() => onSend(`Ya, pasien terkonfirmasi mengalami ini: ${cleanQ}`)} className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white px-2 py-1.5 rounded text-[10px] font-bold tracking-wide transition-colors shadow-sm">Terkonfirmasi (Ya)</button>
                        <button onClick={() => onSend(`Tidak, pasien negatif / tidak mengalami ini: ${cleanQ}`)} className="flex-1 bg-rose-500 hover:bg-rose-600 text-white px-2 py-1.5 rounded text-[10px] font-bold tracking-wide transition-colors shadow-sm">Negatif (Tidak)</button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {recommendationText && (
            <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-2.5">
              <p className="text-[10px] font-bold text-amber-700 mb-0.5 flex items-center gap-1"><AlertCircle className="h-3 w-3" /> REKOMENDASI MEDIS</p>
              <p className="text-xs text-amber-900 leading-relaxed">{recommendationText}</p>
            </div>
          )}
        </div>
      </div>
      {isUser && <Avatar role="user" />}
    </div>
  );
}

function Index() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("administrator");
  const [password, setPassword] = useState("");
  const [selectedRoom, setSelectedRoom] = useState("Poli Umum");
  const [showPassword, setShowPassword] = useState(false);
  
  const [activeMenu, setActiveMenu] = useState("DASHBOARD");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentTime, setCurrentTime] = useState("");

  const [formData, setFormData] = useState({
    nama: "Rayi Amada Surya Ridwan",
    umur: "18",
    jenis_kelamin: "Laki-laki",
    tensi: "120/80",
    keluhan: "",
    riwayat: "Tidak ada alergi obat."
  });

  const [isOpen, setIsOpen] = useState(false);
  const pesanAwal = { id: makeId(), role: "doctor" as const, content: "Halo! Saya mesin analitik HsDX. Ada data klinis yang perlu ditinjau? 👋" };
  const [messages, setMessages] = useState<ChatMessage[]>([pesanAwal]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isOpen && scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [messages, loading, isOpen]);

  async function sendMessage(text: string) {
    if (!text || loading) return;
    const userMsg: ChatMessage = { id: makeId(), role: "user", content: text };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput("");
    setLoading(true);

    try {
      // Menggunakan variabel RAILWAY_BASE_URL agar mudah diganti
      const endpoint = selectedRoom === "Poli Gigi" 
        ? `${RAILWAY_BASE_URL}/konsultasi/gigi`
        : `${RAILWAY_BASE_URL}/konsultasi/umum`;

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updated }),
      });
      
      if (!res.ok) throw new Error("Server sibuk");
      const data = await res.json();
      setMessages([...updated, { id: makeId(), role: "doctor", content: data.pesan }]);
    } catch {
      setMessages([...updated, { id: makeId(), role: "doctor", content: "Maaf, gagal terhubung ke server AI Railway." }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  function handleSubmit(e?: FormEvent) { 
    e?.preventDefault(); 
    sendMessage(input.trim()); 
  }

  const handleBantuanHsDX = () => {
    if (!formData.keluhan.trim()) {
      alert("Keluhan pasien tidak boleh kosong sebelum menjalankan analisis.");
      return;
    }
    const autoPrompt = `SKRINING KLINIS PASIEN:\n- Usia: ${formData.umur} tahun\n- Gender: ${formData.jenis_kelamin}\n- Tensi: ${formData.tensi}\n- Keluhan: ${formData.keluhan}\n- Riwayat: ${formData.riwayat}`;
    setIsOpen(true);
    sendMessage(autoPrompt);
  };

  if (!isLoggedIn) {
    return (
      <div className="relative min-h-screen flex items-center justify-center bg-slate-900 overflow-hidden font-sans">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?q=80&w=1920&auto=format&fit=crop')] bg-cover bg-center opacity-30 filter blur-sm"></div>
        <div className="relative z-10 w-full max-w-md p-8 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-white/20 mx-4">
          <div className="flex flex-col items-center mb-6">
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-emerald-600 text-white font-bold px-2.5 py-1 rounded text-sm shadow">S</span>
              <span className="bg-teal-700 text-white font-bold px-2.5 py-1 rounded text-sm shadow">H</span>
              <h1 className="text-2xl font-black text-slate-800 tracking-tight">Harapan Sehat</h1>
            </div>
            <p className="text-xs font-semibold text-emerald-600 uppercase tracking-widest">pasti mudah 🩺</p>
          </div>
          <form onSubmit={(e) => { e.preventDefault(); setIsLoggedIn(true); }} className="space-y-4">
            <div><input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username" className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500" required /></div>
            <div><input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500" required /></div>
            <div>
              <select value={selectedRoom} onChange={(e) => setSelectedRoom(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer">
                <option value="Poli Umum">Poli Umum / Admisi</option>
                <option value="Poli Gigi">Poli Gigi & Mulut</option>
                <option value="UGD">UGD (Gawat Darurat)</option>
                <option value="Apotek">Apotek & Farmasi</option>
              </select>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-600"><input type="checkbox" id="showPass" checked={showPassword} onChange={() => setShowPassword(!showPassword)} className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"/><label htmlFor="showPass" className="cursor-pointer">Lihat Password</label></div>
            <button type="submit" className="w-full py-3 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-lg shadow-md transition duration-200 text-sm">Masuk</button>
            <button type="button" onClick={() => alert("Hubungi IT.")} className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-lg shadow-md transition duration-200 text-sm">Daftar</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex font-sans text-slate-800 relative">
      
      {/* SIDEBAR MENU */}
      <aside className={`${sidebarOpen ? "w-64" : "w-20"} bg-white border-r border-slate-200 transition-all duration-300 flex flex-col z-30 shrink-0 shadow-sm`}>
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-100">
          {sidebarOpen ? (
            <div className="flex items-center gap-2">
              <span className="bg-emerald-600 text-white font-bold px-1.5 py-0.5 rounded text-xs">SH</span>
              <span className="font-extrabold text-sm text-slate-800">Harapan Sehat</span>
            </div>
          ) : (
            <span className="font-bold text-emerald-600 mx-auto">SH</span>
          )}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-500"><Menu className="w-5 h-5" /></button>
        </div>
        <div className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
          {[
            { name: "DASHBOARD", icon: LayoutDashboard },
            { name: "PROGRAM KERJA 2026", icon: FolderKanban },
            { name: "PROGRAM KERJA 2025", icon: FolderKanban },
            { name: "SURVEY", icon: ClipboardList },
            { name: "ADMISI & OPERASIONAL", icon: Building2 },
            { name: "PENDAFTARAN", icon: UserPlus },
            { name: "PERAWAT POLI", icon: Users },
            { name: "POLI RAWAT JALAN", icon: Stethoscope },
            { name: "UGD", icon: ShieldAlert },
            { name: "OBSERVASI", icon: ClipboardList },
            { name: "RAWAT INAP", icon: BedDouble },
            { name: "APOTEK", icon: Pill },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activeMenu === item.name;
            return (
              <button
                key={item.name}
                onClick={() => setActiveMenu(item.name)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition ${isActive ? "bg-teal-700 text-white shadow-md" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"}`}
              >
                <div className="flex items-center gap-3"><Icon className="w-4 h-4 shrink-0" />{sidebarOpen && <span className="truncate">{item.name}</span>}</div>
                {sidebarOpen && <ChevronRight className={`w-3.5 h-3.5 opacity-60 ${isActive ? "rotate-90" : ""}`} />}
              </button>
            );
          })}
        </div>
        
        {sidebarOpen && (
          <div className="p-4 border-t border-slate-200 bg-slate-50 mt-auto shrink-0">
            <p className="sandi-kriptik text-slate-400 text-center text-sm opacity-50 hover:opacity-100 transition-opacity cursor-default hover:text-red-600">
              SVNKEY OVERRIDE ACTIVE
            </p>
          </div>
        )}
      </aside>

      {/* KONTEN UTAMA */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 z-20 shadow-sm">
          <div className="flex items-center gap-4"><span className="text-xs font-semibold px-3 py-1 bg-teal-50 text-teal-800 rounded-full border border-teal-200">Ruangan: {selectedRoom}</span></div>
          <div className="flex items-center gap-6">
            <div className="text-base font-mono font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-lg border border-slate-200 shadow-inner">{currentTime}</div>
            <div className="flex items-center gap-2 border-l pl-6 border-slate-200">
              <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-xs shadow-inner">{username.charAt(0).toUpperCase()}</div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-bold text-slate-800 leading-none">{username} ({selectedRoom})</p>
                <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">Online</p>
              </div>
            </div>
            <button onClick={() => setIsLoggedIn(false)} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs font-semibold transition border border-red-200"><LogOut className="w-3.5 h-3.5" /> Keluar</button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-200">
            <div>
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <LayoutDashboard className="w-4 h-4 text-teal-600" /> Dashboard Utama — {activeMenu}
              </h2>
              <p className="text-xs text-slate-500">Statistik real-time operasional Klinik & Apotek Harapan Sehat.</p>
            </div>
            <div className="text-xs font-medium bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600">📅 Periode: 2026-08-04 - 2026-08-11</div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { title: "Total Kunjungan Pasien", val: "1.697", color: "border-l-4 border-l-sky-500 text-sky-600" },
              { title: "Total Pasien Lama", val: "1.390", color: "border-l-4 border-l-emerald-500 text-emerald-600" },
              { title: "Pasien Baru", val: "307", color: "border-l-4 border-l-amber-500 text-amber-600" },
              { title: "Total Terlayani", val: "1.426", color: "border-l-4 border-l-indigo-500 text-indigo-600" },
            ].map((stat, idx) => (
              <div key={idx} className={`bg-white p-5 rounded-xl shadow-sm border border-slate-200 ${stat.color} flex flex-col justify-between`}>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{stat.title}</p>
                <h3 className="text-3xl font-extrabold text-slate-800 mt-3">{stat.val}</h3>
              </div>
            ))}
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 relative">
            <h3 className="text-sm font-bold text-slate-800 mb-4 border-b pb-2 flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-teal-600" /> Manajemen Pasien & Skrining HsDX
            </h3>
            
            <div className="flex flex-col md:flex-row gap-8">
              <div className="flex-1 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Nama Pasien</label>
                    <input type="text" value={formData.nama} disabled className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-500 cursor-not-allowed" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Tanda Vital (Tensi)</label>
                    <input type="text" value={formData.tensi} onChange={(e) => setFormData({...formData, tensi: e.target.value})} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-teal-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Usia</label>
                    <input type="text" value={formData.umur} onChange={(e) => setFormData({...formData, umur: e.target.value})} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-teal-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Gender</label>
                    <select value={formData.jenis_kelamin} onChange={(e) => setFormData({...formData, jenis_kelamin: e.target.value})} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-teal-500">
                      <option>Laki-laki</option>
                      <option>Perempuan</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Keluhan Utama (Anamnesis)</label>
                  <textarea 
                    value={formData.keluhan} 
                    onChange={(e) => setFormData({...formData, keluhan: e.target.value})} 
                    placeholder="Contoh: Pusing berputar sejak pagi, mual, pandangan gelap..."
                    className="w-full h-24 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-teal-500 resize-none"
                  />
                </div>
              </div>

              <div className="w-full md:w-1/3 flex flex-col justify-between space-y-4">
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Riwayat Penyakit / Alergi</label>
                    <textarea 
                      value={formData.riwayat} 
                      onChange={(e) => setFormData({...formData, riwayat: e.target.value})} 
                      className="w-full h-16 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-teal-500 resize-none"
                    />
                  </div>
                  <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-3">
                    <p className="text-[10px] text-indigo-800 font-medium leading-relaxed">
                      Sistem HsDX akan menganalisis keluhan klinis dan memunculkannya di chat interaktif untuk evaluasi lebih lanjut.
                    </p>
                  </div>
                </div>

                <div className="flex items-end justify-between mt-auto pt-4">
                  <button 
                    onClick={handleBantuanHsDX}
                    disabled={loading}
                    className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-3 rounded-xl font-bold shadow-md transition-all disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                    {loading ? "Memproses HsDX..." : "Jalankan HsDX"}
                  </button>
                  <div className="ml-4 flex flex-col items-center justify-center text-indigo-400 opacity-80 bg-indigo-50 p-2 rounded-lg border border-indigo-100">
                    <Heart className="w-6 h-6" fill="currentColor"/>
                    <span className="text-[8px] font-black tracking-widest mt-1">HsDX</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* FLOATING AI CHAT ASSISTANT */}
      <div className="fixed bottom-6 right-6 z-50">
        {isOpen && (
          <div className="mb-4 w-[360px] md:w-[400px] h-[520px] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-fade-in">
            <div className="bg-indigo-700 text-white p-4 flex items-center justify-between shrink-0 shadow-sm">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center border border-indigo-500"><Heart className="h-4 w-4 text-white" fill="currentColor" /></div>
                <div>
                  <h3 className="font-bold text-sm leading-tight">Mesin HsDX ({selectedRoom})</h3>
                  <p className="text-[10px] text-indigo-200 flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Terhubung ke Railway API</p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-indigo-200 hover:text-white p-1 rounded-lg transition"><X className="h-5 w-5" /></button>
            </div>
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 bg-slate-50/50">
              {messages.map((m) => (<MessageBubble key={m.id} message={m} onSend={sendMessage} />))}
              {loading && (
                <div className="flex items-center gap-2 my-2"><Avatar role="doctor" /><div className="bg-white border border-slate-200 rounded-2xl px-4 py-3 shadow-sm"><Loader2 className="h-4 w-4 animate-spin text-indigo-600" /></div></div>
              )}
            </div>
            {messages.length <= 1 && (
              <div className="px-3 py-2 bg-white border-t border-slate-100 flex gap-1.5 overflow-x-auto">
                {QUICK_PROMPTS.map((p) => (<button key={p} onClick={() => sendMessage(p)} className="shrink-0 rounded-full border border-indigo-200 bg-indigo-50/50 px-3 py-1 text-[11px] font-medium text-indigo-700 hover:bg-indigo-100">{p}</button>))}
              </div>
            )}
            <form onSubmit={handleSubmit} className="p-3 bg-white border-t border-slate-200 shrink-0 flex items-center gap-2">
              <textarea ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(); } }} rows={1} placeholder={`Tanya HsDX seputar ${selectedRoom}...`} className="flex-1 resize-none bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 max-h-20" disabled={loading}/>
              <button type="submit" disabled={loading || !input.trim()} className="h-9 w-9 shrink-0 bg-indigo-600 text-white rounded-xl flex items-center justify-center hover:bg-indigo-700 transition disabled:opacity-50 shadow-sm"><Send className="h-4 w-4" /></button>
            </form>
          </div>
        )}
        <button onClick={() => setIsOpen(!isOpen)} className="h-14 w-14 rounded-full bg-indigo-600 text-white shadow-xl flex items-center justify-center hover:bg-indigo-700 transition-all hover:scale-105 relative group">
          <MessageSquare className="h-6 w-6" />
          <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-emerald-500 border-2 border-white animate-pulse"></span>
        </button>
      </div>

    </div>
  );
}