'use client';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import NavLayout from '@/components/NavLayout';
import SnippetFormModal from '@/components/SnippetFormModal';

export default function EditSnippetPage() {
    const params = useParams();
    const router = useRouter();
    const [snippet, setSnippet] = useState(null);

    useEffect(() => {
        // API'den snippet verisini çekme işlemi (önceki mesajdaki gibi)
        fetch(`/api/snippets/${params.id}`).then(res => res.json()).then(data => setSnippet(data));
    }, [params.id]);

    if (!snippet) return <div className="p-10 text-center">Yükleniyor...</div>;

    return (
        <NavLayout>
            <div className="p-6">
                <div className="max-w-5xl mx-auto">
                    {/* isPage={true} sayesinde modal gibi değil, normal bir panel gibi görünür */}
                    <SnippetFormModal
                        isOpen={true}
                        onClose={() => router.push('/snippets')}
                        snippet={snippet}
                        isPage={true}
                    />
                </div>
            </div>
        </NavLayout>
    );
}