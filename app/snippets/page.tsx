
import { getSnippets } from '@/lib/data/snippets';
import SnippetList from '@/components/snippets/SnippetList';
import { getSession } from '@/lib/auth';
import { checkProLicense } from '@/lib/license';
import { redirect } from 'next/navigation';

export default async function SnippetsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  const [resolvedSearchParams, isPro] = await Promise.all([
    searchParams,
    checkProLicense(),
  ]);

  const page = parseInt(resolvedSearchParams.page || '1');
  const limit = parseInt(resolvedSearchParams.limit || '10');
  const search = resolvedSearchParams.search;
  const folderId = resolvedSearchParams.folderId ? parseInt(resolvedSearchParams.folderId) : undefined;
  const categoryId = resolvedSearchParams.categoryId ? parseInt(resolvedSearchParams.categoryId) : undefined;

  const data = await getSnippets({
    page,
    limit,
    search,
    folderId,
    categoryId,
  });

  return (
    <SnippetList
      initialSnippets={data.snippets}
      totalPages={data.totalPages}
      currentPage={data.currentPage}
      searchParams={resolvedSearchParams}
      isPro={isPro}
    />
  );
}