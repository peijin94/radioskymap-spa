import type { ProjectedPoint, Source } from '../types';

interface SourceMarkerProps {
  source: Source;
  point: ProjectedPoint;
  showLabel: boolean;
  plotCenter: number;
  plotRadius: number;
}

const LABEL_PADDING = 24;

export function SourceMarker({ source, point, showLabel, plotCenter, plotRadius }: SourceMarkerProps) {
  const isDynamic = source.kind === 'dynamic';
  const labelX = point.x + (source.labelDx ?? 8);
  const labelY = point.y + (source.labelDy ?? -8);
  const dxFromCenter = labelX - plotCenter;
  const dyFromCenter = labelY - plotCenter;
  const radialDistance = Math.hypot(dxFromCenter, dyFromCenter);
  const maxDistance = plotRadius - LABEL_PADDING;

  const shouldPullInward = radialDistance > maxDistance && radialDistance > 0;
  const scale = shouldPullInward ? maxDistance / radialDistance : 1;
  const adjustedLabelX = plotCenter + dxFromCenter * scale;
  const adjustedLabelY = plotCenter + dyFromCenter * scale;
  const textAnchor = adjustedLabelX < point.x - 4 ? 'end' : 'start';

  return (
    <g className="source-marker">
      <circle
        cx={point.x}
        cy={point.y}
        r={isDynamic ? 6 : 4.5}
        className={isDynamic ? 'source-marker__dot source-marker__dot--dynamic' : 'source-marker__dot'}
      />
      {showLabel ? (
        <text
          x={adjustedLabelX}
          y={adjustedLabelY}
          className="source-marker__label"
          textAnchor={textAnchor}
        >
          {source.name}
        </text>
      ) : null}
    </g>
  );
}
