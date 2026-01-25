import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Veritabanı seed işlemi başlıyor...');

  const hashedPassword = await bcrypt.hash('1q2w3e', 10);
  
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@kapitto.com',
      password: hashedPassword,
      name: 'Admin User',
      role: 'admin',
    },
  });

  const demoUser = await prisma.user.create({
    data: {
      email: 'demo@kapitto.com',
      password: hashedPassword,
      name: 'Demo User',
      role: 'user',
    },
  });

  console.log('✅ Kullanıcılar oluşturuldu');
  console.log('📧 Admin: admin@kapitto.com / 1q2w3e');
  console.log('📧 Demo: demo@kapitto.com / 1q2w3e');

  const team1 = await prisma.team.create({
    data: {
      name: 'Frontend Team',
      description: 'UI/UX ve frontend geliştirme ekibi',
      members: {
        create: [
          { userId: adminUser.id, role: 'owner' },
          { userId: demoUser.id, role: 'member' },
        ],
      },
    },
  });

  const team2 = await prisma.team.create({
    data: {
      name: 'Backend Team',
      description: 'API ve backend geliştirme ekibi',
      members: {
        create: [
          { userId: adminUser.id, role: 'owner' },
        ],
      },
    },
  });

  console.log('✅ Takımlar oluşturuldu');

  await prisma.category.createMany({
    data: [
      { name: 'Frontend Development', description: 'UI/UX ve frontend teknolojileri', icon: '🎨', color: '#3b82f6' },
      { name: 'Backend Development', description: 'Server-side ve API geliştirme', icon: '⚙️', color: '#10b981' },
      { name: 'DevOps', description: 'CI/CD ve deployment araçları', icon: '🚀', color: '#f59e0b' },
      { name: 'Database', description: 'SQL ve NoSQL veritabanı işlemleri', icon: '🗄️', color: '#6366f1' },
      { name: 'Algorithms', description: 'Veri yapıları ve algoritmalar', icon: '🧮', color: '#8b5cf6' },
      { name: 'Security', description: 'Güvenlik ve şifreleme', icon: '🔒', color: '#ef4444' },
      { name: 'Testing', description: 'Unit, integration ve e2e testler', icon: '✅', color: '#14b8a6' },
      { name: 'Utilities', description: 'Yardımcı fonksiyonlar ve araçlar', icon: '🛠️', color: '#64748b' },
    ],
  });

  await prisma.language.createMany({
    data: [
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
    ],
  });

  const tags = await prisma.tag.createMany({
    data: [
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
    ],
  });

  const frontendFolder = await prisma.folder.create({
    data: { name: 'Frontend', userId: adminUser.id },
  });

  const backendFolder = await prisma.folder.create({
    data: { name: 'Backend', userId: adminUser.id },
  });

  await prisma.folder.create({
    data: { name: 'React', parentId: frontendFolder.id, userId: adminUser.id },
  });

  await prisma.folder.create({
    data: { name: 'Vue.js', parentId: frontendFolder.id, userId: adminUser.id },
  });

  await prisma.folder.create({
    data: { name: 'Node.js', parentId: backendFolder.id, userId: adminUser.id },
  });

  await prisma.folder.create({
    data: { name: 'Python', parentId: backendFolder.id, userId: adminUser.id },
  });

  const jsLang = await prisma.language.findFirst({ where: { name: 'JavaScript' } });
  const tsLang = await prisma.language.findFirst({ where: { name: 'TypeScript' } });
  const pyLang = await prisma.language.findFirst({ where: { name: 'Python' } });

  const frontendCat = await prisma.category.findFirst({ where: { name: 'Frontend Development' } });
  const utilsCat = await prisma.category.findFirst({ where: { name: 'Utilities' } });
  const backendCat = await prisma.category.findFirst({ where: { name: 'Backend Development' } });

  const reactTag = await prisma.tag.findFirst({ where: { name: 'React' } });
  const utilityTag = await prisma.tag.findFirst({ where: { name: 'Utility' } });
  const apiTag = await prisma.tag.findFirst({ where: { name: 'API' } });



  console.log('✅ Seed işlemi tamamlandı!');
  console.log(`👤 ${await prisma.user.count()} kullanıcı eklendi`);
  console.log(`👥 ${await prisma.team.count()} takım eklendi`);
  console.log(`📦 ${await prisma.category.count()} kategori eklendi`);
  console.log(`📊 ${await prisma.language.count()} dil eklendi`);
  console.log(`📁 ${await prisma.folder.count()} klasör eklendi`);
  console.log(`🏷️  ${await prisma.tag.count()} etiket eklendi`);
  console.log(`📝 ${await prisma.snippet.count()} snippet eklendi`);
}

main()
  .catch((e) => {
    console.error('❌ Seed hatası:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
