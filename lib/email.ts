import { prisma } from './prisma';

export interface EmailOptions {
    to: string;
    templateName: string;
    variables: Record<string, string>;
}

export class EmailService {
    /**
     * MOCK: In a real app, this would use nodemailer, SendGrid, etc.
     * For now, it logs the email to the console and audit logs.
     */
    static async send(options: EmailOptions) {
        const { to, templateName, variables } = options;
        const siteUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

        const allVariables = {
            site_url: siteUrl,
            login_url: `${siteUrl}/login`,
            ...variables
        };

        try {
            // Find the template
            const template = await prisma.emailTemplate.findUnique({
                where: { name: templateName }
            });

            if (!template) {
                throw new Error(`Email template '${templateName}' not found.`);
            }

            // Render content and subject
            let renderedContent = template.content;
            let renderedSubject = template.subject;

            Object.entries(allVariables).forEach(([key, value]) => {
                const regex = new RegExp(`{{(user\\.|snippet\\.|system\\.)?${key}}}`, 'g');
                renderedContent = renderedContent.replace(regex, String(value));
                renderedSubject = renderedSubject.replace(regex, String(value));
            });

            console.log('--- MOCK EMAIL SENT ---');
            console.log(`To: ${to}`);
            console.log(`Subject: ${renderedSubject}`);
            console.log(`Content:\n${renderedContent}`);
            console.log('-----------------------');

            return {
                success: true,
                message: 'Email successfully sent (Mock)',
                renderedSubject,
                renderedContent
            };
        } catch (error: any) {
            console.error('Email sending failed:', error);
            throw error;
        }
    }

    /**
     * Seed default templates if they don't exist
     */
    static async seedTemplates() {
        const defaultTemplates = [
            {
                name: 'password_reset',
                subject: 'Kapitto Şifre Sıfırlama İstediği',
                context: 'USER',
                content: `Merhaba {{name}},\n\nHesabınız için şifre sıfırlama talebinde bulunuldu. Şifrenizi sıfırlamak için aşağıdaki bağlantıyı kullanabilirsiniz:\n\n{{reset_link}}\n\nEğer bu talebi siz yapmadıysanız, bu e-postayı görmezden gelebilirsiniz.\n\nTeşekkürler,\nKapitto Ekibi`
            }
        ];

        for (const t of defaultTemplates) {
            await prisma.emailTemplate.upsert({
                where: { name: t.name },
                update: {},
                create: t
            });
        }
    }
}
