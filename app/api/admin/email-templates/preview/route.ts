import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

export async function POST(req: NextRequest) {
    try {
        const session = await getSession();
        if (!session || session.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { content, subject, context } = await req.json();

        const siteUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

        // Sample data based on context
        const sampleData: Record<string, any> = {
            USER: {
                name: 'Demo Kullanıcı',
                email: 'demo@example.com',
                reset_link: `${siteUrl}/auth/reset-password?token=demo`,
                role: 'user'
            },
            SNIPPET: {
                title: 'Harika Kod Parçası',
                author: 'John Doe',
                language: 'JavaScript',
                link: `${siteUrl}/snippets/1`
            },
            SYSTEM: {
                site_name: 'Kapitto',
                admin_name: 'Sistem Yöneticisi',
                update_date: new Date().toLocaleDateString()
            }
        };

        const globalVariables = {
            site_url: siteUrl,
            login_url: `${siteUrl}/login`,
            dashboard_url: `${siteUrl}/snippets`
        };

        const data = { ...globalVariables, ...(sampleData[context] || sampleData.SYSTEM) };

        let renderedContent = content;
        let renderedSubject = subject;

        // Rendering simulation
        Object.entries(data).forEach(([key, value]) => {
            const regex = new RegExp(`{{${key}}}`, 'g');
            renderedContent = renderedContent.replace(regex, String(value));
            renderedSubject = renderedSubject.replace(regex, String(value));
        });

        return NextResponse.json({
            subject: renderedSubject,
            content: renderedContent
        });
    } catch (error) {
        return NextResponse.json({ error: 'Preview failed' }, { status: 500 });
    }
}
