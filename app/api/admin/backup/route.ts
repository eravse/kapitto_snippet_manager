import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth'; // Senin kendi auth dosyan
import fs from 'fs';
import path from 'path';
import { createAuditLog } from '@/lib/audit';

export async function GET() {
    try {
        // 1. Session'ı al (Senin getSession fonksiyonun SessionUser | null döner)
        const session = await getSession();

        // 2. Kontrol: Session var mı ve role 'admin' mi?
        // DİKKAT: Senin yapında session.user.role değil, direkt session.role kullanılır.
        if (!session || session.role !== 'admin') {
            return NextResponse.json(
                { error: 'Yetkisiz erişim. Sadece adminler yedek alabilir.' },
                { status: 401 }
            );
        }

        // 3. Veritabanı dosyasının yolu
        const dbPath = path.resolve(process.cwd(), 'prisma/dev.db');

        // 4. Dosya kontrolü
        if (!fs.existsSync(dbPath)) {
            return NextResponse.json(
                { error: 'Veritabanı dosyası bulunamadı.' },
                { status: 404 }
            );
        }

        // 5. Dosyayı oku
        const fileBuffer = fs.readFileSync(dbPath);

        await createAuditLog({
            action: 'DOWNLOAD',
            entity: 'system',
            entityId: 0,
            details: 'Veritabanı yedeği indirildi.',
        });

        // 6. Dosyayı indirilebilir olarak döndür
        return new NextResponse(fileBuffer, {
            headers: {
                'Content-Disposition': 'attachment; filename="database_backup.db"',
                'Content-Type': 'application/x-sqlite3',
            },
        });

    } catch (error) {
        console.error("Yedekleme hatası:", error);
        return NextResponse.json(
            { error: 'Yedekleme sırasında bir hata oluştu.' },
            { status: 500 }
        );
    }
}