import { useState, useEffect } from 'react';
import axios from 'axios';
import { auth } from '../firebase';
import { useNavigate } from 'react-router-dom';

const CreateMatch = () => {
  const [players, setPlayers] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // --- FİLTRELEME STATE'LERİ ---
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPosition, setFilterPosition] = useState("Tümü");
  const [minRating, setMinRating] = useState(0);

  // Modal State'leri
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sendingTg, setSendingTg] = useState(false); 
  
  const [location, setLocation] = useState("Halı Saha");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 16));

  const user = auth.currentUser;
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      axios.get(`/api/players/${user.uid}`)
        .then(res => setPlayers(res.data))
        .catch(err => console.error(err));
    }
  }, [user]);

  // --- FİLTRELEME MANTIĞI ---
  const filteredPlayers = players.filter(player => {
    const matchesName = player.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPosition = filterPosition === "Tümü" || player.position === filterPosition;
    const matchesRating = parseInt(player.rating) >= minRating;
    return matchesName && matchesPosition && matchesRating;
  });

  // --- TEKİL SEÇİM ---
  const togglePlayer = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(pid => pid !== id));
    } else {
      const playerToSelect = players.find(p => p.id === id);
      if (playerToSelect.position === "Kaleci") {
        const gkCount = selectedIds.filter(sid => players.find(pl => pl.id === sid)?.position === "Kaleci").length;
        if (gkCount >= 2) return alert("✋ En fazla 2 kaleci olabilir!");
      }
      setSelectedIds([...selectedIds, id]);
    }
  };

  // --- GLOBAL: TÜM KADROYU SEÇ (GERİ GELDİ! 🔙) ---
  const handleSelectAllGlobal = () => {
    if (selectedIds.length === players.length) {
      setSelectedIds([]); // Herkes seçiliyse temizle
    } else {
      // Kaleci kuralını bypass edip herkesi seçiyoruz (veya istersen burada da kural koyabiliriz)
      setSelectedIds(players.map(p => p.id));
    }
  };

  // --- FİLTRE: SADECE GÖRÜNENLERİ SEÇ ---
  const handleSelectFiltered = () => {
    const visibleIds = filteredPlayers.map(p => p.id);
    const allVisibleSelected = visibleIds.every(id => selectedIds.includes(id));

    if (allVisibleSelected) {
      setSelectedIds(selectedIds.filter(id => !visibleIds.includes(id)));
    } else {
      const newIds = [...new Set([...selectedIds, ...visibleIds])];
      setSelectedIds(newIds);
    }
  };

  // --- MAÇ KURMA ---
  const handleGenerate = async () => {
    if (selectedIds.length < 2) return alert("En az 2 kişi seçmelisin!");
    const selectedPlayers = players.filter(p => selectedIds.includes(p.id));

    try {
      setLoading(true);
      const payload = {
        players: selectedPlayers,
        previousTeams: result ? { teamA: result.teamA, teamB: result.teamB } : null
      };
      const response = await axios.post('/api/generate-teams', payload);
      setResult(response.data);
    } catch {
      alert("Hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  // --- KAYDETME ---
  const handleSavePlan = async () => {
    try {
      setSaving(true);
      const matchPayload = {
        uid: user.uid,
        teamA: result.teamA,
        teamB: result.teamB,
        stats: result.stats,
        prediction: result.prediction,
        location, 
        date      
      };

      await axios.post('/api/matches', matchPayload);
      alert("Maç Planlandı! Geçmiş sayfasından sonucu girebilirsin. 📅");
      navigate('/match-history');
    } catch (error) {
      console.error(error);
      alert("Kaydedilemedi.");
    } finally {
      setSaving(false);
      setShowModal(false);
    }
  };

  // --- TELEGRAM ---
  const handleSendTelegram = async () => {
    if(!result) return;
    try {
      setSendingTg(true);
      await axios.post('/api/send-telegram', {
        uid: user.uid, 
        teamA: result.teamA,
        teamB: result.teamB,
        date: date,
        location: location,
        prediction: result.prediction
      });
      alert("Mesaj Telegram Grubuna Gönderildi! ✈️");
    } catch (error) {
      const msg = error.response?.data?.error || "Telegrama gönderilemedi.";
      alert(msg);
    } finally {
      setSendingTg(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 md:p-8 relative">
      
      {/* --- MAÇ PLANLAMA PENCERESİ (MODAL) --- */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-600 w-full max-w-md shadow-2xl">
            <h2 className="text-xl font-bold text-center mb-2 text-green-400">Maçı Planla</h2>
            <div className="space-y-4">
              <div><label className="text-gray-400 text-sm">Tarih</label><input type="datetime-local" value={date} onChange={e => setDate(e.target.value)} className="w-full bg-gray-700 p-2 rounded text-white" /></div>
              <div><label className="text-gray-400 text-sm">Konum</label><input type="text" value={location} onChange={e => setLocation(e.target.value)} className="w-full bg-gray-700 p-2 rounded text-white" /></div>
              <div className="flex flex-col gap-3 mt-6">
                <button onClick={handleSendTelegram} disabled={sendingTg} className="w-full bg-sky-500 hover:bg-sky-400 py-2 rounded font-bold flex justify-center gap-2">{sendingTg ? 'GÖNDERİLİYOR...' : 'TELEGRAMA AT'}</button>
                <div className="flex gap-3">
                    <button onClick={() => setShowModal(false)} className="flex-1 bg-gray-600 py-3 rounded hover:bg-gray-500">İptal</button>
                    <button onClick={handleSavePlan} disabled={saving} className="flex-1 bg-green-600 py-3 rounded font-bold hover:bg-green-500">{saving ? '...' : 'KAYDET'}</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- SAYFA BAŞLIĞI --- */}
      <div className="flex flex-col md:flex-row justify-between items-center max-w-6xl mx-auto mb-6 gap-4">
        <button onClick={() => navigate('/')} className="text-gray-400 hover:text-white self-start md:self-auto transition">← Dashboard</button>
        <h1 className="text-2xl font-bold text-green-400">Maç Kadrosunu Kur</h1>
        
        {/* GLOBAL SEÇİM BUTONLARI VE SAYAÇ */}
        <div className="flex items-center gap-3">
          
          {/* --- GERİ GELEN BUTON BURADA! --- */}
          <button 
            onClick={handleSelectAllGlobal} 
            className="text-xs font-bold bg-gray-700 hover:bg-gray-600 px-3 py-2 rounded border border-gray-600 transition text-white"
          >
            {selectedIds.length === players.length ? 'TEMİZLE' : 'TÜMÜNÜ SEÇ'}
          </button>

          <div className="bg-gray-800 px-4 py-2 rounded border border-gray-600 shadow flex items-center gap-2">
            <span className="text-gray-400 text-sm">Seçilen:</span>
            <span className="font-bold text-blue-400 text-xl">{selectedIds.length}</span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* --- SOL LİSTE: OYUNCU SEÇİMİ --- */}
        <div className="lg:col-span-5 bg-gray-800 p-4 rounded-lg border border-gray-700 h-[600px] flex flex-col">
          
          {/* FİLTRE PANELİ */}
          <div className="bg-gray-700/50 p-3 rounded-lg border border-gray-600 mb-4 grid grid-cols-2 gap-2">
            <div className="col-span-2">
               <input type="text" placeholder="🔍 İsim ara..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full p-2 text-sm rounded bg-gray-800 border border-gray-600 text-white" />
            </div>
            <select value={filterPosition} onChange={(e) => setFilterPosition(e.target.value)} className="w-full p-2 text-sm rounded bg-gray-800 border border-gray-600 text-white cursor-pointer">
              <option value="Tümü">Tüm Mevkiler</option><option value="Kaleci">Kaleci</option><option value="Defans">Defans</option><option value="Ortasaha">Ortasaha</option><option value="Forvet">Forvet</option>
            </select>
            <div className="flex items-center gap-2 bg-gray-800 px-2 rounded border border-gray-600">
              <span className="text-xs text-gray-400 whitespace-nowrap">Min: {minRating}</span>
              <input type="range" min="0" max="99" value={minRating} onChange={(e) => setMinRating(Number(e.target.value))} className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-green-500" />
            </div>

            {/* FİLTRE İÇİ SEÇİM BUTONU */}
            <button onClick={handleSelectFiltered} className="col-span-2 bg-gray-600 hover:bg-gray-500 text-xs py-2 rounded transition border border-gray-500 text-gray-200 mt-1">
              {filteredPlayers.length > 0 && filteredPlayers.every(p => selectedIds.includes(p.id)) ? 'Filtreyi Kaldır' : `Filtrelenenleri Seç (${filteredPlayers.length})`}
            </button>
          </div>

          {/* OYUNCU LİSTESİ */}
          <div className="space-y-2 overflow-y-auto pr-1 custom-scrollbar flex-1">
            {filteredPlayers.length === 0 ? <div className="text-center py-10 text-gray-500">Oyuncu bulunamadı.</div> : filteredPlayers.map(player => (
              <div key={player.id} onClick={() => togglePlayer(player.id)} className={`flex justify-between items-center p-3 rounded cursor-pointer transition border select-none ${selectedIds.includes(player.id) ? 'bg-blue-900/40 border-blue-500 shadow-[inset_0_0_10px_rgba(59,130,246,0.2)]' : 'bg-gray-700 border-transparent hover:bg-gray-600'}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded border flex items-center justify-center transition ${selectedIds.includes(player.id) ? 'bg-blue-500 border-blue-500' : 'border-gray-500'}`}>{selectedIds.includes(player.id) && <span className="text-xs text-white">✓</span>}</div>
                  <div><p className={`font-semibold text-sm ${selectedIds.includes(player.id) ? 'text-blue-300' : 'text-white'}`}>{player.name}</p><p className="text-[10px] text-gray-400 uppercase tracking-wider">{player.position}</p></div>
                </div>
                <div className={`font-bold text-xs px-2 py-1 rounded shadow-sm ${player.rating >= 85 ? 'bg-yellow-600' : player.rating >= 70 ? 'bg-green-600' : 'bg-gray-600'}`}>{player.rating}</div>
              </div>
            ))}
          </div>
        </div>

        {/* --- ORTA BUTONLAR --- */}
        <div className="lg:col-span-1 flex items-center justify-center py-4 lg:py-0 flex-row lg:flex-col gap-4">
          <button onClick={handleGenerate} disabled={loading} className="bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-6 lg:py-4 lg:px-2 rounded-lg shadow-lg hover:shadow-green-500/50 transition transform hover:scale-105 flex lg:flex-col items-center gap-2 w-full lg:w-auto justify-center">
            {loading ? <span className="animate-spin text-xl">⌛</span> : <span className="text-xl">⚽</span>}
            <span className="lg:[writing-mode:vertical-rl] text-sm font-bold tracking-widest">{loading ? '...' : (result ? 'TEKRAR' : 'KUR')}</span>
          </button>
          
          {result && (
            <button onClick={() => setShowModal(true)} disabled={saving} className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-6 lg:py-4 lg:px-2 rounded-lg shadow-lg hover:shadow-blue-500/50 transition transform hover:scale-105 flex lg:flex-col items-center gap-2 w-full lg:w-auto justify-center">
              <span className="text-xl">💾</span>
              <span className="lg:[writing-mode:vertical-rl] text-sm font-bold tracking-widest">KAYDET</span>
            </button>
          )}
        </div>

        {/* --- SAĞ SONUÇ --- */}
        <div className="lg:col-span-6 bg-gray-800 p-6 rounded-lg border border-gray-700 min-h-[500px]">
          {!result ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-500 opacity-50 space-y-4"><span className="text-6xl animate-pulse">⚙️</span><p>Soldan oyuncuları seçip kur butonuna bas.</p></div>
          ) : (
            <div className="animate-fade-in h-full flex flex-col">
              <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 p-4 rounded-lg mb-6 text-center border border-yellow-600/50 shadow-lg relative overflow-hidden shrink-0">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-yellow-500 to-transparent opacity-50"></div>
                <p className="text-gray-400 text-xs tracking-widest uppercase mb-1">Yapay Zeka Tahmini</p>
                <h2 className="text-xl md:text-2xl font-bold text-yellow-400 drop-shadow-md">{result.prediction}</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 flex-1">
                <div className="bg-red-900/10 p-4 rounded-lg border border-red-900/50 flex flex-col">
                  <h3 className="font-bold text-red-400 text-center mb-4 border-b border-red-900/50 pb-2 flex justify-between px-2 items-center"><span>A TAKIMI</span><span className="bg-red-900/50 px-2 py-1 rounded text-xs border border-red-800">⚡ {result.stats.powerA}</span></h3>
                  <ul className="space-y-2 overflow-y-auto max-h-[400px] pr-1 custom-scrollbar">
                    {result.teamA.map(p => (<li key={p.id} className="text-sm flex justify-between p-2 rounded bg-red-900/20 items-center border border-red-900/10"><div className="flex flex-col"><span className="font-medium text-gray-200">{p.name}</span><span className="text-[10px] text-red-300 uppercase">{p.position}</span></div><span className="text-gray-400 text-xs bg-gray-900 px-2 py-1 rounded border border-gray-700">{p.rating}</span></li>))}
                  </ul>
                </div>
                <div className="bg-blue-900/10 p-4 rounded-lg border border-blue-900/50 flex flex-col">
                  <h3 className="font-bold text-blue-400 text-center mb-4 border-b border-blue-900/50 pb-2 flex justify-between px-2 items-center"><span>B TAKIMI</span><span className="bg-blue-900/50 px-2 py-1 rounded text-xs border border-blue-800">⚡ {result.stats.powerB}</span></h3>
                  <ul className="space-y-2 overflow-y-auto max-h-[400px] pr-1 custom-scrollbar">
                    {result.teamB.map(p => (<li key={p.id} className="text-sm flex justify-between p-2 rounded bg-blue-900/20 items-center border border-blue-900/10"><div className="flex flex-col"><span className="font-medium text-gray-200">{p.name}</span><span className="text-[10px] text-blue-300 uppercase">{p.position}</span></div><span className="text-gray-400 text-xs bg-gray-900 px-2 py-1 rounded border border-gray-700">{p.rating}</span></li>))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateMatch;