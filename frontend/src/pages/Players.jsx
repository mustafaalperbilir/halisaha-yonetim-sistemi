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
  
  // Düzenleme Modu için State
  const [editingId, setEditingId] = useState(null); // Eğer doluysa güncelleme yapıyoruz demektir
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const user = auth.currentUser;

  // --- VERİ ÇEKME ---
  const fetchPlayers = useCallback(async () => {
    if (!user) return;
    try {
      const response = await axios.get(`http://localhost:5000/api/players/${user.uid}`);
      setPlayers(response.data);
    } catch (error) {
      console.error("Hata:", error);
    }
  }, [user]);

  useEffect(() => {
    fetchPlayers();
  }, [fetchPlayers]);


  // --- EKLEME VE GÜNCELLEME İŞLEMİ ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name) return alert("İsim giriniz!");

    const playerData = { 
      uid: user.uid, // Backend'e kimin işlemi yaptığını gönderiyoruz
      name, 
      position, 
      rating: parseInt(rating) 
    };

    try {
      setLoading(true);

      if (editingId) {
        // --- GÜNCELLEME MODU ---
        await axios.put(`http://localhost:5000/api/players/${editingId}`, playerData);
        alert("Oyuncu Güncellendi! ✅");
        setEditingId(null); // Düzenleme modundan çık
      } else {
        // --- EKLEME MODU ---
        await axios.post(`http://localhost:5000/api/players/${user.uid}`, playerData);
        // alert("Eklendi"); // Her eklemede uyarı vermesin, akıcı olsun
      }

      // Formu Temizle ve Listeyi Yenile
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
      // Backend'e silme isteği atıyoruz (uid'yi query olarak yolluyoruz)
      await axios.delete(`http://localhost:5000/api/players/${id}?uid=${user.uid}`);
      fetchPlayers(); // Listeyi yenile
    } catch (error) {
      console.error(error);
      alert("Silinemedi.");
    }
  };

  // --- DÜZENLEMEYİ BAŞLAT ---
  const startEdit = (player) => {
    setName(player.name);
    setPosition(player.position);
    setRating(player.rating);
    setEditingId(player.id); // Hangi ID'yi düzenlediğimizi hafızaya al
  };

  // --- VAZGEÇ ---
  const handleCancel = () => {
    setEditingId(null);
    setName("");
    setRating(80);
    setPosition("Forvet");
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <button onClick={() => navigate('/')} className="mb-6 text-gray-400 hover:text-white">← Dashboarda Dön</button>
      
      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* SOL: FORM (Hem Ekleme Hem Güncelleme Yapar) */}
        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 h-fit sticky top-4">
          <h2 className={`text-2xl font-bold mb-4 ${editingId ? 'text-yellow-400' : 'text-blue-400'}`}>
            {editingId ? 'Oyuncuyu Düzenle' : 'Yeni Oyuncu Ekle'}
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400">Ad Soyad</label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-2 rounded bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Örn: Icardi"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400">Mevki</label>
                <select 
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  className="w-full p-2 rounded bg-gray-700 focus:outline-none"
                >
                  <option>Kaleci</option>
                  <option>Defans</option>
                  <option>Ortasaha</option>
                  <option>Forvet</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400">Güç</label>
                <input 
                  type="number" 
                  value={rating}
                  onChange={(e) => setRating(e.target.value)}
                  min="1" max="100"
                  className="w-full p-2 rounded bg-gray-700 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button 
                type="submit" 
                disabled={loading}
                className={`flex-1 font-bold py-2 rounded transition ${editingId ? 'bg-yellow-600 hover:bg-yellow-500' : 'bg-blue-600 hover:bg-blue-500'}`}
              >
                {loading ? "İşleniyor..." : (editingId ? "Güncelle" : "Ekle")}
              </button>
              
              {/* Eğer düzenleme modundaysak Vazgeç butonu çıksın */}
              {editingId && (
                <button 
                  type="button"
                  onClick={handleCancel}
                  className="bg-gray-600 hover:bg-gray-500 px-4 rounded text-white"
                >
                  X
                </button>
              )}
            </div>
          </form>
        </div>

        {/* SAĞ: LİSTE */}
        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
          <h2 className="text-2xl font-bold mb-4 text-green-400">Kadro ({players.length})</h2>
          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
            {players.length === 0 ? <p className="text-gray-500">Oyuncu yok.</p> : players.map((p) => (
              <div key={p.id} className="group flex justify-between items-center bg-gray-700 p-3 rounded hover:bg-gray-650 transition border border-transparent hover:border-gray-500">
                
                {/* Oyuncu Bilgisi */}
                <div className="flex items-center gap-3">
                   <div className={`w-8 h-8 flex items-center justify-center rounded-full text-xs font-bold 
                      ${p.rating >= 85 ? 'bg-yellow-600' : p.rating >= 70 ? 'bg-green-600' : 'bg-gray-500'}`}>
                      {p.rating}
                   </div>
                   <div>
                      <p className="font-bold">{p.name}</p>
                      <p className="text-xs text-gray-400">{p.position}</p>
                   </div>
                </div>

                {/* Butonlar (Düzenle / Sil) */}
                <div className="flex gap-2">
                  <button 
                    onClick={() => startEdit(p)}
                    className="text-yellow-400 hover:text-yellow-300 text-sm px-2 py-1 rounded border border-yellow-400/30 hover:bg-yellow-400/10"
                  >
                    ✏️
                  </button>
                  <button 
                    onClick={() => handleDelete(p.id)}
                    className="text-red-400 hover:text-red-300 text-sm px-2 py-1 rounded border border-red-400/30 hover:bg-red-400/10"
                  >
                    🗑️
                  </button>
                </div>

              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Players;