import { useState, useEffect } from 'react';
import axios from 'axios';
import { auth } from '../firebase';
import { useNavigate } from 'react-router-dom';

const Settings = () => {
  const [botToken, setBotToken] = useState("");
  const [chatId, setChatId] = useState("");
  const [loading, setLoading] = useState(false);
  
  const user = auth.currentUser;
  const navigate = useNavigate();

  // Sayfa açılınca mevcut ayarları çek
  useEffect(() => {
    if (user) {
      axios.get(`/api/settings/${user.uid}`)
        .then(res => {
          if (res.data.botToken) setBotToken(res.data.botToken);
          if (res.data.chatId) setChatId(res.data.chatId);
        })
        .catch(err => console.error(err));
    }
  }, [user]);

  const handleSave = async () => {
    if (!botToken || !chatId) return alert("Lütfen alanları doldur.");
    
    try {
      setLoading(true);
      await axios.post(`/api/settings/${user.uid}`, {
        telegramBotToken: botToken.trim(), // Boşlukları temizle
        telegramChatId: chatId.trim()
      });
      alert("Ayarlar Kaydedildi! ✅");
    } catch (error) {
      console.error(error);
      alert("Kaydedilemedi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-2xl mx-auto">
        <button onClick={() => navigate('/')} className="text-gray-400 hover:text-white mb-6">← Dashboard</button>
        
        <h1 className="text-3xl font-bold text-blue-400 mb-8">⚙️ Ayarlar</h1>

        <div className="bg-gray-800 p-8 rounded-lg border border-gray-700 shadow-lg">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <span className="text-sky-400">✈️</span> Telegram Bildirim Kurulumu
          </h2>
          
          <p className="text-sm text-gray-400 mb-6">
            Maç bildirimlerinin kendi grubuna gitmesi için Bot bilgilerini buraya girmelisin.
          </p>

          <div className="space-y-6">
            <div>
              <label className="block text-gray-300 text-sm font-bold mb-2">Bot Token (BotFatherdan alınan)</label>
              <input 
                type="text" 
                value={botToken}
                onChange={(e) => setBotToken(e.target.value)}
                placeholder="Örn: 123456:ABC-Def..."
                className="w-full bg-gray-900 border border-gray-600 p-3 rounded text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-gray-300 text-sm font-bold mb-2">Chat ID (Grup IDsi)</label>
              <input 
                type="text" 
                value={chatId}
                onChange={(e) => setChatId(e.target.value)}
                placeholder="Örn: -100123456..."
                className="w-full bg-gray-900 border border-gray-600 p-3 rounded text-white focus:outline-none focus:border-blue-500"
              />
              <p className="text-xs text-gray-500 mt-2">
                * ID genelde eksi (-) işareti ile başlar.
              </p>
            </div>

            <button 
              onClick={handleSave}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 py-3 rounded font-bold text-white transition"
            >
              {loading ? 'Kaydediliyor...' : 'AYARLARI KAYDET'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;