import { useState, useEffect } from 'react';
import axios from 'axios';
import { auth } from '../firebase';
import { useNavigate } from 'react-router-dom';

const CreateMatch = () => {
  const [players, setPlayers] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Modal State'leri
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sendingTg, setSendingTg] = useState(false); // Telegram yükleniyor mu?
  
  const [location, setLocation] = useState("Halı Saha");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 16));

  const user = auth.currentUser;
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      axios.get(`http://localhost:5000/api/players/${user.uid}`)
        .then(res => setPlayers(res.data))
        .catch(err => console.error(err));
    }
  }, [user]);

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

  const handleSelectAll = () => {
    if (selectedIds.length === players.length) setSelectedIds([]);
    else setSelectedIds(players.map(p => p.id));
  };

  const handleGenerate = async () => {
    if (selectedIds.length < 2) return alert("En az 2 kişi seçmelisin!");
    const selectedPlayers = players.filter(p => selectedIds.includes(p.id));

    try {
      setLoading(true);
      const payload = {
        players: selectedPlayers,
        previousTeams: result ? { teamA: result.teamA, teamB: result.teamB } : null
      };
      const response = await axios.post('http://localhost:5000/api/generate-teams', payload);
      setResult(response.data);
    } catch {
      alert("Hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

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

      await axios.post('http://localhost:5000/api/matches', matchPayload);
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

  // --- YENİ: TELEGRAM'A GÖNDERME FONKSİYONU ---
const handleSendTelegram = async () => {
    if(!result) return;
    try {
      setSendingTg(true);
      await axios.post('http://localhost:5000/api/send-telegram', {
        uid: user.uid, // ARTIK KİM OLDUĞUMUZU SÖYLÜYORUZ!
        teamA: result.teamA,
        teamB: result.teamB,
        date: date,
        location: location,
        prediction: result.prediction
      });
      alert("Mesaj Telegram Grubuna Gönderildi! ✈️");
    } catch (error) {
      // Hata mesajını backend'den alıp gösterelim
      const msg = error.response?.data?.error || "Telegrama gönderilemedi.";
      alert(msg);
    } finally {
      setSendingTg(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8 relative">
      
      {/* --- MAÇ PLANLAMA PENCERESİ (MODAL) --- */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-600 w-full max-w-md shadow-2xl">
            <h2 className="text-xl font-bold text-center mb-2 text-green-400">Maçı Planla</h2>
            <p className="text-gray-400 text-sm text-center mb-6">Detayları gir ve istersen gruba haber ver.</p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-gray-400 text-sm mb-1">Tarih ve Saat</label>
                <input type="datetime-local" value={date} onChange={e => setDate(e.target.value)} className="w-full bg-gray-700 p-2 rounded text-white focus:outline-none" />
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-1">Konum</label>
                <input type="text" value={location} onChange={e => setLocation(e.target.value)} className="w-full bg-gray-700 p-2 rounded text-white focus:outline-none" />
              </div>

              {/* BUTON GRUBU */}
              <div className="flex flex-col gap-3 mt-6">
                
                {/* 1. TELEGRAM BUTONU (YENİ) */}
                <button 
                  onClick={handleSendTelegram} 
                  disabled={sendingTg} 
                  className="w-full bg-sky-500 hover:bg-sky-400 py-2 rounded font-bold transition flex items-center justify-center gap-2"
                >
                  {sendingTg ? 'GÖNDERİLİYOR...' : (
                    <>
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0zm5.56 8.43l-1.89 8.88c-.14.63-.51.78-1.04.49l-2.88-2.13-1.39 1.34c-.15.15-.28.28-.57.28l.2-2.93 5.34-4.83c.23-.21-.05-.32-.36-.11l-6.6 4.15-2.84-.89c-.62-.19-.63-.62.13-.91l11.09-4.27c.51-.19.96.12.81.93z"/></svg>
                      TELEGRAMA AT
                    </>
                  )}
                </button>

                <div className="flex gap-3">
                    <button onClick={() => setShowModal(false)} className="flex-1 bg-gray-600 py-3 rounded hover:bg-gray-500 transition">İptal</button>
                    <button onClick={handleSavePlan} disabled={saving} className="flex-1 bg-green-600 py-3 rounded font-bold hover:bg-green-500 transition">
                    {saving ? 'KAYDEDİLİYOR...' : 'KAYDET'}
                    </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* --- SAYFA İÇERİĞİ --- */}
      <div className="flex flex-col md:flex-row justify-between items-center max-w-6xl mx-auto mb-6 gap-4">
        <button onClick={() => navigate('/')} className="text-gray-400 hover:text-white self-start md:self-auto">← Dashboard</button>
        <h1 className="text-2xl font-bold text-green-400">Maç Kadrosunu Kur</h1>
        <div className="flex items-center gap-3">
          <button onClick={handleSelectAll} className="text-xs bg-gray-700 hover:bg-gray-600 px-3 py-2 rounded border border-gray-600 transition">
            {selectedIds.length === players.length ? 'Temizle' : 'Tümünü Seç'}
          </button>
          <div className="bg-gray-800 px-4 py-2 rounded border border-gray-600">
            Seçilen: <span className="font-bold text-blue-400">{selectedIds.length}</span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* SOL LİSTE */}
        <div className="md:col-span-4 bg-gray-800 p-4 rounded-lg border border-gray-700 h-[500px] overflow-y-auto">
          <div className="space-y-2">
            {players.map(player => (
              <div key={player.id} onClick={() => togglePlayer(player.id)} className={`flex justify-between items-center p-3 rounded cursor-pointer transition border select-none ${selectedIds.includes(player.id) ? 'bg-blue-900/50 border-blue-500' : 'bg-gray-700 border-transparent hover:bg-gray-600'}`}>
                <div><p className="font-semibold">{player.name}</p><p className="text-xs text-gray-400">{player.position}</p></div>
                <div className={`font-bold text-sm px-2 py-1 rounded ${player.rating >= 85 ? 'bg-yellow-600' : player.rating >= 70 ? 'bg-green-600' : 'bg-gray-900'}`}>{player.rating}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ORTA BUTONLAR */}
        <div className="md:col-span-1 flex items-center justify-center py-4 md:py-0 flex-col gap-4">
          <button onClick={handleGenerate} disabled={loading} className="bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-6 md:py-4 md:px-2 rounded-lg shadow-lg hover:shadow-green-500/50 transition transform hover:scale-105 flex md:flex-col items-center gap-2">
            {loading ? <span className="animate-spin">⌛</span> : <span>⚽</span>}
            <span className="md:[writing-mode:vertical-rl] text-xs md:text-base">{loading ? '...' : (result ? 'TEKRAR' : 'KUR')}</span>
          </button>
          {result && (
            <button onClick={() => setShowModal(true)} disabled={saving} className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-6 md:py-4 md:px-2 rounded-lg shadow-lg hover:shadow-blue-500/50 transition transform hover:scale-105 flex md:flex-col items-center gap-2">
              <span>💾</span>
              <span className="md:[writing-mode:vertical-rl] text-xs md:text-base">KAYDET</span>
            </button>
          )}
        </div>

        {/* SAĞ SONUÇ */}
        <div className="md:col-span-7 bg-gray-800 p-6 rounded-lg border border-gray-700 min-h-[500px]">
          {!result ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-500 opacity-50"><span className="text-6xl mb-4">⚙️</span><p>Kadro seçimi...</p></div>
          ) : (
            <div className="animate-fade-in">
              <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 p-4 rounded-lg mb-6 text-center border border-yellow-600/50 shadow-lg relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-yellow-500 to-transparent opacity-50"></div>
                <p className="text-gray-400 text-xs tracking-widest uppercase mb-1">Analiz</p>
                <h2 className="text-xl md:text-2xl font-bold text-yellow-400 drop-shadow-md">{result.prediction}</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="bg-red-900/10 p-4 rounded-lg border border-red-900/50">
                  <h3 className="font-bold text-red-400 text-center mb-4 border-b border-red-900/50 pb-2 flex justify-between px-2"><span>A TAKIMI</span><span className="bg-red-900/50 px-2 rounded text-xs flex items-center">{result.stats.powerA} Güç</span></h3>
                  <ul className="space-y-2">{result.teamA.map(p => (<li key={p.id} className="text-sm flex justify-between p-2 rounded bg-red-900/20 items-center"><div className="flex flex-col"><span className="font-medium">{p.name}</span><span className="text-[10px] text-red-300 uppercase tracking-wide">{p.position}</span></div><span className="text-gray-400 text-xs bg-gray-800 px-2 py-1 rounded">{p.rating}</span></li>))}</ul>
                </div>
                <div className="bg-blue-900/10 p-4 rounded-lg border border-blue-900/50">
                  <h3 className="font-bold text-blue-400 text-center mb-4 border-b border-blue-900/50 pb-2 flex justify-between px-2"><span>B TAKIMI</span><span className="bg-blue-900/50 px-2 rounded text-xs flex items-center">{result.stats.powerB} Güç</span></h3>
                  <ul className="space-y-2">{result.teamB.map(p => (<li key={p.id} className="text-sm flex justify-between p-2 rounded bg-blue-900/20 items-center"><div className="flex flex-col"><span className="font-medium">{p.name}</span><span className="text-[10px] text-blue-300 uppercase tracking-wide">{p.position}</span></div><span className="text-gray-400 text-xs bg-gray-800 px-2 py-1 rounded">{p.rating}</span></li>))}</ul>
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