import json
from pathlib import Path

HERE = Path(__file__).resolve().parent
raw_path = HERE / "ocm_finland_raw.json"
out_path = HERE / "chargers_normalized.json"

raw = json.loads(raw_path.read_text(encoding="utf-8"))

out = []
next_id = 1

def pick_power_kw(poi: dict):
    # OCM: Connections is list; power can be PowerKW or Amps/Voltage.
    conns = poi.get("Connections") or []
    best = None
    for c in conns:
        kw = c.get("PowerKW")
        if kw is None:
            # Fallback: kW ~= (Volts * Amps)/1000, if present
            v = c.get("Voltage")
            a = c.get("Amps")
            if v and a:
                kw = (v * a) / 1000.0
        if kw is not None:
            try:
                kw = float(kw)
            except Exception:
                continue
            best = kw if best is None else max(best, kw)
    return int(round(best)) if best is not None else None

for poi in raw:
    addr = poi.get("AddressInfo") or {}
    # Filter: keep only Finland results (safety)
    country = (addr.get("Country") or {}).get("ISOCode")
    if country and country != "FI":
        continue

    name = addr.get("Title") or "Unknown"
    city = addr.get("Town") or addr.get("StateOrProvince") or ""
    lat = addr.get("Latitude")
    lon = addr.get("Longitude")
    if lat is None or lon is None:
        continue

    operator = (poi.get("OperatorInfo") or {}).get("Title") or "Unknown"
    power_kw = pick_power_kw(poi)

    out.append({
        "id": next_id,
        "name": name,
        "operator": operator,
        "city": city,
        "lat": float(lat),
        "lon": float(lon),
        "powerKw": power_kw
    })
    next_id += 1

out_path.write_text(json.dumps(out, ensure_ascii=False, indent=2), encoding="utf-8")

print(f"OK: wrote {len(out)} locations to {out_path}")
