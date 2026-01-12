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

  const snippet1 = await prisma.snippet.create({
    data: {
      title: 'React Custom Hook - useLocalStorage',
      description: 'localStorage ile senkronize olan custom React hook',
      code: `import { useState, useEffect } from 'react';

function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.log(error);
      return initialValue;
    }
  });

  const setValue = (value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.log(error);
    }
  };

  return [storedValue, setValue];
}

export default useLocalStorage;`,
      languageId: jsLang?.id,
      categoryId: frontendCat?.id,
      folderId: frontendFolder.id,
      teamId: team1.id,
      userId: adminUser.id,
      isPublic: true,
      isFavorite: true,
    },
  });

  await prisma.snippetVersion.create({
    data: {
      snippetId: snippet1.id,
      code: snippet1.code,
      title: snippet1.title,
      versionNum: 1,
    },
  });

  await prisma.snippetTag.createMany({
    data: [
      { snippetId: snippet1.id, tagId: reactTag!.id },
      { snippetId: snippet1.id, tagId: utilityTag!.id },
    ],
  });

  const snippet2 = await prisma.snippet.create({
    data: {
      title: 'Async Fetch Wrapper',
      description: 'Hata yönetimi ile geliştirilmiş fetch wrapper fonksiyonu',
      code: `async function fetchWithTimeout(url, options = {}, timeout = 5000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });

    clearTimeout(id);

    if (!response.ok) {
      throw new Error(\`HTTP error! status: \${response.status}\`);
    }

    return await response.json();
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Request timeout');
    }
    throw error;
  }
}

export default fetchWithTimeout;`,
      languageId: tsLang?.id,
      categoryId: utilsCat?.id,
      folderId: frontendFolder.id,
      teamId: team1.id,
      userId: demoUser.id,
      isPublic: true,
      isFavorite: false,
    },
  });

  await prisma.snippetVersion.create({
    data: {
      snippetId: snippet2.id,
      code: snippet2.code,
      title: snippet2.title,
      versionNum: 1,
    },
  });

  await prisma.snippetTag.create({
    data: { snippetId: snippet2.id, tagId: apiTag!.id },
  });

  const snippet3 = await prisma.snippet.create({
    data: {
      title: 'Debounce Function',
      description: 'Kullanıcı inputlarını optimize etmek için debounce fonksiyonu',
      code: `function debounce(func, wait) {
  let timeout;
  
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Kullanım
const handleSearch = debounce((searchTerm) => {
  console.log('Searching for:', searchTerm);
}, 300);`,
      languageId: jsLang?.id,
      categoryId: utilsCat?.id,
      folderId: frontendFolder.id,
      userId: adminUser.id,
      isPublic: true,
      isFavorite: true,
    },
  });

  await prisma.snippetVersion.create({
    data: {
      snippetId: snippet3.id,
      code: snippet3.code,
      title: snippet3.title,
      versionNum: 1,
    },
  });

  await prisma.snippetTag.create({
    data: { snippetId: snippet3.id, tagId: utilityTag!.id },
  });

  const snippet4 = await prisma.snippet.create({
    data: {
      title: 'Python Decorator - Timing',
      description: 'Fonksiyon çalışma süresini ölçen decorator',
      code: `import time
from functools import wraps

def timing_decorator(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        start_time = time.time()
        result = func(*args, **kwargs)
        end_time = time.time()
        print(f"{func.__name__} took {end_time - start_time:.4f} seconds")
        return result
    return wrapper

@timing_decorator
def slow_function():
    time.sleep(1)
    return "Done!"

slow_function()`,
      languageId: pyLang?.id,
      categoryId: backendCat?.id,
      folderId: backendFolder.id,
      teamId: team2.id,
      userId: adminUser.id,
      isPublic: true,
      isFavorite: false,
    },
  });

  await prisma.snippetVersion.create({
    data: {
      snippetId: snippet4.id,
      code: snippet4.code,
      title: snippet4.title,
      versionNum: 1,
    },
  });

  const perfTag = await prisma.tag.findFirst({ where: { name: 'Performance' } });
  await prisma.snippetTag.create({
    data: { snippetId: snippet4.id, tagId: perfTag!.id },
  });

  console.log('✅ Seed işlemi tamamlandı!');
  console.log(`👤 ${await prisma.user.count()} kullanıcı eklendi`);
  console.log(`👥 ${await prisma.team.count()} takım eklendi`);
  console.log(`📦 ${await prisma.category.count()} kategori eklendi`);
  console.log(`📊 ${await prisma.language.count()} dil eklendi`);
  console.log(`📁 ${await prisma.folder.count()} klasör eklendi`);
  console.log(`🏷️  ${await prisma.tag.count()} etiket eklendi`);
  console.log(`📝 ${await prisma.snippet.count()} snippet eklendi`);
  console.log(`🕐 ${await prisma.snippetVersion.count()} snippet version eklendi`);
}

main()
  .catch((e) => {
    console.error('❌ Seed hatası:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
