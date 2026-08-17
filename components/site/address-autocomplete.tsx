"use client"

import { useCallback, useEffect, useId, useRef, useState } from "react"

/**
 * Shape of the structured address returned to the parent form whenever
 * the user picks a place (or clears the field).
 */
export type AddressValue = {
  /** The full formatted address string. */
  formatted: string
  street: string
  city: string
  state: string
  postalCode: string
  country: string
  lat: number | null
  lng: number | null
  /** Google place id, useful for de-duping or later lookups. */
  placeId: string | null
}

export const EMPTY_ADDRESS: AddressValue = {
  formatted: "",
  street: "",
  city: "",
  state: "",
  postalCode: "",
  country: "",
  lat: null,
  lng: null,
  placeId: null,
}

type Props = {
  label?: string
  required?: boolean
  error?: string
  /** Called whenever the selected address changes. */
  onChange?: (value: AddressValue) => void
  /** Restrict results to one or more countries (ISO 3166-1 alpha-2), e.g. "us". */
  country?: string
  placeholder?: string
  /** Show the confirmation map once a place with coordinates is chosen. */
  showMap?: boolean
}

// --- Google Maps JS API loader (shared across component instances) --------
//
// Uses Google's official bootstrap loader + `importLibrary`. We use the modern
// `PlaceAutocompleteElement` web component (the legacy `Autocomplete` class is
// unavailable to new API customers as of March 2025).

let mapsPromise: Promise<void> | null = null

function injectBootstrap(key: string) {
  if (document.getElementById("google-maps-js")) return
  const g = document.createElement("script")
  g.id = "google-maps-js"
  g.text = `((g)=>{let h,a,k,p="The Google Maps JavaScript API",c="google",l="importLibrary",q="__ib__",m=document,b=window;b=b[c]||(b[c]={});let d=b.maps||(b.maps={}),r=new Set,e=new URLSearchParams,u=()=>h||(h=new Promise(async(f,n)=>{await (a=m.createElement("script"));e.set("libraries",[...r]+"");for(k in g)e.set(k.replace(/[A-Z]/g,t=>"_"+t[0].toLowerCase()),g[k]);e.set("callback",c+".maps."+q);a.src="https://maps."+c+"apis.com/maps/api/js?"+e;d[q]=f;a.onerror=()=>h=n(Error(p+" could not load."));a.nonce=m.querySelector("script[nonce]")?.nonce||"";m.head.append(a)}));d[l]?console.warn(p+" only loads once. Ignoring:",g):d[l]=(f,...n)=>r.add(f)&&u().then(()=>d[l](f,...n))})({key:${JSON.stringify(
    key,
  )},v:"weekly"});`
  document.head.appendChild(g)
}

function loadPlaces(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve()
  if (mapsPromise) return mapsPromise

  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  if (!key) {
    return Promise.reject(new Error("Missing NEXT_PUBLIC_GOOGLE_MAPS_API_KEY"))
  }

  mapsPromise = (async () => {
    injectBootstrap(key)
    const g = (window as any).google
    if (!g?.maps?.importLibrary) {
      throw new Error("Google Maps bootstrap failed to initialize")
    }
    await g.maps.importLibrary("places")
    await g.maps.importLibrary("marker")
    await g.maps.importLibrary("maps")
  })()

  return mapsPromise
}

/** Pull a single component (by type) out of a Place's addressComponents. */
function findComponent(
  components: Array<{ types: string[]; longText?: string | null; shortText?: string | null }> | undefined,
  type: string,
  useShort = false,
): string {
  const match = components?.find((c) => c.types.includes(type))
  if (!match) return ""
  return (useShort ? match.shortText : match.longText) ?? ""
}

export function AddressAutocomplete({
  label = "Address",
  required,
  error,
  onChange,
  country = "us",
  placeholder = "Start typing an address...",
  showMap = true,
}: Props) {
  const reactId = useId()
  const inputId = `addr-${reactId}`
  const hostRef = useRef<HTMLDivElement | null>(null)
  const mapDivRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<any>(null)
  const markerRef = useRef<any>(null)

  const [loadError, setLoadError] = useState<string | null>(null)
  const [selected, setSelected] = useState<AddressValue>(EMPTY_ADDRESS)

  const emit = useCallback(
    (value: AddressValue) => {
      setSelected(value)
      onChange?.(value)
    },
    [onChange],
  )

  const renderMap = useCallback((lat: number, lng: number) => {
    const g = (window as any).google
    if (!g?.maps || !mapDivRef.current) return
    const center = { lat, lng }
    if (!mapRef.current) {
      mapRef.current = new g.maps.Map(mapDivRef.current, {
        center,
        zoom: 16,
        disableDefaultUI: true,
        zoomControl: true,
        gestureHandling: "cooperative",
        mapId: "hub-tire-shop-address-map",
      })
    } else {
      mapRef.current.setCenter(center)
      mapRef.current.setZoom(16)
    }
    if (g.maps.marker?.AdvancedMarkerElement) {
      if (!markerRef.current) {
        markerRef.current = new g.maps.marker.AdvancedMarkerElement({ position: center, map: mapRef.current })
      } else {
        markerRef.current.position = center
        markerRef.current.map = mapRef.current
      }
    } else if (g.maps.Marker) {
      if (!markerRef.current) {
        markerRef.current = new g.maps.Marker({ position: center, map: mapRef.current })
      } else {
        markerRef.current.setPosition(center)
        markerRef.current.setMap(mapRef.current)
      }
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    let element: any = null
    let listener: ((e: any) => void) | null = null

    loadPlaces()
      .then(async () => {
        if (cancelled || !hostRef.current) return
        const g = (window as any).google

        element = new g.maps.places.PlaceAutocompleteElement({
          includedRegionCodes: country ? [country] : undefined,
          types: ["address"],
        })
        // Style the web component to match the surrounding inputs.
        element.id = inputId
        element.style.width = "100%"
        if (placeholder) element.setAttribute("placeholder", placeholder)

        hostRef.current.replaceChildren(element)

        listener = async (event: any) => {
          try {
            const prediction = event?.placePrediction
            if (!prediction) return
            const place = prediction.toPlace()
            await place.fetchFields({
              fields: ["addressComponents", "formattedAddress", "location", "id"],
            })

            const components = place.addressComponents as
              | Array<{ types: string[]; longText?: string | null; shortText?: string | null }>
              | undefined
            const streetNumber = findComponent(components, "street_number")
            const route = findComponent(components, "route")
            const street = [streetNumber, route].filter(Boolean).join(" ")
            const lat = typeof place.location?.lat === "function" ? place.location.lat() : place.location?.lat ?? null
            const lng = typeof place.location?.lng === "function" ? place.location.lng() : place.location?.lng ?? null

            const value: AddressValue = {
              formatted: place.formattedAddress ?? "",
              street,
              city:
                findComponent(components, "locality") ||
                findComponent(components, "sublocality") ||
                findComponent(components, "postal_town"),
              state: findComponent(components, "administrative_area_level_1", true),
              postalCode: findComponent(components, "postal_code"),
              country: findComponent(components, "country", true),
              lat: typeof lat === "number" ? lat : null,
              lng: typeof lng === "number" ? lng : null,
              placeId: place.id ?? null,
            }
            emit(value)
            if (value.lat != null && value.lng != null) renderMap(value.lat, value.lng)
          } catch (err) {
            console.error("[v0] Place selection failed:", err)
          }
        }

        element.addEventListener("gmp-select", listener)
      })
      .catch((err: Error) => {
        if (!cancelled) setLoadError(err.message)
      })

    return () => {
      cancelled = true
      if (element && listener) element.removeEventListener("gmp-select", listener)
    }
  }, [country, emit, inputId, placeholder, renderMap])

  const hasCoords = selected.lat != null && selected.lng != null

  return (
    <div>
      <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-foreground">
        {label} {required && <span className="text-primary">*</span>}
      </label>

      {/* Google's PlaceAutocompleteElement is mounted into this host div. */}
      <div
        ref={hostRef}
        className={`gmp-address-host w-full rounded-md border bg-background text-sm ${
          error ? "border-destructive" : "border-input"
        }`}
      />

      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}

      {loadError && (
        <p className="mt-1 text-xs text-muted-foreground">
          Address lookup is unavailable right now. Please enter your address in the notes below or call us.
        </p>
      )}

      {/* Structured values forwarded to the server on submit. */}
      <input type="hidden" name="address" value={selected.formatted} />
      <input type="hidden" name="addressStreet" value={selected.street} />
      <input type="hidden" name="addressCity" value={selected.city} />
      <input type="hidden" name="addressState" value={selected.state} />
      <input type="hidden" name="addressPostalCode" value={selected.postalCode} />
      <input type="hidden" name="addressCountry" value={selected.country} />
      <input type="hidden" name="addressLat" value={selected.lat ?? ""} />
      <input type="hidden" name="addressLng" value={selected.lng ?? ""} />
      <input type="hidden" name="addressPlaceId" value={selected.placeId ?? ""} />

      {showMap && (
        <div className={hasCoords ? "mt-3" : "hidden"} aria-hidden={!hasCoords}>
          <div
            ref={mapDivRef}
            className="h-52 w-full overflow-hidden rounded-md border border-input bg-muted"
            role="img"
            aria-label={selected.formatted ? `Map showing ${selected.formatted}` : "Selected address map"}
          />
          {selected.formatted && (
            <p className="mt-1.5 text-xs text-muted-foreground">
              Confirmed location:{" "}
              <span className="font-medium text-foreground">{selected.formatted}</span>
            </p>
          )}
        </div>
      )}
    </div>
  )
}
