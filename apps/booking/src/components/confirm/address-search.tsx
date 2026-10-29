"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useId, useState } from "react";
import { z } from "zod";
import { apigw } from "@/lib/http";

const results = z.looseObject({ data: z.array(z.looseObject({ place_id: z.string().optional(), name: z.string(), description: z.string().optional(), location: z.looseObject({ lat: z.number(), lng: z.number() }).optional() })).optional() });
const detail = z.looseObject({ data: z.looseObject({ location: z.looseObject({ lat: z.number(), lng: z.number() }) }) });

export interface PickedAddress {
  address: string;
  lat: number;
  lng: number;
}

/** Ô địa chỉ dịch vụ tận nhà: `api/maps/places` (>3 ký tự, debounce 500 ms) → `maps/places/detail` như web cũ. */
export function AddressSearch({ value, onPick, placeholder }: { value: string; onPick: (a: PickedAddress) => void; placeholder: string }) {
  const [text, setText] = useState(value);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const listId = useId();

  useEffect(() => {
    const timer = setTimeout(() => setQuery(text.trim().length > 3 && text !== value ? text.trim() : ""), 500);
    return () => clearTimeout(timer);
  }, [text, value]);

  const search = useQuery({
    queryKey: ["maps-places", query],
    enabled: query.length > 3,
    queryFn: () => apigw("maps/places", { query: { input: query, channel: "WEBHAIVAN" }, schema: results }),
  });

  const pick = async (item: NonNullable<z.infer<typeof results>["data"]>[number]) => {
    let loc = item.location;
    if (!loc && item.place_id) loc = (await apigw("maps/places/detail", { query: { place_id: item.place_id, channel: "WEBHAIVAN" }, schema: detail }).catch(() => null))?.data.location;
    if (!loc) return;
    const address = item.description || item.name;
    setText(address);
    setOpen(false);
    onPick({ address, lat: loc.lat, lng: loc.lng });
  };

  return (
    <div className="relative">
      <input
        value={text}
        placeholder={placeholder}
        onChange={(e) => {
          setText(e.target.value);
          setOpen(true);
        }}
        aria-label={placeholder}
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        autoComplete="off"
        className="hv-field"
      />
      {open && search.data?.data?.length ? (
        <ul id={listId} className="absolute z-(--z-dropdown) mt-1 max-h-[calc(var(--s-24)*2)] w-full overflow-y-auto rounded-2 bg-surface shadow-2">
          {search.data.data.map((item) => (
            <li key={(item.place_id ?? "") + item.name}>
              <button type="button" onClick={() => void pick(item)} className="block min-h-control w-full px-3 py-2 text-left hover:bg-accent-soft focus-visible:-outline-offset-2">
                <span className="block font-semibold">{item.name}</span>
                {item.description ? <span className="block text-14 text-muted">{item.description}</span> : null}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
