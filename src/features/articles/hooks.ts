"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createArticle,
  createComment,
  deleteArticle,
  deleteComment,
  getArticle,
  listArticles,
  listComments,
  updateArticle,
  updateComment,
} from "../../adapter/bbsAdapter";
import type {
  ArticleBrowseState,
  ArticleEditorValues,
  ArticleUpdateValues,
  CommentBrowseState,
  CommentEditorValues,
  CommentUpdateValues,
} from "../../domain/models";

const articleKeys = {
  all: ["articles"] as const,
  lists: () => ["articles", "list"] as const,
  list: (state: ArticleBrowseState) =>
    [
      "articles",
      "list",
      state.mode,
      state.page,
      state.limit,
      state.sort,
      state.search.writer,
      state.search.title,
      state.search.body,
      state.search.titleOrBody,
      state.search.from,
      state.search.to,
    ] as const,
  detail: (articleId: string) => ["articles", "detail", articleId] as const,
};

const commentKeys = {
  all: (articleId: string) => ["comments", articleId] as const,
  list: (articleId: string, state: CommentBrowseState) =>
    ["comments", articleId, "list", state] as const,
};

export const useArticlesQuery = (state: ArticleBrowseState) =>
  useQuery({
    queryKey: articleKeys.list(state),
    queryFn: () => listArticles(state),
  });

export const useArticleDetailQuery = (articleId: string) =>
  useQuery({
    queryKey: articleKeys.detail(articleId),
    queryFn: () => getArticle(articleId),
  });

export const useCreateArticleMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (values: ArticleEditorValues) => createArticle(values),
    onSuccess: (article) => {
      queryClient.setQueryData(articleKeys.detail(article.id), article);
      queryClient.invalidateQueries({ queryKey: articleKeys.lists() });
    },
  });
};

export const useUpdateArticleMutation = (articleId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (values: ArticleUpdateValues) => updateArticle(articleId, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: articleKeys.detail(articleId) });
      queryClient.invalidateQueries({ queryKey: articleKeys.lists() });
    },
  });
};

export const useDeleteArticleMutation = (articleId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (password: string) => deleteArticle(articleId, password),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: articleKeys.detail(articleId) });
      queryClient.invalidateQueries({ queryKey: articleKeys.lists() });
    },
  });
};

export const useCommentsQuery = (
  articleId: string,
  state: CommentBrowseState,
) =>
  useQuery({
    queryKey: commentKeys.list(articleId, state),
    queryFn: () => listComments(articleId, state),
    placeholderData: (previous) => previous,
  });

export const useCreateCommentMutation = (articleId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (values: CommentEditorValues) => createComment(articleId, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: commentKeys.all(articleId) });
    },
  });
};

export const useUpdateCommentMutation = (
  articleId: string,
  commentId: string | null,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (values: CommentUpdateValues) =>
      updateComment(articleId, commentId!, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: commentKeys.all(articleId) });
    },
  });
};

export const useDeleteCommentMutation = (
  articleId: string,
  commentId: string | null,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (password: string) => deleteComment(articleId, commentId!, password),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: commentKeys.all(articleId) });
    },
  });
};
