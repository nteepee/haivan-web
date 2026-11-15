"""Chạy engine combo CŨ (HV_QR_BOOKING app/combo.py, quote()) trên một lưới chuyến giả lập — hoàn toàn local, không mạng.

  python3 scripts/legacy-quote.py <đường dẫn HV_QR_BOOKING> <combo-programs.json> <thư mục lịch CSV> > cases.json

Đầu ra: danh sách ca {program, direction, date, time, line, product, vehicle_seats, seats:[tên ghế], origin, price|null, reason}
để scripts/shadow-rules.ts cho engine luật giá v2 tính lại và so (chạy bóng phase 6, plans/261111-0439-price-rules-engine).
Chỉ đọc mã nguồn HV_QR_BOOKING (import), không ghi gì vào repo đó.
"""

import json
import os
import sys
from datetime import date, timedelta

repo, config_path, schedule_dir = sys.argv[1], sys.argv[2], sys.argv[3]
sys.path.insert(0, repo)
from app.combo import ComboLeg, ComboRules, quote  # noqa: E402

TODAY = date(2026, 11, 11)
# Xe đại diện từng dòng xe (tên hạng xe apigw, số chỗ) — khớp `lines` của chương trình.
VEHICLES = {
    "vt": [("eco", "Luxury", 9), ("luxury", "Luxury", 11), ("royal", "Royal Cabin", 9)],
    "db": [("eco", "Siêu rẻ", 44), ("lux", "Tiết kiệm", 34), ("royal", "Cao cấp", 22)],
}
# Điểm đón agency: 220 = tuyến Quận 1, 1 = tuyến sân bay (ComboSpecial.origins).
ORIGINS = {"vt": [("220", "q1"), ("1", "tsn-t1")], "db": [("", None)]}
DIRECTIONS = {"vt": ["sg-vt", "vt-sg"], "db": ["hn-db", "db-hn"]}

programs = json.load(open(config_path, encoding="utf-8"))["programs"]
cases = []
for raw in programs:
    pid = raw["id"]
    if pid not in VEHICLES:
        continue
    if raw.get("schedule_file"):
        raw = {**raw, "schedule_file": os.path.join(schedule_dir, os.path.basename(raw["schedule_file"]))}
    rules = ComboRules.from_dict(raw)
    for direction in DIRECTIONS[pid]:
        # Từ +2 ngày: quote() đọc đồng hồ thật cho min_minutes_ahead khi ngày đi ≤ 1 ngày; tránh để kết quả không phụ thuộc giờ chạy.
        for offset in range(2, 16):
            day = TODAY + timedelta(days=offset)
            for minutes in range(0, 24 * 60, 30):
                clock = f"{minutes // 60:02d}:{minutes % 60:02d}"
                for line, product, vseats in VEHICLES[pid]:
                    for origin, stop in ORIGINS[pid]:
                        for n in (2, 3, 4):
                            exact = (raw.get("exact_seats") or {}).get(str(n), {}).get(line)
                            names = list(exact) if exact else [str(i) for i in range(3, 3 + n)]
                            leg = ComboLeg(direction=direction, day=day, product=product, seats=n, vehicle_seats=vseats, seat_names=tuple(names), departure_time=clock, origin=origin)
                            found, reason = quote(rules, [leg], TODAY)
                            cases.append({
                                "program": pid, "direction": direction, "date": day.isoformat(), "time": clock, "line": line,
                                "product": product, "vehicle_seats": vseats, "seats": names, "stop": stop,
                                "price": found.total if found else None, "reason": reason,
                            })
json.dump(cases, sys.stdout, ensure_ascii=False)
