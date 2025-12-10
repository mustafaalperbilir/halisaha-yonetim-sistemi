import { auth } from '../firebase';
import { useNavigate } from 'react-router-dom'; // 1. Yönlendirme aracını çağırdık
import PropTypes from 'prop-types';

const Dashboard = ({ user }) => {
  const navigate = useNavigate(); // 2. Aracımızı kurduk

  const handleLogout = () => {
    auth.signOut();
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Üst Menü */}
      <nav className="bg-gray-800 p-4 border-b border-gray-700 flex justify-between items-center">
        <h1 className="text-xl font-bold text-blue-400">Halı Saha Yönetim</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-300 hidden md:inline">{user?.email}</span>
          
          {/* YENİ: AYARLAR BUTONU */}
          <button 
            onClick={() => navigate('/settings')}
            className="text-gray-400 hover:text-white text-2xl transition"
            title="Ayarlar"
          >
            ⚙️
          </button>

          <button 
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded text-sm transition"
          >
            Çıkış
          </button>
        </div>
      </nav>

      {/* Ana İçerik */}
      <div className="p-8 max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold mb-6">Hoşgeldin, Kaptan! 👋</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* KART 1: OYUNCULAR (Tıklanabilir Alan) */}
          <div 
            onClick={() => navigate('/players')} // 3. Tıklayınca /players sayfasına git
            className="bg-gray-800 p-6 rounded-lg border border-gray-700 hover:border-blue-500 transition cursor-pointer hover:shadow-lg group"
          >
            <h3 className="text-xl font-bold mb-2 group-hover:text-blue-400">🏃‍♂️ Oyuncular</h3>
            <p className="text-gray-400 text-sm">Takımındaki oyuncuları ekle, düzenle veya güçlerini güncelle.</p>
            <button className="mt-4 text-blue-400 text-sm hover:underline">Listeye Git →</button>
          </div>

          {/* KART 2: MAÇ OLUŞTUR (Tıklanabilir Alan) */}
          <div 
            onClick={() => navigate('/create-match')} // 4. Tıklayınca /create-match sayfasına git
            className="bg-gray-800 p-6 rounded-lg border border-gray-700 hover:border-green-500 transition cursor-pointer hover:shadow-lg group"
          >
            <h3 className="text-xl font-bold mb-2 group-hover:text-green-400">⚽ Maç Oluştur</h3>
            <p className="text-gray-400 text-sm">14 kişiyi seç, yapay zeka takımları dengelesin.</p>
            <button className="mt-4 text-green-400 text-sm hover:underline">Maç Kur →</button>
          </div>

          {/* KART 3: GEÇMİŞ (AKTİF EDİLDİ) */}
          <div 
            onClick={() => navigate('/match-history')} // Tıklanınca git
            className="bg-gray-800 p-6 rounded-lg border border-gray-700 hover:border-purple-500 transition cursor-pointer hover:shadow-lg group"
          >
            <h3 className="text-xl font-bold mb-2 group-hover:text-purple-400">📜 Maç Geçmişi</h3>
            <p className="text-gray-400 text-sm">Eski maçların skorlarını ve kadrolarını gör.</p>
            <button className="mt-4 text-purple-400 text-sm hover:underline">Geçmişe Bak →</button>
          </div>

        </div>
      </div>
    </div>
  );
};

Dashboard.propTypes = {
  user: PropTypes.object
};

export default Dashboard;