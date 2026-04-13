import { ArticleDetailPage } from "../../../src/features/articles/ArticleDetailPage";

export default async function ArticleDetailRoute({
  params,
}: {
  params: Promise<{ articleId: string }>;
}) {
  const { articleId } = await params;

  return <ArticleDetailPage articleId={articleId} />;
}
