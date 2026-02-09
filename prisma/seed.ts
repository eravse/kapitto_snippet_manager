import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Veritabanı seed işlemi başlıyor...');

  const hashedPassword = await bcrypt.hash('1q2w3e', 10);

  // 1. Admin Kullanıcısı
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@kapitto.com' },
    update: {},
    create: {
      email: 'admin@kapitto.com',
      name: 'Admin User',
      password: hashedPassword,
      role: 'admin',
    },
  });
  console.log('✅ Admin kullanıcısı hazır');

  // 2. Kategoriler
  const categories = [
    { name: 'Frontend Development', description: 'UI/UX ve frontend teknolojileri', icon: '🎨', color: '#3b82f6' },
    { name: 'Backend Development', description: 'Server-side ve API geliştirme', icon: '⚙️', color: '#10b981' },
    { name: 'DevOps', description: 'CI/CD ve deployment araçları', icon: '🚀', color: '#f59e0b' },
    { name: 'Database', description: 'SQL ve NoSQL veritabanı işlemleri', icon: '🗄️', color: '#6366f1' },
    { name: 'Algorithms', description: 'Veri yapıları ve algoritmalar', icon: '🧮', color: '#8b5cf6' },
    { name: 'Security', description: 'Güvenlik ve şifreleme', icon: '🔒', color: '#ef4444' },
    { name: 'Testing', description: 'Unit, integration ve e2e testler', icon: '✅', color: '#14b8a6' },
    { name: 'Utilities', description: 'Yardımcı fonksiyonlar ve araçlar', icon: '🛠️', color: '#64748b' },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { name: cat.name },
      update: {},
      create: cat,
    });
  }
  console.log('✅ Kategoriler hazır');

  // 3. Diller
  const languages = [
    { name: 'JavaScript', monacoId: 'javascript', icon: '📜' },
    { name: 'TypeScript', monacoId: 'typescript', icon: '💙' },
    { name: 'Python', monacoId: 'python', icon: '🐍' },
    { name: 'Java', monacoId: 'java', icon: '☕' },
    { name: 'C++', monacoId: 'cpp', icon: '⚙️' },
    { name: 'Go', monacoId: 'go', icon: '🐹' },
    { name: 'Rust', monacoId: 'rust', icon: '🦀' },
    { name: 'PHP', monacoId: 'php', icon: '🐘' },
    { name: 'Ruby', monacoId: 'ruby', icon: '💎' },
    { name: 'Swift', monacoId: 'swift', icon: '🍎' },
    { name: 'Kotlin', monacoId: 'kotlin', icon: '🎯' },
    { name: 'C#', monacoId: 'csharp', icon: '🎮' },
    { name: 'HTML', monacoId: 'html', icon: '🌐' },
    { name: 'CSS', monacoId: 'css', icon: '🎨' },
    { name: 'SQL', monacoId: 'sql', icon: '🗄️' },
    { name: 'Shell', monacoId: 'shell', icon: '🖥️' },
    { name: 'JSON', monacoId: 'json', icon: '📋' },
    { name: 'YAML', monacoId: 'yaml', icon: '📝' },
    { name: 'Markdown', monacoId: 'markdown', icon: '📄' },
    { name: 'Docker', monacoId: 'dockerfile', icon: '🐳' },
  ];

  for (const lang of languages) {
    await prisma.language.upsert({
      where: { name: lang.name },
      update: {},
      create: lang,
    });
  }
  console.log('✅ Diller hazır');

  // 4. Etiketler
  const tags = [
    { name: 'React', color: '#61DAFB' },
    { name: 'Node.js', color: '#339933' },
    { name: 'Database', color: '#4479A1' },
    { name: 'API', color: '#FF6C37' },
    { name: 'Algorithm', color: '#F7DF1E' },
    { name: 'Utility', color: '#68A063' },
    { name: 'Authentication', color: '#E34F26' },
    { name: 'Testing', color: '#C21325' },
    { name: 'Performance', color: '#00D8FF' },
    { name: 'Security', color: '#FF0000' },
  ];

  for (const tag of tags) {
    await prisma.tag.upsert({
      where: { name: tag.name },
      update: {},
      create: tag,
    });
  }
  console.log('✅ Etiketler hazır');

  // 5. Klasörler (Folder yapısı biraz daha karmaşık olabilir, önce root klasörleri kontrol edelim)
  // Klasör isimlerinin unique olması gerekmiyor modelde, ama seed'i tekrar tekrar çalıştırmamak için kontrol edebiliriz.
  // Basitlik adına, kullanıcının root klasörlerini kontrol edip yoksa oluşturacağız.

  const frontendFolder = await prisma.folder.findFirst({
    where: { name: 'Frontend', userId: adminUser.id, parentId: null }
  }) || await prisma.folder.create({
    data: { name: 'Frontend', userId: adminUser.id },
  });

  const backendFolder = await prisma.folder.findFirst({
    where: { name: 'Backend', userId: adminUser.id, parentId: null }
  }) || await prisma.folder.create({
    data: { name: 'Backend', userId: adminUser.id },
  });

  // Alt klasörler
  const subFolders = [
    { name: 'React', parentId: frontendFolder.id, userId: adminUser.id },
    { name: 'Vue.js', parentId: frontendFolder.id, userId: adminUser.id },
    { name: 'Node.js', parentId: backendFolder.id, userId: adminUser.id },
    { name: 'Python', parentId: backendFolder.id, userId: adminUser.id },
  ];

  for (const sub of subFolders) {
    const exists = await prisma.folder.findFirst({
      where: { name: sub.name, parentId: sub.parentId, userId: sub.userId }
    });
    if (!exists) {
      await prisma.folder.create({ data: sub });
    }
  }
  console.log('✅ Klasörler hazır');

  console.log('✅ Seed işlemi başarıyla tamamlandı!');
  console.log('📧 Admin: admin@kapitto.com / 1q2w3e');

}

main()
  .catch((e) => {
    console.error('❌ Seed hatası:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

