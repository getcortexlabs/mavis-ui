export type Venue = {
  id: string
  name: string
  city: string
}

export const venues: Venue[] = [
  { id: 'garden', name: 'Community garden', city: 'Porto' },
  { id: 'library', name: 'Open library', city: 'Recife' },
  { id: 'studio', name: 'Neighbourhood studio', city: 'Porto' },
]

export const venueAt = (id: string): Venue | undefined => venues.find((venue) => venue.id === id)
