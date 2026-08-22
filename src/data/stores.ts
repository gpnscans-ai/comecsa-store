// Sucursales de COMECSA.
// Para agregar una sucursal nueva, solo añade otro objeto a este arreglo —
// las tarjetas y el mapa de la sección "Nuestras Sucursales" se generan
// automáticamente a partir de esta lista, no hay que tocar el diseño.
//
// address / phone / hours: déjalos como "" mientras no estén confirmados —
// la tarjeta muestra "Información próximamente" automáticamente.
// lat/lng son coordenadas aproximadas del centro de la ciudad (solo para
// ubicar el marcador en el mapa), no una dirección exacta de local.

export interface StoreLocation {
  city: string;
  province: string;
  country: string;
  name: string;
  isMain?: boolean;
  address: string;
  phone: string;
  hours: string;
  lat: number;
  lng: number;
  mapsUrl: string;
}

function mapsSearchUrl(query: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export const STORES: StoreLocation[] = [
  {
    city: "La Libertad",
    province: "Santa Elena",
    country: "Ecuador",
    name: "COMECSA",
    isMain: true,
    address: "",
    phone: "",
    hours: "",
    lat: -2.2333,
    lng: -80.9167,
    mapsUrl: mapsSearchUrl("COMECSA, La Libertad, Santa Elena, Ecuador"),
  },
  {
    city: "Machala",
    province: "El Oro",
    country: "Ecuador",
    name: "COMECSA Mega Store",
    address: "",
    phone: "",
    hours: "",
    lat: -3.2581,
    lng: -79.9553,
    mapsUrl: mapsSearchUrl("COMECSA Mega Store, Machala, El Oro, Ecuador"),
  },
  {
    city: "Portoviejo",
    province: "Manabí",
    country: "Ecuador",
    name: "COMECSA Portoviejo",
    address: "",
    phone: "",
    hours: "",
    lat: -1.0546,
    lng: -80.4547,
    mapsUrl: mapsSearchUrl("COMECSA Portoviejo, Manabí, Ecuador"),
  },
  {
    city: "Manta",
    province: "Manabí",
    country: "Ecuador",
    name: "COMECSA Manta",
    address: "",
    phone: "",
    hours: "",
    lat: -0.9677,
    lng: -80.7089,
    mapsUrl: mapsSearchUrl("COMECSA Manta, Manabí, Ecuador"),
  },
];
