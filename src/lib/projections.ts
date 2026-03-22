import type { HorizontalCoordinates, PlotPoint, ProjectedPoint, ProjectionMode } from '../types';

export const ORIENTATION = {
  rotationDeg: 0,
  flipX: true,
  flipY: false,
};

export function projectHorizontalCoordinates(
  coords: HorizontalCoordinates,
  mode: ProjectionMode,
  hideBelowHorizon = true,
): PlotPoint | null {
  if (hideBelowHorizon && coords.altitudeDeg < 0) {
    return null;
  }

  const point = mode === 'sin' ? projectSin(coords) : projectAzimuthal(coords);
  if (!point) {
    return null;
  }

  return {
    ...applyOrientation(point),
    visible: coords.altitudeDeg >= 0,
  };
}

// "Sin" here is the local orthographic / direction-cosine view of the visible hemisphere.
// Zenith is at the center, the horizon maps to the unit circle, and azimuth sets angle around the plot.
export function projectSin(coords: HorizontalCoordinates): ProjectedPoint | null {
  const altitudeRad = (coords.altitudeDeg * Math.PI) / 180;
  const azimuthRad = (coords.azimuthDeg * Math.PI) / 180;
  const radius = Math.cos(altitudeRad);

  if (!Number.isFinite(radius) || radius > 1.000001) {
    return null;
  }

  return {
    x: radius * Math.sin(azimuthRad),
    y: radius * Math.cos(azimuthRad),
  };
}

// Polar sky view: zenith at center, horizon at radius 1, azimuth measured from north through east.
export function projectAzimuthal(coords: HorizontalCoordinates): ProjectedPoint | null {
  const clampedAltitude = Math.max(-90, Math.min(90, coords.altitudeDeg));
  const azimuthRad = (coords.azimuthDeg * Math.PI) / 180;
  const radius = (90 - clampedAltitude) / 90;

  return {
    x: radius * Math.sin(azimuthRad),
    y: radius * Math.cos(azimuthRad),
  };
}

export function mapProjectedPointToSvg(point: ProjectedPoint, size: number, margin: number): ProjectedPoint {
  const center = size / 2;
  const radius = center - margin;

  return {
    x: center + point.x * radius,
    y: center - point.y * radius,
  };
}

export function projectHorizonAzimuthDeg(azimuthDeg: number): ProjectedPoint {
  const azimuthRad = (azimuthDeg * Math.PI) / 180;

  return applyOrientation({
    x: Math.sin(azimuthRad),
    y: Math.cos(azimuthRad),
  });
}

function applyOrientation(point: ProjectedPoint): ProjectedPoint {
  const rotationRad = (ORIENTATION.rotationDeg * Math.PI) / 180;
  const cosRotation = Math.cos(rotationRad);
  const sinRotation = Math.sin(rotationRad);

  let x = point.x * cosRotation - point.y * sinRotation;
  let y = point.x * sinRotation + point.y * cosRotation;

  if (ORIENTATION.flipX) {
    x *= -1;
  }

  if (ORIENTATION.flipY) {
    y *= -1;
  }

  return { x, y };
}
