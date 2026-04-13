import DOMPurify from "dompurify";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { ContentFormat } from "../../domain/models";

export function RichContent({
  format,
  value,
}: {
  format: ContentFormat;
  value: string;
}) {
  if (format === "txt") {
    return <pre className="plain-copy">{value}</pre>;
  }

  if (format === "html") {
    const sanitized = DOMPurify.sanitize(value, {
      USE_PROFILES: { html: true },
    });

    return (
      <div
        className="rich-copy"
        dangerouslySetInnerHTML={{ __html: sanitized }}
      />
    );
  }

  return (
    <div className="rich-copy">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{value}</ReactMarkdown>
    </div>
  );
}
