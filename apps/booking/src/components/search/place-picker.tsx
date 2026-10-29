"use client";

import { useQuery } from "@tanstack/react-query";
import { MapPin } from "lucide-react";
import { useEffect, useId, useMemo, useState, type KeyboardEvent, type Ref } from "react";
import { z } from "zod";
import { FieldError } from "@/components/ui/field-error";
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover";
import { usePlaces } from "@/hooks/use-trips";
import { apigw } from "@/lib/http";
import type { SearchPoint } from "@/lib/search-url";
import { optionId, PlaceListbox, type PlaceOption } from "./place-listbox";

const googleResults = z.looseObject({ data: z.array(z.looseObject({ place_id: z.string().optional(), name: z.string(), description: z.string().optional(), location: z.looseObject({ lat: z.number(), lng: z.number() }).optional() })).optional() });
const googleDetail = z.looseObject({ data: z.looseObject({ location: z.looseObject({ lat: z.number(), lng: z.number() }) }) });

interface Props {
  label: string;
  placeholder: string;
  value: SearchPoint | null;
  onChange: (point: SearchPoint) => void;
  /** Lỗi dưới ô (thiếu điểm); cha dùng `inputRef` để focus ô sai. */
  error?: string;
  inputRef?: Ref<HTMLInputElement>;
}

/**
 * Chọn điểm (cha đổi `key` khi giá trị đổi từ ngoài để reset ô nhập): danh sách nhóm tỉnh `api/places?type=0`; gõ > 3 ký tự →
 * `api/maps/places` (channel WEBHAIVAN) như web cũ. Mẫu WAI-ARIA combobox: tiêu điểm ở ô nhập, ↑ ↓ Home End đổi dòng, Enter chọn, Esc đóng.
 */
export function PlacePicker({ label, placeholder, value, onChange, error, inputRef }: Props) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState(value?.name ?? "");
  const [query, setQuery] = useState("");
  // Dòng đang trỏ bằng bàn phím/chuột (aria-activedescendant); -1 = chưa trỏ dòng nào.
  const [active, setActive] = useState(-1);
  const places = usePlaces(0);
  const listId = useId();
  const errorId = `${listId}-err`;

  useEffect(() => {
    const timer = setTimeout(() => setQuery(text.trim().length > 3 && text !== value?.name ? text.trim() : ""), 500);
    return () => clearTimeout(timer);
  }, [text, value?.name]);

  const google = useQuery({
    queryKey: ["maps-places", query],
    enabled: query.length > 3,
    queryFn: () => apigw("maps/places", { query: { input: query, channel: "WEBHAIVAN" }, schema: googleResults }),
  });

  const groups = useMemo(() => {
    const needle = text.trim().toLowerCase();
    return (places.data ?? [])
      .map((g) => ({ ...g, places: needle && text !== value?.name ? g.places.filter((p) => `${g.name} ${p.name}`.toLowerCase().includes(needle)) : g.places }))
      .filter((g) => g.places.length);
  }, [places.data, text, value?.name]);

  const pick = (point: SearchPoint) => {
    onChange(point);
    setText(point.name);
    setOpen(false);
    setActive(-1);
  };

  const pickGoogle = async (item: z.infer<typeof googleResults>["data"] extends (infer T)[] | undefined ? T : never) => {
    let loc = item.location;
    if (!loc && item.place_id) {
      const detail = await apigw("maps/places/detail", { query: { place_id: item.place_id, channel: "WEBHAIVAN" }, schema: googleDetail }).catch(() => null);
      loc = detail?.data.location;
    }
    if (loc) pick({ name: item.name, lat: loc.lat, lng: loc.lng });
  };

  // Một danh sách phẳng (gợi ý Google trước, rồi nhóm tỉnh) để chỉ số active dùng chung cho bàn phím và chuột.
  const buildOptions = (): PlaceOption[] => {
    const fromGoogle = (google.data?.data ?? []).map<PlaceOption>((item) => ({
      id: `g-${item.place_id ?? ""}${item.name}`,
      name: item.name,
      description: item.description,
      run: () => void pickGoogle(item),
    }));
    const fromGroups = groups.flatMap((g) =>
      g.places.map<PlaceOption>((p) => ({
        id: `p-${p.id}`,
        name: p.name,
        group: { id: String(g.id), name: g.name },
        run: () => p.lat !== null && p.lng !== null && pick({ name: p.name, lat: Number(p.lat), lng: Number(p.lng) }),
      })),
    );
    return [...fromGoogle, ...fromGroups];
  };
  const options = buildOptions();

  const move = (to: number) => {
    setOpen(true);
    setActive(to);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    const last = options.length - 1;
    switch (e.key) {
      case "ArrowDown":
        if (last < 0) return;
        e.preventDefault();
        return move(open ? (active >= last ? 0 : active + 1) : 0);
      case "ArrowUp":
        if (last < 0) return;
        e.preventDefault();
        return move(open ? (active <= 0 ? last : active - 1) : last);
      // Home/End chỉ điều khiển danh sách khi đang trỏ một dòng; còn lại giữ nguyên việc dời con trỏ trong ô nhập.
      case "Home":
        if (!open || active < 0) return;
        e.preventDefault();
        return setActive(0);
      case "End":
        if (!open || active < 0) return;
        e.preventDefault();
        return setActive(last);
      case "Enter":
        // Có dòng đang trỏ → chọn dòng đó và không gửi form; chưa trỏ → để Enter gửi form như thường.
        if (!open || active < 0 || !options[active]) return;
        e.preventDefault();
        return options[active].run();
      case "Escape":
        if (!open) return;
        e.preventDefault();
        setOpen(false);
        return setActive(-1);
    }
  };

  const expanded = open && options.length > 0;
  return (
    <Popover open={expanded} onOpenChange={(o) => { setOpen(o); if (!o) setActive(-1); }}>
      <div className="min-w-0">
        <label className="block">
          <span className="hv-label">{label}</span>
          <span className="relative flex items-center">
            <MapPin className="pointer-events-none absolute left-3 size-icon text-muted" aria-hidden />
            <PopoverAnchor asChild>
              <input
                value={text}
                placeholder={placeholder}
                onFocus={() => setOpen(true)}
                onClick={() => setOpen(true)}
                onChange={(e) => {
                  setText(e.target.value);
                  setActive(-1);
                  setOpen(true);
                }}
                onKeyDown={onKeyDown}
                ref={inputRef}
                autoComplete="off"
                className="hv-field pl-12"
                role="combobox"
                aria-autocomplete="list"
                aria-expanded={expanded}
                aria-controls={listId}
                aria-activedescendant={expanded && active >= 0 ? optionId(listId, active) : undefined}
                aria-invalid={error ? true : undefined}
                aria-describedby={errorId}
              />
            </PopoverAnchor>
          </span>
        </label>
        <FieldError id={errorId} message={error} />
      </div>
      <PopoverContent align="start" className="max-h-80 w-96 max-w-[calc(100vw-2*var(--gutter))] overflow-y-auto p-2" onOpenAutoFocus={(e) => e.preventDefault()}>
        <PlaceListbox id={listId} label={label} options={options} active={active} onActive={setActive} />
      </PopoverContent>
    </Popover>
  );
}
