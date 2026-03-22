export type ProjectionMode = 'sin' | 'azimuthal';
export type TimezoneMode = 'local' | 'utc';
export type DynamicBodyId = 'sun' | 'jupiter' | 'moon';

export interface Site {
  id: string;
  name: string;
  latitudeDeg: number;
  longitudeDeg: number;
}

export interface Source {
  id: string;
  name: string;
  kind: 'fixed' | 'dynamic';
  raHours?: number;
  decDeg?: number;
  bodyId?: DynamicBodyId;
  labelDx?: number;
  labelDy?: number;
}

export interface EquatorialCoordinates {
  raDeg: number;
  decDeg: number;
}

export interface HorizontalCoordinates {
  altitudeDeg: number;
  azimuthDeg: number;
  hourAngleDeg: number;
}

export interface ProjectedPoint {
  x: number;
  y: number;
}

export interface PlotPoint extends ProjectedPoint {
  visible: boolean;
}
