const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
const dotenv = require('dotenv');
const axios = require('axios');

dotenv.config();

// Servis anahtarını çağırıyoruz
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const app = express();

app.use(cors());
app.use(express.json());

// --- ANA SAYFA KONTROL ---
app.get('/', (req, res) => {
  res.send('Halı Saha Backend Çalışıyor! 🚀');
});

// ==========================================
// 1. OYUNCU İŞLEMLERİ (CRUD)
// ==========================================

// OYUNCU EKLEME
app.post('/api/players/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const playerData = req.body;
    
    const newPlayer = {
        ...playerData,
        createdAt: new Date().toISOString()
    };

    const docRef = await db.collection('users').doc(userId).collection('players').add(newPlayer);
    res.status(201).send({ id: docRef.id, message: "Oyuncu eklendi." });
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

// OYUNCULARI GETİR
app.get('/api/players/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const snapshot = await db.collection('users').doc(userId).collection('players').get();
    const players = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.status(200).json(players);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

// OYUNCU GÜNCELLEME
app.put('/api/players/:id', async (req, res) => {
  try {
    const { uid, name, position, rating } = req.body;
    const playerId = req.params.id;

    await db.collection('users').doc(uid).collection('players').doc(playerId).update({
      name,
      position,
      rating
    });

    res.json({ message: "Oyuncu güncellendi" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// OYUNCU SİLME
app.delete('/api/players/:id', async (req, res) => {
  try {
    const playerId = req.params.id;
    const uid = req.query.uid; 

    await db.collection('users').doc(uid).collection('players').doc(playerId).delete();
    res.json({ message: "Oyuncu silindi" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// ==========================================
// 2. TAKIM OLUŞTURMA MOTORU (ALGORİTMA)
// ==========================================

app.post('/api/generate-teams', (req, res) => {
  let { players, previousTeams } = req.body;

  if (!players || players.length < 2) {
    return res.status(400).json({ error: "Yetersiz oyuncu" });
  }

  // Kalecileri ve Sahadakileri Ayır
  const goalkeepers = players.filter(p => p.position === 'Kaleci');
  const fieldPlayers = players.filter(p => p.position !== 'Kaleci');

  if (goalkeepers.length > 2) {
    return res.status(400).json({ error: "En fazla 2 kaleci seçebilirsiniz!" });
  }

  // --- DÖNGÜ BAŞLANGICI (En iyi takımı bulana kadar dener) ---
  let attempts = 0;
  let finalTeamA = [];
  let finalTeamB = [];
  let finalStats = {};
  let finalPrediction = "";
  let success = false;

  do {
    attempts++;

    // 1. Kopyalar oluştur
    let currentFieldPlayers = [...fieldPlayers];
    let currentGoalkeepers = [...goalkeepers];

    // 2. Saha Oyuncularını Karıştır (Rastgelelik)
    currentFieldPlayers.sort((a, b) => b.rating - a.rating);
    for (let i = 0; i < currentFieldPlayers.length - 1; i += 2) {
      if (Math.random() < 0.5) {
        [currentFieldPlayers[i], currentFieldPlayers[i+1]] = [currentFieldPlayers[i+1], currentFieldPlayers[i]];
      }
    }

    const teamA = [];
    const teamB = [];
    let powerA = 0;
    let powerB = 0;

    // 3. Kalecileri Dağıt
    if (currentGoalkeepers.length > 0) {
      if (Math.random() < 0.5) currentGoalkeepers.reverse();
      currentGoalkeepers.forEach((gk, index) => {
        if (index % 2 === 0) { teamA.push(gk); powerA += gk.rating; } 
        else { teamB.push(gk); powerB += gk.rating; }
      });
    }

    // 4. Saha Oyuncularını Dengeleyerek Dağıt
    currentFieldPlayers.forEach((player) => {
      if (powerA <= powerB) { teamA.push(player); powerA += player.rating; } 
      else { teamB.push(player); powerB += player.rating; }
    });

    // 5. Eski Takımla Karşılaştır (Çeşitlilik Kontrolü)
    if (previousTeams && previousTeams.teamA && players.length >= 6) {
      const prevA_IDs = previousTeams.teamA.map(p => p.id);
      const samePlayersCount = teamA.filter(p => prevA_IDs.includes(p.id)).length;
      const diffCount = teamA.length - samePlayersCount;

      if (diffCount >= 3) success = true; // En az 3 kişi değiştiyse tamamdır
    } else {
      success = true; // İlk maçsa direkt kabul et
    }

    // Sonuçları Hazırla
    finalTeamA = teamA;
    finalTeamB = teamB;
    
    const diff = powerA - powerB;
    let prediction = "";
    if (diff > 0) prediction = `🏆 A Takımı Favori (+${diff} Güç)`;
    else if (diff < 0) prediction = `🏆 B Takımı Favori (+${Math.abs(diff)} Güç)`;
    else {
      const rw = Math.random() < 0.5 ? "A Takımı" : "B Takımı";
      prediction = `🔥 Tam Denge! ${rw} Penaltılarla Alır!`;
    }

    finalStats = { powerA, powerB, diff: Math.abs(diff) };
    finalPrediction = prediction;

  } while (!success && attempts < 50);

  res.json({
    teamA: finalTeamA,
    teamB: finalTeamB,
    stats: finalStats,
    prediction: finalPrediction,
    attempts
  });
});


// ==========================================
// 3. MAÇ YÖNETİMİ (PLANLAMA VE SONUÇ GİRME)
// ==========================================

// MAÇI PLANLA (HENÜZ OYNANMADI) - POST
app.post('/api/matches', async (req, res) => {
  try {
    const { uid, teamA, teamB, stats, prediction, location, date } = req.body;
    
    const matchData = {
      teamA,
      teamB,
      stats,
      prediction,
      location,
      date,
      // Başlangıç değerleri (Boş bırakıyoruz)
      scoreA: null, 
      scoreB: null,
      mvp: null,
      status: 'pending', // ÖNEMLİ: Durumu 'Bekliyor' olarak ayarladık
      createdAt: new Date().toISOString()
    };

    await db.collection('users').doc(uid).collection('matches').add(matchData);
    res.json({ message: "Maç planlandı!" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// MAÇ GÜNCELLE / SONUÇ GİR - PUT
app.put('/api/matches/:id', async (req, res) => {
  try {
    const matchId = req.params.id;
    // Frontend'den gelen 'status: completed' bilgisini de alıyoruz
    const { uid, scoreA, scoreB, mvp, location, date, status } = req.body;

    await db.collection('users').doc(uid).collection('matches').doc(matchId).update({
      scoreA: parseInt(scoreA),
      scoreB: parseInt(scoreB),
      mvp,
      location,
      date,
      status // Durumu güncelliyoruz (pending -> completed)
    });

    res.json({ message: "Maç güncellendi." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// MAÇLARI GETİR - GET
app.get('/api/matches/:uid', async (req, res) => {
  try {
    const uid = req.params.uid;
    const snapshot = await db.collection('users').doc(uid).collection('matches').orderBy('date', 'desc').get();
    
    const matches = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.json(matches);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// MAÇ SİLME - DELETE
app.delete('/api/matches/:id', async (req, res) => {
  try {
    const matchId = req.params.id;
    const uid = req.query.uid; 

    await db.collection('users').doc(uid).collection('matches').doc(matchId).delete();
    res.json({ message: "Maç silindi." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- EN ÜSTE EKLE ---


// ... (Diğer kodların hepsi burada duruyor) ...

// ==========================================
// 4. KULLANICI AYARLARI (TELEGRAM VB.)
// ==========================================

// AYARLARI KAYDET (Bot Token & Chat ID)
app.post('/api/settings/:uid', async (req, res) => {
  try {
    const { uid } = req.params;
    const { telegramBotToken, telegramChatId } = req.body;

    // Kullanıcının dokümanına bu ayarları 'merge' (birleştirme) yöntemiyle ekliyoruz
    await db.collection('users').doc(uid).set({
      telegramConfig: {
        botToken: telegramBotToken,
        chatId: telegramChatId
      }
    }, { merge: true }); // merge: true -> Diğer verileri silmeden sadece bunu ekler

    res.json({ message: "Ayarlar kaydedildi." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// AYARLARI GETİR (Sayfa açılınca kutular dolsun diye)
app.get('/api/settings/:uid', async (req, res) => {
  try {
    const { uid } = req.params;
    const userDoc = await db.collection('users').doc(uid).get();

    if (!userDoc.exists) {
      return res.json({}); // Kullanıcı yoksa boş dön
    }

    const userData = userDoc.data();
    // Eğer ayar varsa gönder, yoksa boş gönder
    res.json(userData.telegramConfig || {}); 
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- DİNAMİK TELEGRAM GÖNDERME (HERKESİN KENDİ BOTUNA) ---
// --- TELEGRAM GÖNDERME SERVİSİ (AKILLI VERSİYON) ---
// --- TELEGRAM GÖNDERME SERVİSİ (SKOR HATASI DÜZELTİLDİ) ---
app.post('/api/send-telegram', async (req, res) => {
  const { uid, teamA, teamB, date, location, prediction, scoreA, scoreB, mvp } = req.body;

  try {
    // 1. Ayarları Çek
    const userDoc = await db.collection('users').doc(uid).get();
    if (!userDoc.exists) return res.status(404).json({ error: "Kullanıcı bulunamadı." });

    const config = userDoc.data().telegramConfig;
    if (!config || !config.botToken || !config.chatId) {
      return res.status(400).json({ error: "Ayarlar sayfasından Telegram botunu kurmalısın." });
    }

    let message = "";

    // 2. MESAJ TÜRÜNÜ BELİRLE
    if (scoreA !== undefined && scoreB !== undefined && scoreA !== null) {
      
      // --- DÜZELTME BURADA: Skorları Sayıya Çevir ---
      const sA = parseInt(scoreA);
      const sB = parseInt(scoreB);
      
      let winnerText = "";
      
      if (sA > sB) {
        winnerText = "🔴 A TAKIMI KAZANDI!";
      } else if (sB > sA) {
        winnerText = "🔵 B TAKIMI KAZANDI!";
      } else {
        winnerText = "🤝 DOSTLUK KAZANDI (BERABERE)";
      }
      
      message = `
🏁 *MAÇ SONA ERDİ!* 🏁

🏟️ *Yer:* ${location}
📅 *Tarih:* ${new Date(date).toLocaleString('tr-TR')}

🔢 *SKOR*
🟥 *A Takımı:* ${sA}
🟦 *B Takımı:* ${sB}

🏆 *SONUÇ:* ${winnerText}

🌟 *Maçın Yıldızı (MVP):* ${mvp || "Seçilmedi"}

🧠 *Yapay Zeka Ne Demişti?*
_${prediction}_
      `;

    } else {
      // PLANLAMA MESAJI (Aynı kalıyor)
      message = `
📢 *HALI SAHA MAÇI PLANLANDI!* 📢

📅 *Tarih:* ${new Date(date).toLocaleString('tr-TR')}
📍 *Konum:* ${location}

🔴 *A TAKIMI*
${teamA.map(p => `• ${p.name} (${p.position})`).join('\n')}

🔵 *B TAKIMI*
${teamB.map(p => `• ${p.name} (${p.position})`).join('\n')}

🧠 *Yapay Zeka Tahmini:*
_${prediction}_

✅ _Lütfen herkes saatinde orada olsun!_
      `;
    }

    // 3. Gönder
    await axios.post(`https://api.telegram.org/bot${config.botToken}/sendMessage`, {
      chat_id: config.chatId,
      text: message,
      parse_mode: 'Markdown'
    });

    res.json({ message: "Rapor gönderildi!" });

  } catch (error) {
    console.error("Telegram Hatası:", error.response ? error.response.data : error.message);
    res.status(500).json({ error: "Telegram'a gönderilemedi." });
  }
});

// SUNUCUYU BAŞLAT
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Sunucu ${PORT} portunda çalışıyor...`);
});