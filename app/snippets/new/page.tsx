'use client';

import { useRouter } from 'next/navigation';
import NavLayout from '@/components/NavLayout';
import SnippetFormModal from '@/components/SnippetFormModal';

export default function NewSnippetPage() {
    const router = useRouter();

    return (
        <NavLayout>
            <div className="p-6">
                <div className="max-w mx-auto">
                    <SnippetFormModal
                        isOpen={true}
                        onClose={() => router.push('/snippets')}
                        isPage={true} // Modal efektini kaldırır, sayfaya gömer
                        // snippet prop'u göndermiyoruz, böylece "Yeni Kayıt" modunda açılır
                    />
                </div>
            </div>
        </NavLayout>
    );
}