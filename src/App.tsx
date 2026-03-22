import { useMemo, useState } from 'react';
import { ControlPanel } from './components/ControlPanel';
import { SkyPlot } from './components/SkyPlot';
import { defaultSiteId, sites } from './data/sites';
import { defaultTrackSourceId, sources } from './data/sources';
import { equatorialToHorizontal, getEquatorialCoordinatesForBody, hoursToDegrees } from './lib/coordinates';
import { projectHorizontalCoordinates } from './lib/projections';
import { generateMilkyWaySegments, generateTrackSegments } from './lib/tracks';
import { buildDateFromParts, formatHms, getCurrentDateParts, getTimezoneLabel } from './lib/time';
import type { ProjectionMode, TimezoneMode } from './types';

const initialNow = getCurrentDateParts('local');

function App() {
  const [projectionMode, setProjectionMode] = useState<ProjectionMode>('sin');
  const [selectedDate, setSelectedDate] = useState(initialNow.date);
  const [hour, setHour] = useState(initialNow.hour);
  const [minute, setMinute] = useState(initialNow.minute);
  const [second, setSecond] = useState(initialNow.second);
  const [timezoneMode, setTimezoneMode] = useState<TimezoneMode>('local');
  const [selectedSiteId, setSelectedSiteId] = useState(defaultSiteId);
  const [showTrack, setShowTrack] = useState(true);
  const [showLabels, setShowLabels] = useState(true);

  const selectedSite = useMemo(
    () => sites.find((site) => site.id === selectedSiteId) ?? sites[0],
    [selectedSiteId],
  );

  const selectedDateTime = useMemo(
    () => buildDateFromParts({ date: selectedDate, hour, minute, second }, timezoneMode),
    [selectedDate, hour, minute, second, timezoneMode],
  );

  const renderedSources = useMemo(
    () =>
      sources.flatMap((source) => {
        const equatorial =
          source.kind === 'dynamic' && source.bodyId
            ? getEquatorialCoordinatesForBody(
                source.bodyId,
                selectedDateTime,
                selectedSite.latitudeDeg,
                selectedSite.longitudeDeg,
              )
            : {
                raDeg: hoursToDegrees(source.raHours ?? 0),
                decDeg: source.decDeg ?? 0,
              };

        const horizontal = equatorialToHorizontal(
          equatorial.raDeg,
          equatorial.decDeg,
          selectedDateTime,
          selectedSite.longitudeDeg,
          selectedSite.latitudeDeg,
        );

        const projected = projectHorizontalCoordinates(horizontal, projectionMode, true);
        if (!projected) {
          return [];
        }

        return [{ source, point: projected }];
      }),
    [projectionMode, selectedDateTime, selectedSite.latitudeDeg, selectedSite.longitudeDeg],
  );

  const trackSource = useMemo(
    () => sources.find((source) => source.id === defaultTrackSourceId) ?? sources[0],
    [],
  );

  const trackSegments = useMemo(
    () => generateTrackSegments(trackSource, selectedDateTime, selectedSite, projectionMode),
    [projectionMode, selectedDateTime, selectedSite, trackSource],
  );
  const milkyWaySegments = useMemo(
    () => generateMilkyWaySegments(selectedDateTime, selectedSite, projectionMode),
    [projectionMode, selectedDateTime, selectedSite],
  );

  const timestampLabel = useMemo(() => {
    return `${selectedDate} ${formatHms(hour, minute, second)} ${getTimezoneLabel(timezoneMode)}`;
  }, [hour, minute, second, selectedDate, timezoneMode]);

  const handleNow = () => {
    const current = getCurrentDateParts(timezoneMode);
    setSelectedDate(current.date);
    setHour(current.hour);
    setMinute(current.minute);
    setSecond(current.second);
  };

  return (
    <main className="app-shell">
      <SkyPlot
        projectionMode={projectionMode}
        projectionLabel={projectionMode === 'sin' ? 'Sin' : 'Azimuthal'}
        siteName={selectedSite.name}
        timestampLabel={timestampLabel}
        renderedSources={renderedSources}
        trackSegments={trackSegments}
        milkyWaySegments={milkyWaySegments}
        showTrack={showTrack}
        showLabels={showLabels}
      />

      <ControlPanel
        projectionMode={projectionMode}
        selectedDate={selectedDate}
        hour={hour}
        minute={minute}
        second={second}
        timezoneMode={timezoneMode}
        selectedSiteId={selectedSite.id}
        selectedSite={selectedSite}
        showTrack={showTrack}
        showLabels={showLabels}
        onProjectionModeChange={setProjectionMode}
        onSelectedDateChange={setSelectedDate}
        onHourChange={setHour}
        onMinuteChange={setMinute}
        onSecondChange={setSecond}
        onTimezoneModeChange={setTimezoneMode}
        onSelectedSiteChange={setSelectedSiteId}
        onShowTrackChange={setShowTrack}
        onShowLabelsChange={setShowLabels}
        onNow={handleNow}
      />
    </main>
  );
}

export default App;
