import { Body, Equator, Observer } from 'astronomy-engine';
import { julianCenturiesSinceJ2000, localSiderealTimeDeg, normalizeDegrees, toJulianDay } from './time';
import type { DynamicBodyId, EquatorialCoordinates, HorizontalCoordinates } from '../types';

export const DEG_TO_RAD = Math.PI / 180;
export const RAD_TO_DEG = 180 / Math.PI;

export function degToRad(degrees: number): number {
  return degrees * DEG_TO_RAD;
}

export function radToDeg(radians: number): number {
  return radians * RAD_TO_DEG;
}

export function hoursToDegrees(hours: number): number {
  return hours * 15;
}

export function degreesToHours(degrees: number): number {
  return degrees / 15;
}

export function normalizeSignedDegrees(value: number): number {
  const normalized = normalizeDegrees(value);
  return normalized > 180 ? normalized - 360 : normalized;
}

export function equatorialToHorizontal(
  raDeg: number,
  decDeg: number,
  date: Date,
  longitudeDeg: number,
  latitudeDeg: number,
): HorizontalCoordinates {
  const lstDeg = localSiderealTimeDeg(date, longitudeDeg);
  const hourAngleDeg = normalizeSignedDegrees(lstDeg - raDeg);

  const decRad = degToRad(decDeg);
  const latRad = degToRad(latitudeDeg);
  const hourAngleRad = degToRad(hourAngleDeg);

  // East/North/Up components in the topocentric horizontal frame.
  const east = -Math.cos(decRad) * Math.sin(hourAngleRad);
  const north =
    Math.sin(decRad) * Math.cos(latRad) -
    Math.cos(decRad) * Math.cos(hourAngleRad) * Math.sin(latRad);
  const up =
    Math.sin(decRad) * Math.sin(latRad) +
    Math.cos(decRad) * Math.cos(hourAngleRad) * Math.cos(latRad);

  const altitudeDeg = radToDeg(Math.asin(clamp(up, -1, 1)));
  const azimuthDeg = normalizeDegrees(radToDeg(Math.atan2(east, north)));

  return {
    altitudeDeg,
    azimuthDeg,
    hourAngleDeg,
  };
}

export function getEquatorialCoordinatesForBody(
  bodyId: DynamicBodyId,
  date: Date,
  latitudeDeg: number,
  longitudeDeg: number,
): EquatorialCoordinates {
  const observer = new Observer(latitudeDeg, longitudeDeg, 0);
  const body = bodyIdToAstronomyEngineBody(bodyId);
  const equatorial = Equator(body, date, observer, true, true);

  return {
    raDeg: hoursToDegrees(equatorial.ra),
    decDeg: equatorial.dec,
  };
}

function bodyIdToAstronomyEngineBody(bodyId: DynamicBodyId): Body {
  switch (bodyId) {
    case 'sun':
      return Body.Sun;
    case 'moon':
      return Body.Moon;
    case 'jupiter':
      return Body.Jupiter;
  }
}

export function getSunEquatorialCoordinates(date: Date): EquatorialCoordinates {
  const jd = toJulianDay(date);
  const n = jd - 2451545.0;
  const meanLongitude = normalizeDegrees(280.46 + 0.9856474 * n);
  const meanAnomaly = normalizeDegrees(357.528 + 0.9856003 * n);
  const meanAnomalyRad = degToRad(meanAnomaly);
  const eclipticLongitude =
    meanLongitude +
    1.915 * Math.sin(meanAnomalyRad) +
    0.02 * Math.sin(2 * meanAnomalyRad);
  const obliquityDeg = 23.439 - 0.0000004 * n;

  return eclipticToEquatorial(eclipticLongitude, 0, obliquityDeg);
}

export function getJupiterEquatorialCoordinates(date: Date): EquatorialCoordinates {
  const jd = toJulianDay(date);
  const d = jd - 2451543.5;
  const earth = heliocentricPlanetPosition({
    longitudeAscendingNodeDeg: 0,
    inclinationDeg: 0,
    argumentOfPerihelionDeg: 282.9404 + 4.70935e-5 * d,
    semiMajorAxisAu: 1.0,
    eccentricity: 0.016709 - 1.151e-9 * d,
    meanAnomalyDeg: 356.047 + 0.9856002585 * d,
  });
  const jupiter = heliocentricPlanetPosition({
    longitudeAscendingNodeDeg: 100.4542 + 2.76854e-5 * d,
    inclinationDeg: 1.303 - 1.557e-7 * d,
    argumentOfPerihelionDeg: 273.8777 + 1.64505e-5 * d,
    semiMajorAxisAu: 5.20256,
    eccentricity: 0.048498 + 4.469e-9 * d,
    meanAnomalyDeg: 19.895 + 0.0830853001 * d,
  });

  const xGeocentric = jupiter.x - earth.x;
  const yGeocentric = jupiter.y - earth.y;
  const zGeocentric = jupiter.z - earth.z;

  const obliquityDeg = 23.4393 - 3.563e-7 * d;
  const obliquityRad = degToRad(obliquityDeg);

  const xEquatorial = xGeocentric;
  const yEquatorial = yGeocentric * Math.cos(obliquityRad) - zGeocentric * Math.sin(obliquityRad);
  const zEquatorial = yGeocentric * Math.sin(obliquityRad) + zGeocentric * Math.cos(obliquityRad);

  const raDeg = normalizeDegrees(radToDeg(Math.atan2(yEquatorial, xEquatorial)));
  const decDeg = radToDeg(
    Math.atan2(zEquatorial, Math.sqrt(xEquatorial * xEquatorial + yEquatorial * yEquatorial)),
  );

  return { raDeg, decDeg };
}

// Low-order geocentric Moon approximation. This is intentionally lightweight for a static client-side MVP.
export function getMoonEquatorialCoordinates(date: Date): EquatorialCoordinates {
  const jd = toJulianDay(date);
  const d = jd - 2451543.5;

  const longitudeAscendingNodeDeg = normalizeDegrees(125.1228 - 0.0529538083 * d);
  const inclinationDeg = 5.1454;
  const argumentOfPerigeeDeg = normalizeDegrees(318.0634 + 0.1643573223 * d);
  const meanDistanceEarthRadii = 60.2666;
  const eccentricity = 0.0549;
  const meanAnomalyDeg = normalizeDegrees(115.3654 + 13.0649929509 * d);

  const moon = heliocentricPlanetPosition({
    longitudeAscendingNodeDeg,
    inclinationDeg,
    argumentOfPerihelionDeg: argumentOfPerigeeDeg,
    semiMajorAxisAu: meanDistanceEarthRadii,
    eccentricity,
    meanAnomalyDeg,
  });

  const obliquityDeg = 23.4393 - 3.563e-7 * d;
  const obliquityRad = degToRad(obliquityDeg);

  const xEquatorial = moon.x;
  const yEquatorial = moon.y * Math.cos(obliquityRad) - moon.z * Math.sin(obliquityRad);
  const zEquatorial = moon.y * Math.sin(obliquityRad) + moon.z * Math.cos(obliquityRad);

  return {
    raDeg: normalizeDegrees(radToDeg(Math.atan2(yEquatorial, xEquatorial))),
    decDeg: radToDeg(Math.atan2(zEquatorial, Math.sqrt(xEquatorial * xEquatorial + yEquatorial * yEquatorial))),
  };
}

// Galactic-to-equatorial rotation (J2000). The Milky Way line uses b = 0 samples.
const GALACTIC_TO_EQUATORIAL_MATRIX = [
  [-0.0548755604, 0.4941094279, -0.867666149],
  [-0.8734370902, -0.44482963, -0.1980763734],
  [-0.4838350155, 0.7469822445, 0.4559837762],
] as const;

export function galacticToEquatorial(galacticLongitudeDeg: number, galacticLatitudeDeg: number): EquatorialCoordinates {
  const longitudeRad = degToRad(galacticLongitudeDeg);
  const latitudeRad = degToRad(galacticLatitudeDeg);

  const xGalactic = Math.cos(latitudeRad) * Math.cos(longitudeRad);
  const yGalactic = Math.cos(latitudeRad) * Math.sin(longitudeRad);
  const zGalactic = Math.sin(latitudeRad);

  const xEquatorial =
    GALACTIC_TO_EQUATORIAL_MATRIX[0][0] * xGalactic +
    GALACTIC_TO_EQUATORIAL_MATRIX[0][1] * yGalactic +
    GALACTIC_TO_EQUATORIAL_MATRIX[0][2] * zGalactic;
  const yEquatorial =
    GALACTIC_TO_EQUATORIAL_MATRIX[1][0] * xGalactic +
    GALACTIC_TO_EQUATORIAL_MATRIX[1][1] * yGalactic +
    GALACTIC_TO_EQUATORIAL_MATRIX[1][2] * zGalactic;
  const zEquatorial =
    GALACTIC_TO_EQUATORIAL_MATRIX[2][0] * xGalactic +
    GALACTIC_TO_EQUATORIAL_MATRIX[2][1] * yGalactic +
    GALACTIC_TO_EQUATORIAL_MATRIX[2][2] * zGalactic;

  return {
    raDeg: normalizeDegrees(radToDeg(Math.atan2(yEquatorial, xEquatorial))),
    decDeg: radToDeg(Math.asin(clamp(zEquatorial, -1, 1))),
  };
}

function heliocentricPlanetPosition(elements: {
  longitudeAscendingNodeDeg: number;
  inclinationDeg: number;
  argumentOfPerihelionDeg: number;
  semiMajorAxisAu: number;
  eccentricity: number;
  meanAnomalyDeg: number;
}): { x: number; y: number; z: number } {
  const meanAnomalyRad = degToRad(normalizeDegrees(elements.meanAnomalyDeg));
  const eccentricity = elements.eccentricity;

  // First-order eccentric anomaly approximation, adequate for the MVP.
  const eccentricAnomalyRad =
    meanAnomalyRad +
    eccentricity * Math.sin(meanAnomalyRad) * (1 + eccentricity * Math.cos(meanAnomalyRad));

  const xv = elements.semiMajorAxisAu * (Math.cos(eccentricAnomalyRad) - eccentricity);
  const yv =
    elements.semiMajorAxisAu * Math.sqrt(1 - eccentricity * eccentricity) * Math.sin(eccentricAnomalyRad);
  const trueAnomalyRad = Math.atan2(yv, xv);
  const radius = Math.sqrt(xv * xv + yv * yv);

  const ascendingNodeRad = degToRad(elements.longitudeAscendingNodeDeg);
  const inclinationRad = degToRad(elements.inclinationDeg);
  const perihelionRad = degToRad(elements.argumentOfPerihelionDeg);
  const longitudeRad = trueAnomalyRad + perihelionRad;

  return {
    x:
      radius *
      (Math.cos(ascendingNodeRad) * Math.cos(longitudeRad) -
        Math.sin(ascendingNodeRad) * Math.sin(longitudeRad) * Math.cos(inclinationRad)),
    y:
      radius *
      (Math.sin(ascendingNodeRad) * Math.cos(longitudeRad) +
        Math.cos(ascendingNodeRad) * Math.sin(longitudeRad) * Math.cos(inclinationRad)),
    z: radius * Math.sin(longitudeRad) * Math.sin(inclinationRad),
  };
}

function eclipticToEquatorial(
  eclipticLongitudeDeg: number,
  eclipticLatitudeDeg: number,
  obliquityDeg: number,
): EquatorialCoordinates {
  const lambdaRad = degToRad(eclipticLongitudeDeg);
  const betaRad = degToRad(eclipticLatitudeDeg);
  const epsilonRad = degToRad(obliquityDeg);

  const sinDec =
    Math.sin(betaRad) * Math.cos(epsilonRad) +
    Math.cos(betaRad) * Math.sin(epsilonRad) * Math.sin(lambdaRad);
  const decDeg = radToDeg(Math.asin(clamp(sinDec, -1, 1)));

  const y =
    Math.sin(lambdaRad) * Math.cos(epsilonRad) -
    Math.tan(betaRad) * Math.sin(epsilonRad);
  const x = Math.cos(lambdaRad);
  const raDeg = normalizeDegrees(radToDeg(Math.atan2(y, x)));

  return { raDeg, decDeg };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function getMeanObliquityDeg(date: Date): number {
  const t = julianCenturiesSinceJ2000(date);
  return 23.439291 - 0.0130042 * t;
}
