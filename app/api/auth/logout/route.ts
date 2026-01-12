import { NextResponse } from 'next/server';
import { clearSession, getSession } from '@/lib/auth';
import { createAuditLog } from '@/lib/audit';

export async function POST() {
  try {
    const session = await getSession();

    if (session) {
      await createAuditLog({
        action: 'LOGOUT',
        entity: 'user',
        entityId: session.id,
        details: `Kullanıcı çıkış yaptı: ${session.email}`,
      });
    }

    await clearSession();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Çıkış sırasında bir hata oluştu' },
      { status: 500 }
    );
  }
}
