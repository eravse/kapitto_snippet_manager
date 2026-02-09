# Modül Dokümantasyonu

Kapitto Snippet Manager, modüler bir yapı üzerine inşa edilmiştir. Her modül belirli bir işlevselliği yerine getirir.

## 1. Snippet Yönetimi (Core)
Snippet modülü, uygulamanın çekirdeğidir. Kod parçalarının saklanmasını, düzenlenmesini ve versiyonlanmasını sağlar.

- **Özellikler:**
  - Syntax Highlighting (Monaco Editor)
  - Versiyon Geçmişi
  - Etiketleme ve Kategorilendirme
  - Paylaşım (Public/Private)
  - Favorilere Ekleme

## 2. Kullanıcı Yönetimi
Kullanıcıların sisteme kaydolmasını, giriş yapmasını ve profillerini yönetmesini sağlar.

- **Özellikler:**
  - JWT Tabanlı Kimlik Doğrulama
  - 2FA (İki Faktörlü Doğrulama)
  - Profil Yönetimi (Avatar, İsim, Şifre)
  - GitHub Entegrasyonu (Profil verileri için)

## 3. Klasör Yapısı
Snippet'ların hiyerarşik olarak düzenlenmesini sağlar.

- **Özellikler:**
  - Sınırsız Alt Klasör Derinliği
  - Sürükle-Bırak (Planlanan)
  - Klasör Bazlı Filtreleme

## 4. Audit Logs (Denetim Kayıtları)
Sistem üzerindeki önemli işlemlerin kaydedilmesini sağlar. Özellikle kurumsal kullanım ve güvenlik için kritiktir.

- **Kaydedilen İşlemler:**
  - Kullanıcı Girişleri
  - Snippet Oluşturma/Silme/Güncelleme
  - Kullanıcı Yetki Değişiklikleri
  - Sistem Ayar Değişiklikleri

## 5. Sistem Ayarları (Admin)
Yöneticilerin sistemi yapılandırmasını sağlar.

- **Ayarlar:**
  - IP Kısıtlama (Whitelist/Blacklist)
  - Rate Limiting (DoS Koruması)
  - Bakım Modu
  - E-posta Şablonları
