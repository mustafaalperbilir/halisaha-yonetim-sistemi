import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'; // YENİ: Yönlendirme kütüphanesi
import { auth } from './firebase'; 
import MatchHistory from './pages/MatchHistory';
import Settings from './pages/Settings';

// Sayfalarımızı çağırıyoruz
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Players from './pages/Players';      // Oyuncular Sayfası
import CreateMatch from './pages/CreateMatch'; // Maç Oluşturma Sayfası

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">Yükleniyor...</div>;
  }

  return (
    // Router: Uygulamanın trafik polisi gibi davranır, sayfaları yönetir.
    <Router>
      <Routes>
        {/* 1. Ana Sayfa: Kullanıcı varsa Dashboard, yoksa Login açılır */}
        <Route path="/" element={user ? <Dashboard user={user} /> : <Login />} />
        
        {/* 2. Oyuncular Sayfası: Sadece kullanıcı giriş yapmışsa açılır */}
        <Route path="/players" element={user ? <Players /> : <Navigate to="/" />} />

        {/* 3. Maç Oluşturma Sayfası: Sadece kullanıcı giriş yapmışsa açılır */}
        <Route path="/create-match" element={user ? <CreateMatch /> : <Navigate to="/" />} />

        <Route path="/match-history" element={user ? <MatchHistory /> : <Navigate to="/" />} />

        <Route path="/settings" element={user ? <Settings /> : <Navigate to="/" />} />
        
      </Routes>
    </Router>
  );
}

export default App;