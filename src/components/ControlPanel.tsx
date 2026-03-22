import { sites } from '../data/sites';
import { formatHms, getTimezoneLabel } from '../lib/time';
import type { ProjectionMode, Site, TimezoneMode } from '../types';

interface ControlPanelProps {
  projectionMode: ProjectionMode;
  selectedDate: string;
  hour: number;
  minute: number;
  second: number;
  timezoneMode: TimezoneMode;
  selectedSiteId: string;
  selectedSite: Site;
  showTrack: boolean;
  showLabels: boolean;
  onProjectionModeChange: (mode: ProjectionMode) => void;
  onSelectedDateChange: (value: string) => void;
  onHourChange: (value: number) => void;
  onMinuteChange: (value: number) => void;
  onSecondChange: (value: number) => void;
  onTimezoneModeChange: (mode: TimezoneMode) => void;
  onSelectedSiteChange: (siteId: string) => void;
  onShowTrackChange: (value: boolean) => void;
  onShowLabelsChange: (value: boolean) => void;
  onNow: () => void;
}

function SliderRow(props: {
  label: string;
  min: number;
  max: number;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="control-panel__field">
      <span className="control-panel__label">
        {props.label}
        <strong>{String(props.value).padStart(2, '0')}</strong>
      </span>
      <input
        type="range"
        min={props.min}
        max={props.max}
        step={1}
        value={props.value}
        onChange={(event) => props.onChange(Number(event.target.value))}
      />
    </label>
  );
}

export function ControlPanel(props: ControlPanelProps) {
  return (
    <aside className="control-panel">
      <div className="panel-card">
        <h1>Radio Sky Map</h1>
        <p className="panel-card__intro">
          Static, client-side sky projection for bright radio calibrators and solar-system bodies.
        </p>
      </div>

      <div className="panel-card">
        <h2>Projection</h2>
        <div className="segmented-control">
          <button
            type="button"
            className={props.projectionMode === 'sin' ? 'is-active' : undefined}
            onClick={() => props.onProjectionModeChange('sin')}
          >
            Sin
          </button>
          <button
            type="button"
            className={props.projectionMode === 'azimuthal' ? 'is-active' : undefined}
            onClick={() => props.onProjectionModeChange('azimuthal')}
          >
            Azimuthal
          </button>
        </div>
      </div>

      <div className="panel-card">
        <h2>Date &amp; Time</h2>
        <label className="control-panel__field">
          <span className="control-panel__label">Date</span>
          <input
            type="date"
            value={props.selectedDate}
            onChange={(event) => props.onSelectedDateChange(event.target.value)}
          />
        </label>

        <SliderRow label="Hour" min={0} max={23} value={props.hour} onChange={props.onHourChange} />
        <SliderRow label="Minute" min={0} max={59} value={props.minute} onChange={props.onMinuteChange} />
        <SliderRow label="Second" min={0} max={59} value={props.second} onChange={props.onSecondChange} />

        <div className="control-panel__meta-row">
          <span>Formatted time</span>
          <strong>{formatHms(props.hour, props.minute, props.second)}</strong>
        </div>

        <label className="control-panel__field">
          <span className="control-panel__label">Timezone</span>
          <select
            value={props.timezoneMode}
            onChange={(event) => props.onTimezoneModeChange(event.target.value as TimezoneMode)}
          >
            <option value="local">Local browser timezone</option>
            <option value="utc">UTC</option>
          </select>
        </label>

        <div className="control-panel__meta-row">
          <span>Active zone</span>
          <strong>{getTimezoneLabel(props.timezoneMode)}</strong>
        </div>

        <button type="button" className="secondary-button" onClick={props.onNow}>
          Now
        </button>
      </div>

      <div className="panel-card">
        <h2>Observing Site</h2>
        <label className="control-panel__field">
          <span className="control-panel__label">Location</span>
          <select value={props.selectedSiteId} onChange={(event) => props.onSelectedSiteChange(event.target.value)}>
            {sites.map((site) => (
              <option key={site.id} value={site.id}>
                {site.name}
              </option>
            ))}
          </select>
        </label>

        <div className="control-panel__meta-stack">
          <div className="control-panel__meta-row">
            <span>Latitude</span>
            <strong>{props.selectedSite.latitudeDeg.toFixed(3)}°</strong>
          </div>
          <div className="control-panel__meta-row">
            <span>Longitude</span>
            <strong>{props.selectedSite.longitudeDeg.toFixed(3)}°</strong>
          </div>
        </div>
      </div>

      <div className="panel-card">
        <h2>Display</h2>
        <label className="checkbox-row">
          <input
            type="checkbox"
            checked={props.showTrack}
            onChange={(event) => props.onShowTrackChange(event.target.checked)}
          />
          <span>Show track (Sun)</span>
        </label>
        <label className="checkbox-row">
          <input
            type="checkbox"
            checked={props.showLabels}
            onChange={(event) => props.onShowLabelsChange(event.target.checked)}
          />
          <span>Show labels</span>
        </label>
      </div>
    </aside>
  );
}
