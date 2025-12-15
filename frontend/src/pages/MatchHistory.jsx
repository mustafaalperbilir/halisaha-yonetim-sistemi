import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { auth } from '../firebase';
import { useNavigate } from 'react-router-dom';

const MatchHistory = () => {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [editingMatch, setEditingMatch] = useState(null);
  const [viewMatch, setViewMatch] = useState(null);
  
  // Telegram yükleniyor mu?
  const [sendingTg, setSendingTg] = useState(false); 

  const [editForm, setEditForm] = useState({ scoreA: 0, scoreB: 0, location: "", mvp: "", date: "" });
  
  const user = auth.currentUser;
  const navigate = useNavigate();

  const fetchHistory = useCallback(async () => {
    if (!user) return;
    try {
      const response = await axios.get(`/api/matches/${user.uid}`);
      setMatches(response.data);
    } catch (error) {
      console.error("Geçmiş çekilemedi:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleDelete = async (e, matchId) => {
    e.stopPropagation();
    if (!window.confirm("Silmek istediğine emin misin?")) return;
    try {
      await axios.delete(`/api/matches/${matchId}?uid=${user.uid}`);
      fetchHistory();
    } catch  {
      alert("Silinemedi.");
    }
  };

  const startEdit = (e, match) => {
    e.stopPropagation();
    setEditingMatch(match);
    setEditForm({
      scoreA: match.scoreA || 0,
      scoreB: match.scoreB || 0,
      location: match.location || "",
      mvp: match.mvp || "",
      date: match.date
    });
  };

  const saveEdit = async () => {
    try {
      await axios.put(`/api/matches/${editingMatch.id}`, {
        uid: user.uid,
        ...editForm,
        status: 'completed'
      });
      alert("Kaydedildi! ✅");
      setEditingMatch(null);
      fetchHistory();
    } catch  {
      alert("Güncellenemedi.");
    }
  };

  // --- YENİ: MAÇ SONUCUNU TELEGRAM'A AT ---
  const handleSendReport = async () => {
    try {
      setSendingTg(true);
      await axios.post('/api/send-telegram', {
        uid: user.uid,
        // Takım bilgileri mevcut maçtan geliyor
        teamA: editingMatch.teamA,
        teamB: editingMatch.teamB,
        prediction: editingMatch.prediction,
        // Güncel bilgiler formdan geliyor
        date: editForm.date,
        location: editForm.location,
        scoreA: editForm.scoreA,
        scoreB: editForm.scoreB,
        mvp: editForm.mvp
      });
      alert("Maç Raporu Telegram'a Gönderildi! 🏁");
    } catch (error) {
      const msg = error.response?.data?.error || "Gönderilemedi.";
      alert(msg);
    } finally {
      setSendingTg(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString('tr-TR', options);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8 relative">
      
      {/* --- DETAY PENCERESİ --- */}
      {viewMatch && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4 animate-fade-in backdrop-blur-sm" onClick={() => setViewMatch(null)}>
          <div className="bg-gray-800 rounded-xl border border-gray-600 w-full max-w-4xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="bg-gray-900 p-6 text-center border-b border-gray-700 relative">
              <button onClick={() => setViewMatch(null)} className="absolute top-4 right-4 text-gray-400 hover:text-white text-2xl font-bold">&times;</button>
              <h2 className="text-gray-400 text-sm mb-2 uppercase tracking-widest">{formatDate(viewMatch.date)}</h2>
              <p className="text-blue-300 text-sm mb-4">📍 {viewMatch.location || "Konum Belirtilmedi"}</p>
              <div className="flex justify-center items-center gap-8">
                <div className="text-4xl md:text-6xl font-bold text-red-500">{viewMatch.scoreA ?? "?"}</div>
                <div className="text-xl text-gray-600 font-mono">VS</div>
                <div className="text-4xl md:text-6xl font-bold text-blue-500">{viewMatch.scoreB ?? "?"}</div>
              </div>
               {viewMatch.mvp && (
                <div className="mt-4 inline-block bg-yellow-500/10 border border-yellow-500/40 text-yellow-400 px-4 py-1 rounded-full font-bold shadow-[0_0_15px_rgba(234,179,8,0.2)]">
                   🌟 Maçın Yıldızı: {viewMatch.mvp}
                </div>
              )}
            </div>
            {/* İçerik */}
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="bg-gray-700/30 border border-purple-500/30 p-4 rounded-lg mb-6 text-center">
                <p className="text-xs text-purple-300 uppercase mb-1">🤖 Yapay Zeka Ne Demişti?</p>
                <p className="text-gray-200 italic">{viewMatch.prediction}</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-red-900/10 rounded-lg p-4 border border-red-900/30">
                  <h3 className="text-red-400 font-bold border-b border-red-900/50 pb-2 mb-2 flex justify-between">
                    A TAKIMI <span className="bg-red-900 px-2 rounded text-xs text-white flex items-center">{viewMatch.stats?.powerA} Güç</span>
                  </h3>
                  <ul className="space-y-2">
                    {viewMatch.teamA.map((p, i) => (
                      <li key={i} className="flex justify-between items-center text-sm p-2 rounded bg-gray-800/50">
                        <span className={p.name === viewMatch.mvp ? "text-yellow-400 font-bold" : "text-gray-200"}>{p.name} {p.name === viewMatch.mvp && "🌟"}</span>
                        <span className="text-xs text-gray-500 bg-gray-900 px-2 py-0.5 rounded">{p.position}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-blue-900/10 rounded-lg p-4 border border-blue-900/30">
                  <h3 className="text-blue-400 font-bold border-b border-blue-900/50 pb-2 mb-2 flex justify-between">
                    B TAKIMI <span className="bg-blue-900 px-2 rounded text-xs text-white flex items-center">{viewMatch.stats?.powerB} Güç</span>
                  </h3>
                  <ul className="space-y-2">
                    {viewMatch.teamB.map((p, i) => (
                      <li key={i} className="flex justify-between items-center text-sm p-2 rounded bg-gray-800/50">
                        <span className={p.name === viewMatch.mvp ? "text-yellow-400 font-bold" : "text-gray-200"}>{p.name} {p.name === viewMatch.mvp && "🌟"}</span>
                        <span className="text-xs text-gray-500 bg-gray-900 px-2 py-0.5 rounded">{p.position}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- DÜZENLEME & SONUÇ GİRME PENCERESİ --- */}
      {editingMatch && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 animate-fade-in" onClick={() => setEditingMatch(null)}>
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-600 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4 text-green-400">
              {editingMatch.status === 'pending' ? 'Maç Sonucunu Gir' : 'Maçı Düzenle'}
            </h2>
            
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="w-1/2">
                   <label className="text-xs text-red-400 block mb-1">A Skoru</label>
                   <input type="number" value={editForm.scoreA} onChange={e => setEditForm({...editForm, scoreA: e.target.value})} className="w-full bg-gray-700 p-2 rounded text-white text-center font-bold text-xl"/>
                </div>
                <div className="w-1/2">
                   <label className="text-xs text-blue-400 block mb-1">B Skoru</label>
                   <input type="number" value={editForm.scoreB} onChange={e => setEditForm({...editForm, scoreB: e.target.value})} className="w-full bg-gray-700 p-2 rounded text-white text-center font-bold text-xl"/>
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-400 block mb-1">Konum</label>
                <input type="text" value={editForm.location} onChange={e => setEditForm({...editForm, location: e.target.value})} className="w-full bg-gray-700 p-2 rounded text-white"/>
              </div>

              <div>
                <label className="text-xs text-yellow-400 block mb-1">MVP</label>
                <select value={editForm.mvp} onChange={e => setEditForm({...editForm, mvp: e.target.value})} className="w-full bg-gray-700 p-2 rounded text-white border border-gray-600">
                  <option value="">Seçilmedi</option>
                  <optgroup label="A Takımı">{editingMatch.teamA.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}</optgroup>
                  <optgroup label="B Takımı">{editingMatch.teamB.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}</optgroup>
                </select>
              </div>

              {/* BUTONLAR */}
              <div className="space-y-3 pt-2">
                
                {/* 1. TELEGRAM RAPOR BUTONU (YENİ) */}
                <button 
                  onClick={handleSendReport}
                  disabled={sendingTg}
                  className="w-full bg-sky-600 hover:bg-sky-500 py-2 rounded font-bold text-white transition flex items-center justify-center gap-2"
                >
                  {sendingTg ? 'GÖNDERİLİYOR...' : (
                    <>
                       <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0zm5.56 8.43l-1.89 8.88c-.14.63-.51.78-1.04.49l-2.88-2.13-1.39 1.34c-.15.15-.28.28-.57.28l.2-2.93 5.34-4.83c.23-.21-.05-.32-.36-.11l-6.6 4.15-2.84-.89c-.62-.19-.63-.62.13-.91l11.09-4.27c.51-.19.96.12.81.93z"/></svg>
                       RAPORU TELEGRAMA AT
                    </>
                  )}
                </button>

                <div className="flex gap-2">
                   <button onClick={() => setEditingMatch(null)} className="flex-1 bg-gray-600 py-2 rounded hover:bg-gray-500">İptal</button>
                   <button onClick={saveEdit} className="flex-1 bg-green-600 py-2 rounded hover:bg-green-500 font-bold">
                     {editingMatch.status === 'pending' ? 'KAYDET' : 'GÜNCELLE'}
                   </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* --- ANA LİSTE --- */}
      <div className="max-w-5xl mx-auto mb-6 flex items-center gap-4">
        <button onClick={() => navigate('/')} className="text-gray-400 hover:text-white">← Dashboard</button>
        <h1 className="text-3xl font-bold text-purple-400">📜 Maç Geçmişi</h1>
      </div>

      <div className="max-w-5xl mx-auto space-y-4">
        {loading ? <p className="text-center text-gray-500">Yükleniyor...</p> : matches.length === 0 ? (
          <div className="text-center py-10 bg-gray-800 rounded-lg border border-gray-700">
            <p className="text-gray-400 mb-4">Henüz maç yok.</p>
            <button onClick={() => navigate('/create-match')} className="bg-green-600 px-4 py-2 rounded text-white">Maç Planla</button>
          </div>
        ) : (
          matches.map((match) => (
            <div 
              key={match.id} 
              onClick={() => setViewMatch(match)}
              className={`group relative p-4 rounded-lg border transition cursor-pointer hover:scale-[1.01] hover:shadow-lg flex flex-col md:flex-row items-center justify-between gap-4
                ${match.status === 'pending' ? 'bg-gray-800/60 border-yellow-600/30 hover:border-yellow-500' : 'bg-gray-800 border-gray-700 hover:border-purple-500'}
              `}
            >
              <div className="flex flex-col text-center md:text-left min-w-[150px]">
                <span className="text-gray-300 font-bold">{formatDate(match.date).split(' ')[0]}</span>
                <span className="text-xs text-gray-500">{formatDate(match.date).split(' ')[1]}</span>
                <span className="text-xs text-blue-400 mt-1 truncate max-w-[150px]">{match.location}</span>
              </div>
              <div className="flex items-center gap-6">
                 <div className="text-right">
                    <span className="block text-red-400 font-bold text-lg">A Takımı</span>
                    <span className="text-xs text-gray-500">{match.stats.powerA} Güç</span>
                 </div>
                 <div className={`px-4 py-2 rounded text-2xl font-mono font-bold tracking-widest ${match.status === 'pending' ? 'text-gray-500 bg-gray-900/50' : 'text-white bg-black/40'}`}>
                    {match.status === 'pending' ? '?-?' : `${match.scoreA}-${match.scoreB}`}
                 </div>
                 <div className="text-left">
                    <span className="block text-blue-400 font-bold text-lg">B Takımı</span>
                    <span className="text-xs text-gray-500">{match.stats.powerB} Güç</span>
                 </div>
              </div>
              <div className="flex items-center gap-3">
                 {match.status === 'pending' ? (
                    <span className="bg-yellow-500/20 text-yellow-500 text-xs px-2 py-1 rounded border border-yellow-500/20 animate-pulse">Sonuç Bekliyor</span>
                 ) : (
                    match.mvp && <div className="hidden md:block text-xs text-center"><span className="text-yellow-400 block text-lg">★</span><span className="text-gray-400">{match.mvp}</span></div>
                 )}
                 <div className="flex gap-2 ml-4">
                    <button onClick={(e) => startEdit(e, match)} className="bg-gray-700 hover:bg-blue-600 text-gray-300 hover:text-white p-2 rounded transition z-10">✏️</button>
                    <button onClick={(e) => handleDelete(e, match.id)} className="bg-gray-700 hover:bg-red-600 text-gray-300 hover:text-white p-2 rounded transition z-10">🗑️</button>
                 </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default MatchHistory;