"use client";

const buttonClass =
  "inline-flex items-center justify-center rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50";

export function DeleteButton({
  action,
  id,
  confirmText,
  formId,
  className,
}: {
  action: (formData: FormData) => void;
  id: string;
  confirmText: string;
  formId?: string;
  className?: string;
}) {
  const button = (
    <button
      type="submit"
      form={formId}
      className={className ?? buttonClass}
      onClick={(event) => {
        if (!window.confirm(confirmText)) event.preventDefault();
      }}
    >
      Delete
    </button>
  );

  if (formId) return button;

  return (
    <form action={action} className="inline-flex">
      <input type="hidden" name="id" value={id} />
      {button}
    </form>
  );
}
