import { functional, type IConnection } from "@samchon/bbs-api";
import {
  mapArticleAbridgePage,
  mapArticleDetail,
  mapArticleSummaryPage,
  mapCommentDetail,
  mapCommentPage,
  mergeArticlePages,
  toArticleCreate,
  toArticleRequest,
  toArticleUpdate,
  toCommentCreate,
  toCommentRequest,
  toCommentUpdate,
} from "./mappers";
import { appEnv } from "../config/env";
import type {
  ArticleBrowseState,
  ArticleEditorValues,
  ArticleUpdateValues,
  CommentBrowseState,
  CommentEditorValues,
  CommentUpdateValues,
} from "../domain/models";
import { normalizeError } from "./errors";

const connection: IConnection = {
  host: appEnv.apiHost,
  simulate: appEnv.simulate,
};

const withErrorBoundary = async <T>(runner: () => Promise<T>) => {
  try {
    return await runner();
  } catch (error) {
    throw normalizeError(error);
  }
};

export const listArticles = (state: ArticleBrowseState) =>
  withErrorBoundary(async () => {
    if (state.mode === "abridge") {
      const page = await functional.bbs.articles.abridges(connection, {
        body: toArticleRequest(state),
      });

      return mergeArticlePages(mapArticleAbridgePage(page));
    }

    const page = await functional.bbs.articles.index(connection, {
      body: toArticleRequest(state),
    });

    return mergeArticlePages(mapArticleSummaryPage(page));
  });

export const getArticle = (articleId: string) =>
  withErrorBoundary(async () =>
    mapArticleDetail(
      await functional.bbs.articles.at(connection, { id: articleId }),
    ),
  );

export const createArticle = (values: ArticleEditorValues) =>
  withErrorBoundary(async () =>
    mapArticleDetail(
      await functional.bbs.articles.create(connection, {
        body: toArticleCreate(values),
      }),
    ),
  );

export const updateArticle = (articleId: string, values: ArticleUpdateValues) =>
  withErrorBoundary(async () =>
    functional.bbs.articles.update(connection, {
      id: articleId,
      body: toArticleUpdate(values),
    }),
  );

export const deleteArticle = (articleId: string, password: string) =>
  withErrorBoundary(async () =>
    functional.bbs.articles.erase(connection, {
      id: articleId,
      body: { password },
    }),
  );

export const listComments = (articleId: string, state: CommentBrowseState) =>
  withErrorBoundary(async () =>
    mapCommentPage(
      articleId,
      await functional.bbs.articles.comments.index(connection, {
        articleId,
        body: toCommentRequest(state),
      }),
    ),
  );

export const createComment = (articleId: string, values: CommentEditorValues) =>
  withErrorBoundary(async () =>
    mapCommentDetail(
      articleId,
      await functional.bbs.articles.comments.create(connection, {
        articleId,
        body: toCommentCreate(values),
      }),
    ),
  );

export const updateComment = (
  articleId: string,
  commentId: string,
  values: CommentUpdateValues,
) =>
  withErrorBoundary(async () =>
    functional.bbs.articles.comments.update(connection, {
      articleId,
      id: commentId,
      body: toCommentUpdate(values),
    }),
  );

export const deleteComment = (
  articleId: string,
  commentId: string,
  password: string,
) =>
  withErrorBoundary(async () =>
    functional.bbs.articles.comments.erase(connection, {
      articleId,
      id: commentId,
      body: { password },
    }),
  );
