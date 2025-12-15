import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { auth } from '../firebase';
import { useNavigate } from 'react-router-dom';

const Players = () => {
  const [players, setPlayers] = useState([]);
  // Form Verileri
  const [name, setName] = useState("");
  const [position, setPosition] = useState("Forvet");
  const [rating, setRating] = useState(80);

  // --- YENİ EKLENEN STATE'LER (Filtreleme İçin) ---
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPosition, setFilterPosition] = useState("Tümü");
  const [minRating, setMinRating] = useState(0);
  
  // Düzenleme Modu için State
  const [editingId, setEditingId] = useState(null); 
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const user = auth.currentUser;

  // --- VERİ ÇEKME ---
  const fetchPlayers = useCallback(async () => {
    if (!user) return;
    try {
      const response = await axios.get(`/api/players/${user.uid}`);
      setPlayers(response.data);
    } catch (error) {
      console.error("Hata:", error);
    }
  }, [user]);

  useEffect(() => {
    fetchPlayers();
  }, [fetchPlayers]);

  // --- FİLTRELEME MANTIĞI (YENİ) ---
  // Ham 'players' listesini değil, bu 'filteredPlayers' listesini ekrana basacağız.
  const filteredPlayers = players.filter(player => {
    // 1. İsim Araması
    const matchesName = player.name.toLowerCase().includes(searchTerm.toLowerCase());
    // 2. Mevki Filtresi
    const matchesPosition = filterPosition === "Tümü" || player.position === filterPosition;
    // 3. Güç Filtresi
    const matchesRating = parseInt(player.rating) >= minRating;

    return matchesName && matchesPosition && matchesRating;
  });

  // --- EKLEME VE GÜNCELLEME İŞLEMİ ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name) return alert("İsim giriniz!");

    const playerData = { 
      uid: user.uid, 
      name, 
      position, 
      rating: parseInt(rating) 
    };

    try {
      setLoading(true);

      if (editingId) {
        await axios.put(`/api/players/${editingId}`, playerData);
        alert("Oyuncu Güncellendi! ✅");
        setEditingId(null); 
      } else {
        await axios.post(`/api/players/${user.uid}`, playerData);
      }

      setName("");
      setRating(80);
      setPosition("Forvet");
      fetchPlayers();

    } catch (error) {
      console.error(error);
      alert("İşlem başarısız oldu.");
    } finally {
      setLoading(false);
    }
  };

  // --- SİLME İŞLEMİ ---
  const handleDelete = async (id) => {
    if (!window.confirm("Bu oyuncuyu silmek istediğine emin misin?")) return;

    try {
      await axios.delete(`/api/players/${id}?uid=${user.uid}`);
      fetchPlayers(); 
    } catch (error) {
      console.error(error);
      alert("Silinemedi.");
    }
  };

  const startEdit = (player) => {
    setName(player.name);
    setPosition(player.position);
    setRating(player.rating);
    setEditingId(player.id);
  };

  const handleCancel = () => {
    setEditingId(null);
    setName("");
    setRating(80);
    setPosition("Forvet");
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <button onClick={() => navigate('/')} className="mb-6 text-gray-400 hover:text-white transition">← Dashboarda Dön</button>
      
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* --- SOL: FORM (1 Birim Genişlik) --- */}
        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 h-fit sticky top-4 lg:col-span-1">
          <h2 className={`text-2xl font-bold mb-4 ${editingId ? 'text-yellow-400' : 'text-blue-400'}`}>
            {editingId ? 'Oyuncuyu Düzenle' : 'Yeni Oyuncu Ekle'}
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Ad Soyad</label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-2 rounded bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-600 focus:border-transparent transition"
                placeholder="Örn: Icardi"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Mevki</label>
                <select 
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  className="w-full p-2 rounded bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-600"
                >
                  <option>Kaleci</option>
                  <option>Defans</option>
                  <option>Ortasaha</option>
                  <option>Forvet</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Güç</label>
                <input 
                  type="number" 
                  value={rating}
                  onChange={(e) => setRating(e.target.value)}
                  min="1" max="100"
                  className="w-full p-2 rounded bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-600"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button 
                type="submit" 
                disabled={loading}
                className={`flex-1 font-bold py-2 rounded transition shadow-lg ${editingId ? 'bg-yellow-600 hover:bg-yellow-500' : 'bg-blue-600 hover:bg-blue-500'}`}
              >
                {loading ? "..." : (editingId ? "Güncelle" : "Ekle")}
              </button>
              
              {editingId && (
                <button 
                  type="button"
                  onClick={handleCancel}
                  className="bg-gray-600 hover:bg-gray-500 px-4 rounded text-white transition"
                >
                  ✕
                </button>
              )}
            </div>
          </form>
        </div>

        {/* --- SAĞ: LİSTE VE FİLTRE (2 Birim Genişlik - Daha Geniş Yaptım) --- */}
        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 lg:col-span-2 flex flex-col h-full">
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
            <h2 className="text-2xl font-bold text-green-400">
              Kadro <span className="text-sm text-gray-400 font-normal">({filteredPlayers.length} / {players.length})</span>
            </h2>
          </div>

          {/* --- YENİ EKLENEN FİLTRE PANELİ --- */}
          <div className="bg-gray-700/50 p-4 rounded-lg border border-gray-600 mb-4 grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* 1. Arama */}
            <div>
              <input 
                type="text" 
                placeholder="🔍 İsim ara..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full p-2 text-sm rounded bg-gray-800 border border-gray-600 focus:outline-none focus:ring-1 focus:ring-green-500 text-white placeholder-gray-500"
              />
            </div>

            {/* 2. Mevki Filtresi */}
            <div>
              <select 
                value={filterPosition}
                onChange={(e) => setFilterPosition(e.target.value)}
                className="w-full p-2 text-sm rounded bg-gray-800 border border-gray-600 focus:outline-none focus:ring-1 focus:ring-green-500 text-white cursor-pointer"
              >
                <option value="Tümü">Tüm Mevkiler</option>
                <option value="Kaleci">Kaleci</option>
                <option value="Defans">Defans</option>
                <option value="Ortasaha">Ortasaha</option>
                <option value="Forvet">Forvet</option>
              </select>
            </div>

            {/* 3. Güç Slider */}
            <div className="flex items-center gap-2 bg-gray-800 px-2 rounded border border-gray-600">
               <span className="text-xs text-gray-400 whitespace-nowrap min-w-[55px]">Min Güç: <b className="text-white">{minRating}</b></span>
               <input 
                type="range" 
                min="0" max="99" 
                value={minRating}
                onChange={(e) => setMinRating(Number(e.target.value))}
                className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-green-500"
               />
            </div>
          </div>

          {/* --- LİSTE ALANI --- */}
          <div className="space-y-2 overflow-y-auto pr-2 custom-scrollbar flex-1" style={{maxHeight: '600px'}}>
            {filteredPlayers.length === 0 ? (
              <div className="text-center py-10 text-gray-500 border-2 border-dashed border-gray-700 rounded">
                {players.length === 0 ? "Henüz oyuncu eklemediniz." : "Aradığınız kriterlere uygun oyuncu yok."}
              </div>
            ) : (
              filteredPlayers.map((p) => (
                <div key={p.id} className="group flex justify-between items-center bg-gray-700 p-3 rounded hover:bg-gray-650 transition border border-transparent hover:border-gray-500 shadow-sm">
                  
                  {/* Oyuncu Bilgisi */}
                  <div className="flex items-center gap-4">
                     <div className={`w-10 h-10 flex items-center justify-center rounded-full text-sm font-bold shadow-md
                       ${p.rating >= 85 ? 'bg-gradient-to-br from-yellow-500 to-yellow-700' : p.rating >= 70 ? 'bg-gradient-to-br from-green-500 to-green-700' : 'bg-gradient-to-br from-gray-500 to-gray-700'}`}>
                       {p.rating}
                     </div>
                     <div>
                       <p className="font-bold text-lg leading-tight">{p.name}</p>
                       <p className="text-xs text-gray-400 uppercase tracking-wide">{p.position}</p>
                     </div>
                  </div>

                  {/* Butonlar */}
                  <div className="flex gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => startEdit(p)}
                      className="text-yellow-400 hover:text-white bg-gray-800 hover:bg-yellow-600 p-2 rounded transition"
                      title="Düzenle"
                    >
                      ✏️
                    </button>
                    <button 
                      onClick={() => handleDelete(p.id)}
                      className="text-red-400 hover:text-white bg-gray-800 hover:bg-red-600 p-2 rounded transition"
                      title="Sil"
                    >
                      🗑️
                    </button>
                  </div>

                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Players;