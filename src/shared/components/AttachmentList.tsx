export function AttachmentList({
  attachments,
}: {
  attachments: Array<{
    name: string;
    extension: string | null;
    url: string;
  }>;
}) {
  if (attachments.length === 0) {
    return <p className="muted">No linked files.</p>;
  }

  return (
    <section className="attachment-list">
      <h3>Linked files</h3>
      <ul className="stack-list">
        {attachments.map((attachment) => (
          <li key={attachment.url} className="attachment-list__item">
            <div>
              <strong>{attachment.name}</strong>
              <p className="muted">
                {attachment.extension ? `.${attachment.extension}` : "No extension"}
              </p>
            </div>
            <a href={attachment.url} target="_blank" rel="noreferrer">
              Open
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
