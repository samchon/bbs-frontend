import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AppShell } from "../shared/components/AppShell";
import { ArticleExplorerPage } from "../features/articles/ArticleExplorerPage";
import { ArticleCreatePage } from "../features/articles/ArticleCreatePage";
import { ArticleDetailPage } from "../features/articles/ArticleDetailPage";

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<ArticleExplorerPage />} />
          <Route path="/articles/new" element={<ArticleCreatePage />} />
          <Route path="/articles/:articleId" element={<ArticleDetailPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
