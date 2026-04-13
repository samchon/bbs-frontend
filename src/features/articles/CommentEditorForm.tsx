import { useForm } from "react-hook-form";
import { AttachmentFieldArray } from "../../shared/components/AttachmentFieldArray";
import { Notice } from "../../shared/components/Notice";
import type { AppError, CommentEditorValues, CommentUpdateValues } from "../../domain/models";

type CommentFormValues = CommentEditorValues;

type CreateProps = {
  mode: "create";
  initialValues: CommentEditorValues;
  onSubmit: (values: CommentEditorValues) => Promise<void> | void;
};

type UpdateProps = {
  mode: "update";
  initialValues: CommentUpdateValues;
  onSubmit: (values: CommentUpdateValues) => Promise<void> | void;
};

type CommentEditorFormProps = (CreateProps | UpdateProps) & {
  submitLabel: string;
  busy?: boolean;
  error?: AppError | null;
  successMessage?: string | null;
  showHeader?: boolean;
};

export function CommentEditorForm(props: CommentEditorFormProps) {
  const form = useForm<CommentFormValues>({
    defaultValues:
      props.mode === "create"
        ? props.initialValues
        : {
            writer: "",
            ...props.initialValues,
          },
  });

  const {
    control,
    formState: { errors },
    handleSubmit,
    register,
  } = form;

  return (
    <form
      className="editor-stack"
      onSubmit={handleSubmit(async (values) => {
        if (props.mode === "create") {
          await props.onSubmit(values);
          return;
        }

        const { writer: _writer, ...updateValues } = values;
        await props.onSubmit(updateValues);
      })}
    >
      {props.error ? (
        <Notice title={props.error.title} tone="danger">
          <p>{props.error.message}</p>
          {props.error.details.map((detail) => (
            <p key={detail} className="notice-detail">
              {detail}
            </p>
          ))}
        </Notice>
      ) : null}

      {props.successMessage ? (
        <Notice title="Saved" tone="success">
          <p>{props.successMessage}</p>
        </Notice>
      ) : null}

      <section className="editor-panel">
        {props.showHeader !== false ? (
          <div className="section-header">
            <div>
              <h3>{props.mode === "create" ? "Write a comment" : "Edit comment"}</h3>
              <p>
                {props.mode === "create"
                  ? "Leave a comment for this post."
                  : "Save your changes to make them the newest version of this comment."}
              </p>
            </div>
          </div>
        ) : null}

        <div className="form-grid">
          {props.mode === "create" ? (
            <label>
              <span>Writer</span>
              <input
                {...register("writer", {
                  required: "Writer is required.",
                })}
                placeholder="Your name"
              />
              <small>{errors.writer?.message}</small>
            </label>
          ) : null}

          <label>
            <span>Format</span>
            <select {...register("format")}>
              <option value="txt">Plain text</option>
              <option value="md">Markdown</option>
              <option value="html">HTML</option>
            </select>
          </label>

          <label className="form-grid__full">
            <span>Body</span>
            <textarea
              {...register("body", {
                required: "Body is required.",
              })}
              rows={8}
              placeholder="Write your comment here..."
            />
            <small>{errors.body?.message}</small>
          </label>

          <label>
            <span>Password</span>
            <input
              type="password"
              {...register("password", {
                required: "Password is required.",
              })}
              placeholder="Needed for later edits or deletion"
            />
            <small>{errors.password?.message}</small>
          </label>
        </div>
      </section>

      <AttachmentFieldArray
        control={control}
        register={register}
        errors={errors}
      />

      <div className="form-actions">
        <button type="submit" className="button" disabled={props.busy}>
          {props.busy ? "Working..." : props.submitLabel}
        </button>
      </div>
    </form>
  );
}
