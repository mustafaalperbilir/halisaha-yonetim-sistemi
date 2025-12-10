# ⚽ Halı Saha Yönetim Sistemi

Arkadaş grupları ve halı saha organizatörleri için geliştirilmiş; oyuncu yönetimi, adil takım kurma, maç planlama ve otomatik bildirim özelliklerine sahip **Full-Stack** bir yönetim panelidir.

![Proje Görseli](https://via.placeholder.com/1000x500?text=Hali+Saha+Yonetim+Sistemi+Ekran+Goruntusu)
*(Buraya projenizden bir ekran görüntüsü ekleyebilirsiniz)*

## 🚀 Öne Çıkan Özellikler

* **🔐 Güvenli Kimlik Doğrulama:** Google ve E-posta/Şifre ile giriş, şifre sıfırlama (Firebase Auth).
* **⚖️ Akıllı Takım Dengeleme:** Oyuncu puanlarına göre takımları otomatik dengeleyen Snake Draft algoritması.
* **🤖 Yapay Zeka Analizi:** Kurulan kadrolara göre maç sonucunu tahmin eden yapay zeka modülü.
* **📢 Sosyal Entegrasyon:**
    * **Telegram Botu:** Maç kadrosunu ve maç sonu raporunu (Skor & MVP) otomatik olarak gruba gönderir.
    * **WhatsApp:** Kadroyu tek tıkla WhatsApp üzerinden paylaşma özelliği.
* **⚙️ Dinamik Ayarlar:** Her kullanıcı kendi Telegram Bot Token ve Chat ID'sini sistem üzerinden ayarlayabilir.
* **📜 Maç Geçmişi:** Oynanan maçların skorlarını ve istatistiklerini arşivleme.

## 🛠️ Teknoloji Yığını

* **Frontend:** React (Vite), Tailwind CSS, Axios, React Router
* **Backend:** Node.js, Express.js
* **Veritabanı:** Google Firebase (Firestore Database)

## 📦 Kurulum ve Çalıştırma

Projeyi yerel makinenizde çalıştırmak için aşağıdaki adımları izleyin.

### 1. Repoyu Klonlayın
```bash
git clone [https://github.com/KULLANICI_ADINIZ/halisaha-yonetim-sistemi.git](https://github.com/KULLANICI_ADINIZ/halisaha-yonetim-sistemi.git)
cd halisaha-yonetim-sistemi
