import { useState } from 'react';
import { auth, googleProvider } from '../firebase'; 
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  sendPasswordResetEmail
} from 'firebase/auth';

const Login = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [isReset, setIsReset] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.error(err);
      setError("Google girişi başarısız oldu.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      setError("Lütfen önce e-posta adresinizi girin!");
      return;
    }
    try {
      setLoading(true);
      await sendPasswordResetEmail(auth, email);
      alert("📧 Sıfırlama bağlantısı gönderildi! Spam kutusunu kontrol et.");
      setIsReset(false);
      setError("");
    } catch (err) {
      if (err.code === 'auth/user-not-found') {
        setError("Bu e-posta kayıtlı değil.");
      } else {
        setError("Hata: " + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAuth = async () => {
    setError("");
    setLoading(true);
    try {
      if (isRegister) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch {
       setError("Giriş başarısız. Bilgileri kontrol et.");
    } finally {
      setLoading(false);
    }
  };

  let title = "Giriş Yap";
  if (isRegister) title = "Kayıt Ol";
  if (isReset) title = "Şifremi Unuttum";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="bg-gray-800 p-8 rounded-lg shadow-lg w-96 border border-gray-700">
        <h2 className="text-3xl font-bold text-white mb-6 text-center">{title}</h2>
        
        {error && <div className="bg-red-500 text-white p-2 rounded mb-4 text-sm text-center font-bold">{error}</div>}

        {/* Tarayıcının otomatik doldurmasını engellemek için gizli form hilesi */}
        <form autoComplete="off" onSubmit={(e) => e.preventDefault()} className="space-y-4">
          
          {!isReset && (
            <>
              <button
                type="button"
                onClick={handleGoogleLogin}
                className="w-full flex items-center justify-center gap-2 bg-white text-gray-700 font-bold py-2 px-4 rounded hover:bg-gray-100 transition duration-200"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Google ile Giriş Yap
              </button>
              <div className="flex items-center justify-center"><span className="text-gray-500 text-sm">veya e-posta ile</span></div>
            </>
          )}

          <div>
            <label className="block text-gray-400 text-sm mb-1">E-posta</label>
            <input 
              type="email" 
              value={email}
              // BU KISIM ÖNEMLİ: Otomatik tamamlamayı kapatıyoruz
              autoComplete="off"
              name="email_field_random" // Rastgele isim vererek tarayıcıyı şaşırtıyoruz
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2 rounded bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="ornek@mail.com"
            />
          </div>
          
          {!isReset && (
            <div>
              <label className="block text-gray-400 text-sm mb-1">Şifre</label>
              <input 
                type="password" 
                value={password}
                // BU KISIM ÖNEMLİ: Tarayıcıya 'bu yeni şifre, eskileri getirme' diyoruz
                autoComplete="new-password"
                name="password_field_random"
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-2 rounded bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {!isRegister && (
                <div className="text-right mt-1">
                  <button onClick={() => { setIsReset(true); setError(""); }} className="text-xs text-blue-400 hover:text-blue-300 hover:underline">Şifremi Unuttum?</button>
                </div>
              )}
            </div>
          )}

          {isReset ? (
            <button type="button" onClick={handleResetPassword} disabled={loading} className="w-full bg-yellow-600 hover:bg-yellow-500 text-white font-bold py-2 px-4 rounded">
              {loading ? 'Gönderiliyor...' : 'Sıfırlama Linki Gönder'}
            </button>
          ) : (
            <button type="button" onClick={handleAuth} disabled={loading} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded">
              {loading ? 'İşleniyor...' : (isRegister ? 'Kayıt Ol' : 'Giriş Yap')}
            </button>
          )}
          
          <div className="text-gray-500 text-center mt-4 text-sm">
            {isReset ? (
              <span onClick={() => { setIsReset(false); setError(""); }} className="text-blue-400 cursor-pointer hover:underline font-bold">← Giriş Ekranına Dön</span>
            ) : (
              <p>
                {isRegister ? 'Zaten hesabın var mı?' : 'Hesabın yok mu?'}
                <span onClick={() => { setIsRegister(!isRegister); setError(""); }} className="text-blue-400 cursor-pointer ml-1 hover:underline font-bold">{isRegister ? 'Giriş Yap' : 'Kayıt Ol'}</span>
              </p>
            )}
          </div>

        </form>
      </div>
    </div>
  );
};

export default Login;