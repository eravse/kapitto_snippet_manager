# Snippet Manager

Modern Code Snippet Manager uygulaması - SQLite veritabanı ile yerel çalışan, Directus yerine SQLite kullanan versiyon.

## 🎯 Özellikler

- ✅ **SQLite Veritabanı**: Yerel, dosya tabanlı veritabanı
- ✅ **Prisma ORM**: Tip-güvenli veritabanı işlemleri
- ✅ **Next.js 15**: Modern React framework (güvenlik güncellemeli)
- ✅ **React 19**: En son React sürümü
- ✅ **Monaco Editor**: VS Code editörü ile syntax highlighting
- ✅ **Dark/Light Mode**: Sistem tercihi ile senkronize tema
- ✅ **Responsive Design**: Mobil uyumlu arayüz
- ✅ **3-Panel Layout**: Sidebar, Liste, Detay paneli

## 📋 Gereksinimler

- Node.js 18+ veya 20+
- npm veya yarn

## 🚀 Kurulum

### 1. Bağımlılıkları Yükle

**NPM kullanıyorsanız ve cache hatası alırsanız:**
```bash
sudo chown -R 501:20 "/Users/[your_user_name]/.npm"
npm install
```

**veya Yarn kullanın:**
```bash
yarn install
```

### 2. Veritabanını Oluştur

```bash
# Prisma client'ı oluştur
npm run db:generate

# Veritabanı şemasını uygula
npm run db:push

# Örnek verileri yükle
npm run db:seed
```

### 3. Uygulamayı Başlat

```bash
npm run dev
```

Uygulama `http://localhost:3000` adresinde çalışacak.

## 📊 Veritabanı Yapısı

### Koleksiyonlar

- **snippets**: Kod parçaları
- **folders**: Klasör yapısı (hiyerarşik)
- **tags**: Etiketler
- **languages**: Programlama dilleri
- **snippet_tags**: Snippet-Tag ilişkisi

### Seed Data

Seed scripti otomatik olarak şunları oluşturur:
- 20 programlama dili (JavaScript, TypeScript, Python, vb.)
- 10 popüler etiket
- 6 klasör (Frontend, Backend ve alt klasörler)
- 4 örnek snippet

## 🛠️ Komutlar

```bash
# Geliştirme modu
npm run dev

# Production build
npm run build
npm start

# Veritabanı işlemleri
npm run db:generate    # Prisma client oluştur
npm run db:push        # Şemayı veritabanına uygula
npm run db:seed        # Örnek verileri yükle
npm run db:studio      # Prisma Studio'yu aç (veritabanı yönetimi)
```

## 📁 Proje Yapısı

```
SnippetManager/
├── app/
│   ├── api/                    # API routes
│   │   ├── snippets/          # Snippet CRUD
│   │   ├── folders/           # Klasör işlemleri
│   │   ├── tags/              # Etiket işlemleri
│   │   └── languages/         # Dil listesi
│   ├── dashboard/             # Ana sayfa
│   ├── layout.tsx             # Root layout
│   └── globals.css            # Global stiller
├── components/
│   ├── FolderTree.tsx         # Klasör ağacı
│   ├── SearchBar.tsx          # Arama çubuğu
│   ├── SnippetCard.tsx        # Snippet kartı
│   └── SnippetDetail.tsx      # Detay paneli
├── contexts/
│   └── ThemeContext.tsx       # Dark/Light mode
├── lib/
│   └── prisma.ts              # Prisma client
├── prisma/
│   ├── schema.prisma          # Veritabanı şeması
│   ├── seed.ts                # Seed script
│   └── dev.db                 # SQLite veritabanı (otomatik oluşur)
└── package.json
```

## 🎨 Kullanım

### Snippet Görüntüleme
1. Sol kenar çubuğundan klasör seç
2. Ortadaki listeden snippet seç
3. Sağ panelde kod görüntülenir

### Arama
- Başlık, açıklama ve kod içeriğinde arama yapılır
- Gerçek zamanlı filtreleme

### Tema Değiştirme
- Sağ üst köşedeki güneş/ay ikonuna tıkla
- Tercih otomatik kaydedilir

## 🔧 API Endpoints

### Snippets
- `GET /api/snippets` - Tüm snippet'leri listele
- `GET /api/snippets?folderId=1` - Klasöre göre filtrele
- `GET /api/snippets?search=react` - Arama
- `GET /api/snippets/[id]` - Tekil snippet
- `POST /api/snippets` - Yeni snippet
- `PUT /api/snippets/[id]` - Snippet güncelle
- `DELETE /api/snippets/[id]` - Snippet sil

### Folders
- `GET /api/folders` - Tüm klasörler
- `POST /api/folders` - Yeni klasör

### Tags
- `GET /api/tags` - Tüm etiketler

### Languages
- `GET /api/languages` - Tüm diller

## 💡 İpuçları

1. **Prisma Studio**: Veritabanını görsel olarak yönetmek için `npm run db:studio` çalıştırın
2. **Veritabanı Sıfırlama**: `prisma/dev.db` dosyasını silin ve `npm run db:push && npm run db:seed` çalıştırın
3. **Yeni Dil Eklemek**: `prisma/seed.ts` dosyasını düzenleyin veya Prisma Studio kullanın

## 📝 Lisans

MIT
