import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import iconUrl from 'leaflet/dist/images/marker-icon.png'
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png'
import shadowUrl from 'leaflet/dist/images/marker-shadow.png'

L.Icon.Default.mergeOptions({
    iconUrl,
    iconRetinaUrl,
    shadowUrl,
})

// Backendin portti Swaggerista (sinulla 7151)
const API_BASE = 'https://localhost:7151'

const OPERATOR_COLORS = {
    Tesla: '#e82127',
    Neste: '#006341',
    'K-Lataus': '#0033a0',
    ABC: '#ffd200',
    Lidl: '#0050aa',
}

function getColor(op) {
    if (!op) return '#888'
    const s = op.toLowerCase()

    if (s.includes('tesla')) return OPERATOR_COLORS.Tesla
    if (s.includes('neste')) return OPERATOR_COLORS.Neste
    if (s.includes('k-lataus') || s.includes('k lataus')) return OPERATOR_COLORS['K-Lataus']
    if (s.includes('abc')) return OPERATOR_COLORS.ABC
    if (s.includes('lidl')) return OPERATOR_COLORS.Lidl

    return '#888'
}

function Legend() {
    const map = useMap()

    useEffect(() => {
        const legend = L.control({ position: 'bottomright' })

        legend.onAdd = () => {
            const div = L.DomUtil.create('div', 'leaflet-legend')

            // Estä kartan drag/zoom kun klikkaat legendaa
            L.DomEvent.disableClickPropagation(div)
            L.DomEvent.disableScrollPropagation(div)

            const items = [
                ...Object.entries(OPERATOR_COLORS).map(([name, color]) => {
                    return `
      <div style="display:flex;align-items:center;gap:8px;margin:4px 0;">
        <span style="width:10px;height:10px;border-radius:50%;background:${color};display:inline-block;"></span>
        <span style="font-size:12px;">${name}</span>
      </div>
    `
                }),
                `
    <div style="display:flex;align-items:center;gap:8px;margin:4px 0;">
      <span style="width:10px;height:10px;border-radius:50%;background:#888;display:inline-block;"></span>
      <span style="font-size:12px;">Muut</span>
    </div>
  `
            ].join('')


            div.innerHTML = `
        <div style="font-weight:700;margin-bottom:6px;font-size:12px;">Operaattorit</div>
        ${items}
      `
            return div
        }

        legend.addTo(map)

        return () => {
            legend.remove()
        }
    }, [map])

    return null
}

function FitBounds({ locations }) {
    const map = useMap()

    useEffect(() => {
        if (!locations || locations.length === 0) return

        // Rakennetaan bounds kaikista pisteistä
        const bounds = L.latLngBounds(
            locations.map((l) => L.latLng(l.lat, l.lon))
        )

        // Jos bounds on järjetön, älä tee mitään
        if (!bounds.isValid()) return

        map.fitBounds(bounds, {
            padding: [40, 40], // jättää vähän “ilmaa” reunoille
            maxZoom: 12,       // ettei zoomaa liian lähelle jos pisteitä vähän
            animate: true,
        })
    }, [map, locations])

    return null
}


// Topbarin korkeus (pidä sama sekä topbarissa että mapin top-offsetissa)
const TOPBAR_H = 56

export default function MapView() {
    const [locations, setLocations] = useState([])
    const [error, setError] = useState('')
    const [minPowerKw, setMinPowerKw] = useState('')
    const [operator, setOperator] = useState('')
    const [operators, setOperators] = useState([])
    const [powers, setPowers] = useState([])
    const [includeUnknown, setIncludeUnknown] = useState(true)


    useEffect(() => {
        async function loadOperators() {
            try {
                const res = await fetch(`${API_BASE}/api/Locations/operators`)
                if (!res.ok) throw new Error('Failed to load operators')
                const data = await res.json()
                setOperators(data)
            } catch (e) {
                console.error(e)
            }
        }
        loadOperators()
    }, [])

    useEffect(() => {
        async function loadPowers() {
            try {
                const res = await fetch(`${API_BASE}/api/Locations/powers`)
                if (!res.ok) throw new Error('Failed to load powers')
                const data = await res.json()
                setPowers(data)
            } catch (e) {
                console.error(e)
            }
        }
        loadPowers()
    }, [])

    useEffect(() => {
        async function load() {
            try {
                setError('')

                const params = new URLSearchParams()
                params.set('limit', '500')

                if (minPowerKw) params.set('minPowerKw', minPowerKw)
                if (operator) params.set('operator', operator)
                if (includeUnknown) params.set('includeUnknown', 'true')


                const url = `${API_BASE}/api/Locations?${params.toString()}`
                console.log('FETCH URL:', url)

                const res = await fetch(url)
                if (!res.ok) throw new Error(`API error ${res.status}`)

                const data = await res.json()
                setLocations(data)
            } catch (e) {
                setError(e?.message ?? 'Unknown error')
            }
        }

        load()
    }, [minPowerKw, operator, includeUnknown])

    const center = [60.9827, 25.6615] // Lahti

    return (
        <div style={{ position: 'relative', height: '100vh', width: '100%' }}>
            {/* TOPBAR */}
            <div
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: TOPBAR_H,
                    zIndex: 1000,
                    background: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '0 12px',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.15)',
                }}
            >
                <div style={{ fontWeight: 700 }}>Latauspisteet</div>

                <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    Min teho (kW):
                    <select
                        value={minPowerKw}
                        onChange={(e) => setMinPowerKw(e.target.value)}
                    >
                        <option value="">Kaikki</option>
                        {powers.map((p) => (
                            <option key={p} value={p}>
                                ≥ {p} kW
                            </option>
                        ))}
                    </select>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <input
                        type="checkbox"
                        checked={includeUnknown}
                        onChange={(e) => setIncludeUnknown(e.target.checked)}
                    />
                    Näytä tuntemattomat tehot
                </label>


                <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    Operaattori:
                    <select value={operator} onChange={(e) => setOperator(e.target.value)}>
                        <option value="">Kaikki</option>
                        {operators.map((op) => (
                            <option key={op} value={op}>
                                {op}
                            </option>
                        ))}
                    </select>

                </label>

                {/* Pieni “Reset” jos haluat myöhemmin: voidaan lisätä nappi tähän */}
            </div>

            {/* VIRHELAATIKKO */}
            {error && (
                <div
                    style={{
                        position: 'fixed',
                        top: TOPBAR_H + 8,
                        left: 12,
                        zIndex: 1100,
                        background: '#fff',
                        padding: 10,
                        border: '1px solid rgba(0,0,0,0.15)',
                        borderRadius: 8,
                        maxWidth: 520,
                    }}
                >
                    <b>Virhe:</b> {error}
                </div>
            )}

            {/* MAP WRAPPER: täyttää kaiken topbarin alapuolelta */}
            <div
                style={{
                    position: 'absolute',
                    top: TOPBAR_H,
                    left: 0,
                    right: 0,
                    bottom: 0,
                }}
            >
                <MapContainer center={center} zoom={10} style={{ height: '100%', width: '100%' }}>
                    <TileLayer
                        attribution="&copy; OpenStreetMap contributors"
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    <Legend />
                    <FitBounds locations={locations} />

                    {locations.map((l) => {
                        const r = l.powerKw ? Math.min(14, Math.max(6, Math.round(l.powerKw / 20))) : 8

                        return (
                            <CircleMarker
                                key={l.id}
                                center={[l.lat, l.lon]}
                                radius={r}
                                pathOptions={{
                                    color: getColor(l.operator),
                                    fillColor: getColor(l.operator),
                                    weight: 2,
                                    opacity: 1,
                                    fillOpacity: 0.7,
                                }}
                            >
                                <Popup>
                                    <div>
                                        <div><b>{l.name}</b></div>
                                        <div>{l.city}</div>
                                        <div>{l.operator}</div>
                                        {l.powerKw != null && <div>Teho: {l.powerKw} kW</div>}
                                    </div>
                                </Popup>
                            </CircleMarker>
                        )
                    })}
                </MapContainer>
            </div>
        </div>
    )
}
