import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'; // useLocation eklendi
import { auth } from './firebase'; 
import ReactGA from "react-ga4"; // Google Analytics kütüphanesi

// Sayfalar
import MatchHistory from './pages/MatchHistory';
import Settings from './pages/Settings';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Players from './pages/Players';
import CreateMatch from './pages/CreateMatch';

// --- GOOGLE ANALYTICS AYARLARI ---
// Buraya kendi G- kodunu yapıştır.
const TRACKING_ID = "G-0S62SDRPJX"; 

ReactGA.initialize(TRACKING_ID);

// Sayfa geçişlerini takip eden özel bileşen (Hacker Yöntemi 🕵️‍♂️)
// Router'ın içine koyacağız ki her link değişimini yakalasın.
const AnalyticsTracker = () => {
  const location = useLocation();

  useEffect(() => {
    // Sayfa her değiştiğinde Google'a "Biri buraya girdi" diye sinyal çakıyoruz
    ReactGA.send({ hitType: "pageview", page: location.pathname + location.search });
    console.log("GA4 Sinyali Gönderildi:", location.pathname); // Konsoldan takip etmen için
  }, [location]);

  return null; // Ekranda bir şey göstermesine gerek yok, gizli çalışır.
};

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
    <Router>
      {/* Gizli Takipçiyi Router'ın içine yerleştirdik */}
      <AnalyticsTracker />

      <Routes>
        {/* 1. Ana Sayfa */}
        <Route path="/" element={user ? <Dashboard user={user} /> : <Login />} />
        
        {/* 2. Oyuncular Sayfası */}
        <Route path="/players" element={user ? <Players /> : <Navigate to="/" />} />

        {/* 3. Maç Oluşturma Sayfası */}
        <Route path="/create-match" element={user ? <CreateMatch /> : <Navigate to="/" />} />

        <Route path="/match-history" element={user ? <MatchHistory /> : <Navigate to="/" />} />

        <Route path="/settings" element={user ? <Settings /> : <Navigate to="/" />} />
        
      </Routes>
    </Router>
  );
}

export default App;