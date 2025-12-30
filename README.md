# Check-inERU

Check-inERU, eğitim ve etkinlik ortamlarında **ID tabanlı dijital yoklama ve check-in** süreçlerini kolaylaştırmak için geliştirilmiş bir mobil uygulamadır. Kullanıcılar benzersiz kimlikleriyle check-in yapabilir, yoklama verileri **gerçek zamanlı** olarak kaydedilir ve yönetilir.

---

## 🛠️ Özellikler

- ID tabanlı **check-in / yoklama** sistemi  
- Kullanıcı kimlik doğrulama  
- Gerçek zamanlı yoklama ve katılım takibi  
- Akademisyen ve öğrenci rolleri için ayrı ekranlar  
- Hızlı ve kullanıcı dostu mobil arayüz  

---

## 🚀 Kullanılan Teknolojiler

- **React / React Native** – Mobil kullanıcı arayüzleri  
- **JavaScript** – Uygulama iş mantığı  
- **Firebase** – Kimlik doğrulama ve gerçek zamanlı veritabanı  

---

## 📁 Proje Yapısı (Özet)

.
├── screens/
│ ├── Academic/
│ ├── student/
│ └── RoleSelectScreen.js
├── App.js
├── app.json
├── package.json
├── firebase.js (env ile yapılandırılır)
└── README.md



---

## 📱 Uygulama Ekranları Tasarımı örneği
<img width="403" height="862" alt="image" src="https://github.com/user-attachments/assets/860481e9-430f-42cd-839e-c1c0bb831e56" />

---

## 🔐 Environment Variables

Bu proje Firebase yapılandırması için environment variables kullanır.

### 1️⃣ `.env` dosyası oluştur
Proje kök dizininde `.env` dosyası oluşturun (repo’ya **eklemeyin**):

```bash
cp .env.example .env

