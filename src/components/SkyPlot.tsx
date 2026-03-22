import { mapProjectedPointToSvg } from '../lib/projections';
import { segmentsToSmoothSvgPath } from '../lib/tracks';
import type { ProjectedPoint, Source } from '../types';
import { SourceMarker } from './SourceMarker';

export interface RenderedSource {
  source: Source;
  point: ProjectedPoint;
}

interface SkyPlotProps {
  projectionLabel: string;
  siteName: string;
  timestampLabel: string;
  renderedSources: RenderedSource[];
  trackSegments: ProjectedPoint[][];
  milkyWaySegments: ProjectedPoint[][];
  showTrack: boolean;
  showLabels: boolean;
}

const VIEWBOX_SIZE = 1000;
const PLOT_MARGIN = 72;

export function SkyPlot(props: SkyPlotProps) {
  const center = VIEWBOX_SIZE / 2;
  const radius = center - PLOT_MARGIN;
  const ringFractions = [0.25, 0.5, 0.75, 1];

  const svgSources = props.renderedSources.map((entry) => ({
    ...entry,
    point: mapProjectedPointToSvg(entry.point, VIEWBOX_SIZE, PLOT_MARGIN),
  }));

  const svgTrackSegments = props.trackSegments.map((segment) =>
    segment.map((point) => ({ ...mapProjectedPointToSvg(point, VIEWBOX_SIZE, PLOT_MARGIN), visible: true })),
  );
  const trackPath = segmentsToSmoothSvgPath(svgTrackSegments);
  const svgMilkyWaySegments = props.milkyWaySegments.map((segment) =>
    segment.map((point) => ({ ...mapProjectedPointToSvg(point, VIEWBOX_SIZE, PLOT_MARGIN), visible: true })),
  );
  const milkyWayPath = segmentsToSmoothSvgPath(svgMilkyWaySegments);

  return (
    <section className="plot-shell">
      <div className="plot-header">
        <div>
          <h2>Sky Projection</h2>
          <p>
            {props.projectionLabel} projection · {props.siteName}
          </p>
        </div>
        <div className="plot-header__meta">
          <div className="plot-legend">
            <span className="plot-legend__item">
              <span className="plot-legend__sample plot-legend__sample--milky-way" />
              Milky Way
            </span>
            <span className="plot-legend__item">
              <span className="plot-legend__sample plot-legend__sample--sun-track" />
              Sun track
            </span>
          </div>
          <strong>{props.timestampLabel}</strong>
        </div>
      </div>

      <div className="plot-frame">
        <div className="plot-canvas">
          <svg className="sky-plot" viewBox={`0 0 ${VIEWBOX_SIZE} ${VIEWBOX_SIZE}`} role="img" aria-label="Sky plot">
            <defs>
              <clipPath id="sky-plot-clip">
                <circle cx={center} cy={center} r={radius} />
              </clipPath>
              <filter id="milky-way-blur" x="-10%" y="-10%" width="120%" height="120%">
                <feGaussianBlur stdDeviation="6" />
              </filter>
            </defs>

            <rect x="0" y="0" width={VIEWBOX_SIZE} height={VIEWBOX_SIZE} className="sky-plot__background" />

            {ringFractions.map((fraction) => (
              <circle
                key={fraction}
                cx={center}
                cy={center}
                r={radius * fraction}
                className="sky-plot__ring"
              />
            ))}

            <line
              x1={center - radius}
              y1={center}
              x2={center + radius}
              y2={center}
              className="sky-plot__axis"
            />
            <line
              x1={center}
              y1={center - radius}
              x2={center}
              y2={center + radius}
              className="sky-plot__axis"
            />

            <circle cx={center} cy={center} r={radius} className="sky-plot__boundary" />

            <g clipPath="url(#sky-plot-clip)">
              {milkyWayPath ? (
                <>
                  <path d={milkyWayPath} className="sky-plot__milky-way-glow" />
                  <path d={milkyWayPath} className="sky-plot__milky-way" />
                </>
              ) : null}
              {props.showTrack && trackPath ? <path d={trackPath} className="sky-plot__track" /> : null}

              {svgSources.map((entry) => (
                <SourceMarker
                  key={entry.source.id}
                  source={entry.source}
                  point={entry.point}
                  showLabel={props.showLabels}
                  plotCenter={center}
                  plotRadius={radius}
                />
              ))}
            </g>
          </svg>
        </div>
      </div>
    </section>
  );
}
