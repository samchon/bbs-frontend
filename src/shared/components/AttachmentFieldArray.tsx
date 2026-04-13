"use client";

import { useFieldArray } from "react-hook-form";

export function AttachmentFieldArray({
  control,
  register,
  errors,
}: {
  control: any;
  register: any;
  errors?: any;
}) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "attachments",
  });

  return (
    <section className="editor-panel">
      <div className="section-header">
        <div>
          <h3>Linked files</h3>
          <p>Add links only when this post or comment should point somewhere else.</p>
        </div>
        <button
          type="button"
          className="button button--ghost"
          onClick={() => append({ name: "", extension: "", url: "" })}
        >
          Add link
        </button>
      </div>

      {fields.length === 0 ? (
        <p className="muted">No linked files yet.</p>
      ) : null}

      <div className="attachment-grid">
        {fields.map((field, index) => (
          <div key={field.id} className="attachment-row">
            <label>
              <span>Name</span>
              <input
                {...register(`attachments.${index}.name`, {
                  required: "Attachment name is required.",
                })}
                placeholder="File name"
              />
              <small>{(errors?.attachments as any)?.[index]?.name?.message as string}</small>
            </label>
            <label>
              <span>Extension</span>
              <input
                {...register(`attachments.${index}.extension`)}
                placeholder="pdf"
              />
            </label>
            <label>
              <span>URL</span>
              <input
                {...register(`attachments.${index}.url`, {
                  required: "Attachment URL is required.",
                })}
                placeholder="https://example.com/file.pdf"
              />
              <small>{(errors?.attachments as any)?.[index]?.url?.message as string}</small>
            </label>
            <button
              type="button"
              className="button button--ghost"
              onClick={() => remove(index)}
            >
              Remove
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
