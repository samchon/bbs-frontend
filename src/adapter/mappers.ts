import type { IBbsArticle } from "@samchon/bbs-api/lib/structures/bbs/IBbsArticle";
import type { IBbsArticleComment } from "@samchon/bbs-api/lib/structures/bbs/IBbsArticleComment";
import type { IAttachmentFile } from "@samchon/bbs-api/lib/structures/common/IAttachmentFile";
import type { IPage } from "@samchon/bbs-api/lib/structures/common/IPage";
import type {
  ArticleAbridgeCard,
  ArticleBrowseState,
  ArticleDetail,
  ArticleEditorValues,
  ArticleListItem,
  ArticleSortOption,
  ArticleSummaryCard,
  ArticleUpdateValues,
  Attachment,
  CommentBrowseState,
  CommentDetail,
  CommentEditorValues,
  CommentSortOption,
  CommentUpdateValues,
  Paginated,
} from "../domain/models";

const mapAttachment = (
  input: IAttachmentFile | IAttachmentFile.ICreate,
): Attachment => ({
  id: "id" in input ? input.id : undefined,
  name: input.name,
  extension: input.extension,
  url: input.url,
  createdAt: "created_at" in input ? input.created_at : undefined,
});

const mapPagination = (pagination: IPage.IPagination) => ({
  current: pagination.current,
  limit: pagination.limit,
  records: pagination.records,
  pages: pagination.pages,
});

const mapArticleSnapshot = (snapshot: IBbsArticle.ISnapshot) => ({
  id: snapshot.id,
  createdAt: snapshot.created_at,
  format: snapshot.format,
  title: snapshot.title,
  body: snapshot.body,
  attachments: snapshot.files.map(mapAttachment),
});

const mapCommentSnapshot = (snapshot: IBbsArticleComment.ISnapshot) => ({
  id: snapshot.id,
  createdAt: snapshot.created_at,
  format: snapshot.format,
  body: snapshot.body,
  attachments: snapshot.files.map(mapAttachment),
});

export const mapArticleSummaryPage = (
  page: IPage<IBbsArticle.ISummary>,
): Paginated<ArticleSummaryCard> => ({
  items: page.data.map((article) => ({
    kind: "summary",
    id: article.id,
    writer: article.writer,
    title: article.title,
    createdAt: article.created_at,
    updatedAt: article.updated_at,
  })),
  pagination: mapPagination(page.pagination),
});

export const mapArticleAbridgePage = (
  page: IPage<IBbsArticle.IAbridge>,
): Paginated<ArticleAbridgeCard> => ({
  items: page.data.map((article) => ({
    kind: "abridge",
    id: article.id,
    writer: article.writer,
    title: article.title,
    createdAt: article.created_at,
    updatedAt: article.updated_at,
    format: article.format,
    body: article.body,
    attachments: article.files.map(mapAttachment),
  })),
  pagination: mapPagination(page.pagination),
});

export const mapArticleDetail = (article: IBbsArticle): ArticleDetail => {
  const snapshots = article.snapshots.map(mapArticleSnapshot);
  const latestSnapshot = snapshots.at(-1);

  if (!latestSnapshot) {
    throw new Error("Article snapshots were unexpectedly empty.");
  }

  return {
    id: article.id,
    writer: article.writer,
    createdAt: article.created_at,
    latestSnapshot,
    snapshots: [...snapshots].reverse(),
  };
};

export const mapCommentPage = (
  articleId: string,
  page: IPage<IBbsArticleComment>,
): Paginated<CommentDetail> => ({
  items: page.data.map((comment) => mapCommentDetail(articleId, comment)),
  pagination: mapPagination(page.pagination),
});

export const mapCommentDetail = (
  articleId: string,
  comment: IBbsArticleComment,
): CommentDetail => {
  const snapshots = comment.snapshots.map(mapCommentSnapshot);
  const latestSnapshot = snapshots.at(-1);

  if (!latestSnapshot) {
    throw new Error("Comment snapshots were unexpectedly empty.");
  }

  return {
    id: comment.id,
    articleId,
    parentId: comment.parent_id,
    writer: comment.writer,
    createdAt: comment.created_at,
    latestSnapshot,
    snapshots: [...snapshots].reverse(),
  };
};

const articleSortMap: Record<ArticleSortOption, IBbsArticle.IRequest["sort"]> = {
  updated_desc: ["-updated_at"],
  updated_asc: ["+updated_at"],
  created_desc: ["-created_at"],
  created_asc: ["+created_at"],
  writer_asc: ["+writer"],
  writer_desc: ["-writer"],
  title_asc: ["+title"],
  title_desc: ["-title"],
};

const commentSortMap: Record<
  CommentSortOption,
  IBbsArticleComment.IRequest["sort"]
> = {
  created_desc: ["-created_at"],
  created_asc: ["+created_at"],
  writer_asc: ["+writer"],
  writer_desc: ["-writer"],
};

export const toArticleRequest = (
  state: ArticleBrowseState,
): IBbsArticle.IRequest => ({
  page: state.page,
  limit: state.limit,
  sort: articleSortMap[state.sort],
  search: {
    writer: state.search.writer || undefined,
    title: state.search.title || undefined,
    body: state.search.body || undefined,
    title_or_body: state.search.titleOrBody || undefined,
    from: state.search.from || undefined,
    to: state.search.to || undefined,
  },
});

export const toCommentRequest = (
  state: CommentBrowseState,
): IBbsArticleComment.IRequest => ({
  page: state.page,
  limit: state.limit,
  sort: commentSortMap[state.sort],
  search: {
    writer: state.search.writer || undefined,
    body: state.search.body || undefined,
  },
});

const toAttachmentCreates = (
  attachments: { name: string; extension: string; url: string }[],
): IAttachmentFile.ICreate[] =>
  attachments
    .filter((attachment) => attachment.name || attachment.url)
    .map((attachment) => ({
      name: attachment.name.trim(),
      extension: attachment.extension.trim() || null,
      url: attachment.url.trim(),
    }));

export const toArticleCreate = (
  values: ArticleEditorValues,
): IBbsArticle.ICreate => ({
  writer: values.writer.trim(),
  format: values.format,
  title: values.title.trim(),
  body: values.body,
  password: values.password,
  files: toAttachmentCreates(values.attachments),
});

export const toArticleUpdate = (
  values: ArticleUpdateValues,
): IBbsArticle.IUpdate => ({
  format: values.format,
  title: values.title.trim(),
  body: values.body,
  password: values.password,
  files: toAttachmentCreates(values.attachments),
});

export const toCommentCreate = (
  values: CommentEditorValues,
): IBbsArticleComment.ICreate => ({
  writer: values.writer.trim(),
  format: values.format,
  body: values.body,
  password: values.password,
  files: toAttachmentCreates(values.attachments),
});

export const toCommentUpdate = (
  values: CommentUpdateValues,
): IBbsArticleComment.IUpdate => ({
  format: values.format,
  body: values.body,
  password: values.password,
  files: toAttachmentCreates(values.attachments),
});

export const mergeArticlePages = (
  page: Paginated<ArticleSummaryCard> | Paginated<ArticleAbridgeCard>,
): Paginated<ArticleListItem> => ({
  items: page.items,
  pagination: page.pagination,
});
