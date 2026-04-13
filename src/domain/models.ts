export type ContentFormat = "txt" | "md" | "html";

export interface PaginationMeta {
  current: number;
  limit: number;
  records: number;
  pages: number;
}

export interface Paginated<T> {
  items: T[];
  pagination: PaginationMeta;
}

export interface Attachment {
  id?: string;
  name: string;
  extension: string | null;
  url: string;
  createdAt?: string;
}

export interface AttachmentDraft {
  name: string;
  extension: string;
  url: string;
}

export interface ArticleSnapshot {
  id: string;
  createdAt: string;
  format: ContentFormat;
  title: string;
  body: string;
  attachments: Attachment[];
}

export interface CommentSnapshot {
  id: string;
  createdAt: string;
  format: ContentFormat;
  body: string;
  attachments: Attachment[];
}

export interface ArticleSummaryCard {
  kind: "summary";
  id: string;
  writer: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface ArticleAbridgeCard {
  kind: "abridge";
  id: string;
  writer: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  format: ContentFormat;
  body: string;
  attachments: Attachment[];
}

export type ArticleListItem = ArticleSummaryCard | ArticleAbridgeCard;

export interface ArticleDetail {
  id: string;
  writer: string;
  createdAt: string;
  latestSnapshot: ArticleSnapshot;
  snapshots: ArticleSnapshot[];
}

export interface CommentDetail {
  id: string;
  articleId: string;
  parentId: string | null;
  writer: string;
  createdAt: string;
  latestSnapshot: CommentSnapshot;
  snapshots: CommentSnapshot[];
}

export type ArticleListMode = "summary" | "abridge";

export type ArticleSortOption =
  | "updated_desc"
  | "updated_asc"
  | "created_desc"
  | "created_asc"
  | "writer_asc"
  | "writer_desc"
  | "title_asc"
  | "title_desc";

export type CommentSortOption =
  | "created_desc"
  | "created_asc"
  | "writer_asc"
  | "writer_desc";

export interface ArticleSearchState {
  writer: string;
  title: string;
  body: string;
  titleOrBody: string;
  from: string;
  to: string;
}

export interface CommentSearchState {
  writer: string;
  body: string;
}

export interface ArticleBrowseState {
  mode: ArticleListMode;
  page: number;
  limit: number;
  sort: ArticleSortOption;
  search: ArticleSearchState;
}

export interface CommentBrowseState {
  page: number;
  limit: number;
  sort: CommentSortOption;
  search: CommentSearchState;
}

export interface ArticleEditorValues {
  writer: string;
  format: ContentFormat;
  title: string;
  body: string;
  password: string;
  attachments: AttachmentDraft[];
}

export interface ArticleUpdateValues {
  format: ContentFormat;
  title: string;
  body: string;
  password: string;
  attachments: AttachmentDraft[];
}

export interface CommentEditorValues {
  writer: string;
  format: ContentFormat;
  body: string;
  password: string;
  attachments: AttachmentDraft[];
}

export interface CommentUpdateValues {
  format: ContentFormat;
  body: string;
  password: string;
  attachments: AttachmentDraft[];
}

export interface AppError {
  title: string;
  message: string;
  details: string[];
  status?: number;
  path?: string;
}

export const emptyArticleSearchState = (): ArticleSearchState => ({
  writer: "",
  title: "",
  body: "",
  titleOrBody: "",
  from: "",
  to: "",
});

export const emptyCommentSearchState = (): CommentSearchState => ({
  writer: "",
  body: "",
});

export const defaultArticleBrowseState = (): ArticleBrowseState => ({
  mode: "abridge",
  page: 1,
  limit: 10,
  sort: "updated_desc",
  search: emptyArticleSearchState(),
});

export const defaultCommentBrowseState = (): CommentBrowseState => ({
  page: 1,
  limit: 5,
  sort: "created_desc",
  search: emptyCommentSearchState(),
});

export const defaultArticleEditorValues = (): ArticleEditorValues => ({
  writer: "",
  format: "md",
  title: "",
  body: "",
  password: "",
  attachments: [],
});

export const defaultCommentEditorValues = (): CommentEditorValues => ({
  writer: "",
  format: "md",
  body: "",
  password: "",
  attachments: [],
});
