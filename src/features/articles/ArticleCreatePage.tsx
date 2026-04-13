"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArticleEditorForm } from "./ArticleEditorForm";
import { useCreateArticleMutation } from "./hooks";
import { toAppError } from "../../adapter/errors";
import { defaultArticleEditorValues } from "../../domain/models";

export function ArticleCreatePage() {
  const router = useRouter();
  const createArticleMutation = useCreateArticleMutation();

  return (
    <div className="page-stack">
      <section className="panel page-intro">
        <div>
          <Link href="/" className="back-link">
            Back to posts
          </Link>
          <h2>Write a post</h2>
          <p className="lead">Add a title, write the body, and post it.</p>
        </div>
      </section>

      <section className="panel">
        <ArticleEditorForm
          mode="create"
          initialValues={defaultArticleEditorValues()}
          submitLabel="Post"
          showHeader={false}
          busy={createArticleMutation.isPending}
          error={
            createArticleMutation.error
              ? toAppError(createArticleMutation.error)
              : null
          }
          onSubmit={async (values) => {
            const article = await createArticleMutation.mutateAsync(values);
            router.push(`/articles/${article.id}`);
          }}
        />
      </section>
    </div>
  );
}
