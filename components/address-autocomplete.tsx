"use client"

import React, { useCallback, useEffect, useRef, useState } from "react"
import { Input } from "@/components/ui/input"

type AddressDetails = {
  placeId: string
  formattedAddress: string
  addressComponents: {
    streetNumber?: string
    route?: string
    locality?: string
    administrativeArea?: string
    postalCode?: string
    country?: string
  }
  latitude?: number
  longitude?: number
}

interface AddressAutocompleteProps {
  value: string
  onChange: (value: string) => void
  onSelect?: (details: AddressDetails) => void
  placeholder?: string
  required?: boolean
  id?: string
  className?: string
  ariaDescribedBy?: string
  countryRestriction?: string | string[]
}

declare global {
  interface Window {
    google?: any
    __googleMapsLoading?: boolean
    __googleMapsLoaded?: boolean
    __googleMapsResolvers?: Array<() => void>
  }
}

function loadGooglePlaces(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve()
  if (window.google?.maps?.places) return Promise.resolve()
  if (window.__googleMapsLoaded) return Promise.resolve()

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  if (!apiKey) return Promise.resolve()

  return new Promise<void>((resolve, reject) => {
    window.__googleMapsResolvers = window.__googleMapsResolvers || []
    window.__googleMapsResolvers.push(resolve)

    if (window.__googleMapsLoading) return
    window.__googleMapsLoading = true

    const script = document.createElement("script")
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&v=quarterly`
    script.async = true
    script.defer = true
    script.onload = () => {
      window.__googleMapsLoaded = true
      window.__googleMapsLoading = false
      ;(window.__googleMapsResolvers || []).forEach((cb) => cb())
      window.__googleMapsResolvers = []
    }
    script.onerror = () => {
      window.__googleMapsLoading = false
      reject(new Error("Failed to load Google Maps JS API"))
    }
    document.head.appendChild(script)
  })
}

function parseAddressComponents(components: any[]): AddressDetails["addressComponents"] {
  const result: AddressDetails["addressComponents"] = {}
  for (const c of components) {
    if (c.types.includes("street_number")) result.streetNumber = c.long_name
    if (c.types.includes("route")) result.route = c.long_name
    if (c.types.includes("locality")) result.locality = c.long_name
    if (c.types.includes("administrative_area_level_1")) result.administrativeArea = c.short_name
    if (c.types.includes("postal_code")) result.postalCode = c.long_name
    if (c.types.includes("country")) result.country = c.short_name
  }
  return result
}

export function AddressAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = "Start typing your address",
  required,
  id,
  className,
  ariaDescribedBy,
  countryRestriction = "au",
}: AddressAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const autocompleteRef = useRef<any>(null)
  const [ready, setReady] = useState<boolean>(false)

  useEffect(() => {
    let cancelled = false
    loadGooglePlaces()
      .then(() => {
        if (cancelled) return
        if (!inputRef.current || !window.google?.maps?.places) return

        const options: any = {
          types: ["address"],
          fields: ["address_components", "formatted_address", "geometry", "place_id"],
        }
        if (countryRestriction) {
          options.componentRestrictions = { country: countryRestriction }
        }

        autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, options)
        autocompleteRef.current.addListener("place_changed", () => {
          const place = autocompleteRef.current.getPlace()
          if (!place) return
          const formatted = place.formatted_address || value
          const placeId: string | undefined = place.place_id
          const details: AddressDetails = {
            placeId: placeId || "",
            formattedAddress: formatted,
            addressComponents: place.address_components ? parseAddressComponents(place.address_components) : {},
            latitude: place.geometry?.location?.lat?.(),
            longitude: place.geometry?.location?.lng?.(),
          }
          onChange(formatted)
          onSelect?.(details)
        })
        setReady(true)
      })
      .catch(() => {
        // Fail silently; fall back to plain input
        setReady(false)
      })

    return () => {
      cancelled = true
    }
  }, [onChange, onSelect, value, countryRestriction])

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(e.target.value)
    },
    [onChange],
  )

  return (
    <Input
      ref={inputRef}
      id={id}
      value={value}
      onChange={handleChange}
      placeholder={placeholder}
      required={required}
      aria-describedby={ariaDescribedBy}
      className={className}
      aria-label="Service Address"
      data-autocomplete-ready={ready ? "true" : "false"}
    />
  )
}

export type { AddressDetails }


