# Pro Özellikler (v2.1)

Kapitto Snippet Manager v2.1 ile birlikte, profesyonel kullanıcılar ve ekipler için gelişmiş özellikler sunulmaktadır.

## 1. Kaynak Kontrol Entegrasyonu (Source Control)
Kodlarınızı doğrudan favori versiyon kontrol sistemlerinize gönderin.

- **Desteklenen Platformlar:**
  - **GitHub**: Gist veya Repo olarak gönderme.
  - **Gitea**: Gitea snippet veya repo desteği.
- **Nasıl Kullanılır?**
  1. `Profil > Entegrasyonlar` sekmesine gidin.
  2. GitHub veya Gitea Access Token'ınızı girin.
  3. Admin onay sayfasında veya snippet detayında "Push to Source Control" butonunu kullanın.

## 2. Lisans Yönetimi
Pro özelliklerin kilidini açmak için esnek lisanslama sistemi.

- **Aktivasyon:**
  - `Ayarlar > Lisans` (eğer Pro aktif değilse) menüsünden lisans anahtarınızı girin.
  - Sistem, kök dizinde `licence.check` dosyası oluşturarak özellikleri aktif eder.
  - Alternatif olarak `pro` klasörü içinde geçerli bir lisans dosyası da kabul edilir.

## 3. Gelişmiş Güvenlik
Kurumsal seviyede güvenlik önlemleri.

- **IP Erişim Kontrolü:** Sadece belirli IP adreslerinden erişime izin verin (Whitelist) veya şüpheli IP'leri engelleyin (Blacklist).
- **DoS Koruması:** Dakika başına istek sayısını (RPM) sınırlayarak sistemi koruyun.

## 4. Veri Taşıma (Migration)
Eski Kapitto veya başka sistemlerden verilerinizi kolayca taşıyın.

- **Legacy Import:** v1.x sürümlerinden API üzerinden otomatik veri transferi.
