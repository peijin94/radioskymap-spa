import {
  equatorialToHorizontal,
  galacticToEquatorial,
  getEquatorialCoordinatesForBody,
  hoursToDegrees,
} from './coordinates';
import { projectHorizontalCoordinates } from './projections';
import type { EquatorialCoordinates, PlotPoint, ProjectionMode, Site, Source } from '../types';

export interface TrackOptions {
  sampleCount?: number;
  spanHours?: number;
  hideBelowHorizon?: boolean;
}

export function generateTrackSegments(
  source: Source,
  centerDate: Date,
  site: Site,
  projectionMode: ProjectionMode,
  options: TrackOptions = {},
): PlotPoint[][] {
  const sampleCount = options.sampleCount ?? 181;
  const spanHours = options.spanHours ?? 24;
  const halfSpanHours = spanHours / 2;
  const samples: EquatorialCoordinates[] = [];

  for (let index = 0; index < sampleCount; index += 1) {
    const fraction = sampleCount === 1 ? 0 : index / (sampleCount - 1);
    const offsetHours = fraction * spanHours - halfSpanHours;
    const sampleDate = new Date(centerDate.getTime() + offsetHours * 3600_000);

    const equatorial =
      source.kind === 'dynamic' && source.bodyId
        ? getEquatorialCoordinatesForBody(source.bodyId, sampleDate, site.latitudeDeg, site.longitudeDeg)
        : {
            raDeg: hoursToDegrees(source.raHours ?? 0),
            decDeg: source.decDeg ?? 0,
          };

    samples.push(equatorial);
  }

  return projectEquatorialSamples(
    samples,
    centerDate,
    site,
    projectionMode,
    options,
    (index) => new Date(centerDate.getTime() + ((index / (sampleCount - 1)) * spanHours - halfSpanHours) * 3600_000),
  );
}

export function generateMilkyWaySegments(
  date: Date,
  site: Site,
  projectionMode: ProjectionMode,
  options: TrackOptions = {},
): PlotPoint[][] {
  const sampleCount = options.sampleCount ?? 721;
  const samples: EquatorialCoordinates[] = [];

  for (let index = 0; index < sampleCount; index += 1) {
    const longitudeDeg = (index / (sampleCount - 1)) * 360;
    samples.push(galacticToEquatorial(longitudeDeg, 0));
  }

  return projectEquatorialSamples(samples, date, site, projectionMode, options, () => date);
}

export function pointsToSmoothSvgPath(points: PlotPoint[]): string {
  if (points.length === 0) {
    return '';
  }

  if (points.length === 1) {
    return `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;
  }

  let path = `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;

  for (let index = 0; index < points.length - 1; index += 1) {
    const previous = points[index - 1] ?? points[index];
    const current = points[index];
    const next = points[index + 1];
    const afterNext = points[index + 2] ?? next;

    const cp1x = current.x + (next.x - previous.x) / 6;
    const cp1y = current.y + (next.y - previous.y) / 6;
    const cp2x = next.x - (afterNext.x - current.x) / 6;
    const cp2y = next.y - (afterNext.y - current.y) / 6;

    path += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${next.x.toFixed(2)} ${next.y.toFixed(2)}`;
  }

  return path;
}

export function segmentsToSmoothSvgPath(segments: PlotPoint[][]): string {
  return segments.map(pointsToSmoothSvgPath).filter(Boolean).join(' ');
}

function projectEquatorialSamples(
  samples: EquatorialCoordinates[],
  date: Date,
  site: Site,
  projectionMode: ProjectionMode,
  options: TrackOptions,
  getSampleDate: (index: number) => Date,
): PlotPoint[][] {
  const hideBelowHorizon = options.hideBelowHorizon ?? true;
  const segments: PlotPoint[][] = [];
  let currentSegment: PlotPoint[] = [];

  samples.forEach((equatorial, index) => {
    const sampleDate = getSampleDate(index) ?? date;
    const horizontal = equatorialToHorizontal(
      equatorial.raDeg,
      equatorial.decDeg,
      sampleDate,
      site.longitudeDeg,
      site.latitudeDeg,
    );
    const projected = projectHorizontalCoordinates(horizontal, projectionMode, hideBelowHorizon);

    if (projected) {
      currentSegment.push(projected);
    } else if (currentSegment.length > 0) {
      segments.push(currentSegment);
      currentSegment = [];
    }
  });

  if (currentSegment.length > 0) {
    segments.push(currentSegment);
  }

  return segments;
}
