"use client";

export function DeleteButton({
  action,
  id,
  confirmText,
  formId,
}: {
  action: (formData: FormData) => void;
  id: string;
  confirmText: string;
  formId?: string;
}) {
  const button = (
    <button
      type="submit"
      form={formId}
      className="text-sm font-medium text-red-600 hover:text-red-700"
      onClick={(event) => {
        if (!window.confirm(confirmText)) event.preventDefault();
      }}
    >
      Delete
    </button>
  );

  if (formId) return button;

  return (
    <form action={action} className="inline">
      <input type="hidden" name="id" value={id} />
      {button}
    </form>
  );
}
