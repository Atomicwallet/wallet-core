const VERSION_SPLITTER = /[.-]/;

/**
 * Splits and transforms version string into a version number pieces array.
 *
 * @param {string} versionString
 * @returns {number[]}
 */
function getVersionPieces(versionString) {
  const pieces = versionString
    .split(VERSION_SPLITTER)
    .map((piece) => Number(piece));

  if (pieces.includes(NaN)) {
    return [];
  }
  return pieces;
}

const VERSION_ZEROES = [30, 25, 20, 15, 10, 5];

/**
 * Transforms platform + version string into a comparable number.
 *
 * @deprecated use compareVersions or isSupportedAppVersion to compare versions
 * @param {string} platform
 * @param {string} value
 * @returns {number}
 */
export function getVersion(platform, value) {
  const pieces = getVersionPieces(value.replace(platform, ''));

  if (pieces.length > VERSION_ZEROES.length) {
    throw new TypeError(
      `getVersion supports maximum ${VERSION_ZEROES.length} version pieces`,
    );
  }

  return pieces.reduce(
    (version, piece, idx) => version + piece * 10 ** VERSION_ZEROES[idx],
    0,
  );
}

/**
 * Compares two versions for same platform.
 *
 * @param {string} first
 * @param {string} second
 * @returns {number} -1 for first < second, 0 for first = second, 1 for first > second
 */
export function compareVersions(first, second) {
  const [firstPieces, secondPieces] = [first, second].map((version) =>
    getVersionPieces(version),
  );
  const length = Math.max(firstPieces.length, secondPieces.length);

  for (let idx = 0; idx < length; idx += 1) {
    const left = firstPieces[idx] ?? 0;
    const right = secondPieces[idx] ?? 0;

    if (left !== right) {
      return left > right ? 1 : -1;
    }
  }
  return 0;
}

/**
 * Checks platform name and version string with a platform + version string (e.g. 'android1.0.0').
 *
 * @param {string} currentPlatform
 * @param {string} currentVersion
 * @param {string} supportedPlatformAndVersion
 * @returns {boolean} platform is supported and version is equal or greater than the supported one
 */
export function isSupportedAppVersion(
  currentPlatform,
  currentVersion,
  supportedPlatformAndVersion,
) {
  return (
    supportedPlatformAndVersion.startsWith(currentPlatform) &&
    compareVersions(
      currentVersion,
      supportedPlatformAndVersion.substring(currentPlatform.length),
    ) >= 0
  );
}
