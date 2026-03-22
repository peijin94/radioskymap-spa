import type { Site } from '../types';

// Longitude is east-positive, west-negative throughout the app.
export const sites: Site[] = [
  {
    id: 'owens-valley',
    name: 'Owens Valley, US',
    latitudeDeg: 37.233,
    longitudeDeg: -118.283,
  },
  {
    id: 'birr',
    name: 'Birr, IE',
    latitudeDeg: 53.095,
    longitudeDeg: -7.913,
  },
  {
    id: 'exloo',
    name: 'Exloo, NL',
    latitudeDeg: 52.915,
    longitudeDeg: 6.869,
  },
  {
    id: 'onsala',
    name: 'Onsala, SE',
    latitudeDeg: 57.395,
    longitudeDeg: 11.925,
  },
  {
    id: 'khodad',
    name: 'Khodad, IN',
    latitudeDeg: 19.096,
    longitudeDeg: 74.049,
  },
  {
    id: 'murchison',
    name: 'Murchison, AU',
    latitudeDeg: -26.703,
    longitudeDeg: 116.671,
  },
];

export const defaultSiteId = sites[0].id;
