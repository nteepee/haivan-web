import { CircleAlert } from "lucide-react";

/** Lỗi 1 câu dưới ô nhập: icon + chữ danger (không chỉ màu), `aria-live` để đọc khi xuất hiện; ô gắn `aria-describedby={id}`. */
export function FieldError({ id, message }: { id: string; message?: string | null }) {
  return (
    <div id={id} aria-live="polite">
      {message ? (
        <p className="hv-err">
          <CircleAlert className="mt-1 size-4 shrink-0" aria-hidden />
          <span>{message}</span>
        </p>
      ) : null}
    </div>
  );
}
