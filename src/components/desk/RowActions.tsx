import Link from "next/link";
import { DeleteButton } from "@/components/desk/DeleteButton";

const item = "inline-flex items-center justify-center rounded-md px-2.5 py-1.5 text-xs font-semibold";

export function RowActions({
  viewHref,
  pdfHref,
  action,
  id,
  confirmText,
}: {
  viewHref: string;
  pdfHref: string;
  action: (formData: FormData) => void;
  id: string;
  confirmText: string;
}) {
  return (
    <div className="inline-flex items-center gap-0.5 rounded-lg border border-gray-200 bg-gray-50 p-0.5">
      <Link href={viewHref} className={`${item} text-gray-700 hover:bg-white`}>
        View
      </Link>
      <Link href={pdfHref} className={`${item} text-brand-500 hover:bg-white`}>
        PDF
      </Link>
      <DeleteButton action={action} id={id} confirmText={confirmText} className={`${item} text-red-600 hover:bg-red-50`} />
    </div>
  );
}

export function PaperActions({
  pdfHref,
  action,
  id,
  confirmText,
}: {
  pdfHref: string;
  action: (formData: FormData) => void;
  id: string;
  confirmText: string;
}) {
  return (
    <div className="inline-flex items-center gap-0.5 rounded-lg border border-gray-200 bg-gray-50 p-0.5">
      <Link href={pdfHref} className="inline-flex items-center justify-center rounded-md px-3 py-2 text-sm font-semibold text-brand-500 hover:bg-white">
        PDF
      </Link>
      <DeleteButton
        action={action}
        id={id}
        confirmText={confirmText}
        className="inline-flex items-center justify-center rounded-md px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
      />
    </div>
  );
}
