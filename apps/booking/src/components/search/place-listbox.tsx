"use client";

import { MapPin } from "lucide-react";
import { useEffect, type ReactNode } from "react";

/** Một dòng gợi ý của ô chọn điểm; `group` là nhóm tỉnh (nhóm liền kề cùng id được gộp dưới một tiêu đề). */
export interface PlaceOption {
  id: string;
  name: string;
  description?: string;
  group?: { id: string; name: string };
  run: () => void;
}

interface Props {
  id: string;
  label: string;
  options: PlaceOption[];
  /** Chỉ số dòng đang "active" (aria-activedescendant); -1 = chưa có. */
  active: number;
  onActive: (index: number) => void;
}

/** id của dòng thứ `index` (ô nhập trỏ tới đây bằng aria-activedescendant). */
export const optionId = (listId: string, index: number) => `${listId}-o${index}`;

/**
 * Danh sách gợi ý theo mẫu WAI-ARIA listbox: tiêu đề nhóm là `role=presentation` gắn nhãn cho `role=group`,
 * mỗi dòng `role=option` + `aria-selected`. Tiêu điểm luôn ở ô nhập, nên dòng không focus được; chuột chọn bằng click.
 */
export function PlaceListbox({ id, label, options, active, onActive }: Props) {
  // Giữ dòng active trong tầm nhìn khi đi bằng bàn phím (jsdom không có scrollIntoView).
  useEffect(() => {
    if (active >= 0) document.getElementById(optionId(id, active))?.scrollIntoView?.({ block: "nearest" });
  }, [id, active]);

  const renderOption = (option: PlaceOption, index: number) => (
    <div
      key={option.id}
      id={optionId(id, index)}
      role="option"
      aria-selected={index === active}
      // Giữ focus ở ô nhập khi bấm chuột vào dòng.
      onMouseDown={(e) => e.preventDefault()}
      onMouseMove={() => active !== index && onActive(index)}
      onClick={option.run}
      className={`flex min-h-control w-full cursor-pointer items-start gap-2 rounded-1 px-3 py-2 text-left ${index === active ? "bg-accent-soft" : ""}`}
    >
      {option.group ? null : <MapPin className="mt-1 size-4 shrink-0 text-muted" aria-hidden />}
      <span>
        <span className="block font-semibold">{option.name}</span>
        {option.description ? <span className="block text-14 text-muted">{option.description}</span> : null}
      </span>
    </div>
  );

  // Gộp các dòng liền kề cùng nhóm; giữ chỉ số toàn cục để active/aria-activedescendant khớp.
  const blocks: ReactNode[] = [];
  for (let i = 0; i < options.length; ) {
    const group = options[i].group;
    let end = i + 1;
    while (group && end < options.length && options[end].group?.id === group.id) end++;
    const rows = options.slice(i, end).map((o, k) => renderOption(o, i + k));
    blocks.push(
      group ? (
        <div key={`g-${group.id}-${i}`} role="group" aria-labelledby={`${id}-g${group.id}`} className="py-1">
          <p id={`${id}-g${group.id}`} role="presentation" className="px-3 py-1 text-14 font-extrabold text-muted">
            {group.name}
          </p>
          {rows}
        </div>
      ) : (
        rows
      ),
    );
    i = end;
  }

  return (
    <div id={id} role="listbox" aria-label={label}>
      {blocks}
    </div>
  );
}
