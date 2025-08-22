/**
 * Console output formatting utilities
 * Formats release data for clean terminal display
 */

/**
 * Format release date for display
 * @param {string} releaseDateString - Spotify release date
 * @returns {string} - Formatted date string
 */
const formatReleaseDate = (releaseDateString) => {
  if (!releaseDateString) return 'Unknown date';
  
  // Handle different date precisions
  const parts = releaseDateString.split('-');
  if (parts.length === 3) {
    // Full date: YYYY-MM-DD
    return releaseDateString;
  } else if (parts.length === 2) {
    // Year and month: YYYY-MM
    return `${releaseDateString}-01`;
  } else {
    // Year only: YYYY
    return `${releaseDateString}-01-01`;
  }
};

/**
 * Format track count with proper pluralization
 * @param {number} trackCount - Number of tracks
 * @returns {string} - Formatted track count string
 */
const formatTrackCount = (trackCount) => {
  if (!trackCount || trackCount < 1) return '0 tracks';
  return trackCount === 1 ? '1 track' : `${trackCount} tracks`;
};

/**
 * Generate Spotify album URL
 * @param {string} albumId - Spotify album ID
 * @returns {string} - Full Spotify URL
 */
const generateSpotifyUrl = (albumId) => {
  if (!albumId) return 'No link available';
  return `https://open.spotify.com/album/${albumId}`;
};

/**
 * Format a single release entry
 * @param {Object} release - Release object with artist and album data
 * @returns {string} - Formatted release entry
 */
const formatReleaseEntry = (release) => {
  const artistName = release.artists?.[0]?.name || 'Unknown Artist';
  const albumName = release.name || 'Unknown Album';
  const trackCount = formatTrackCount(release.total_tracks);
  const releaseDate = formatReleaseDate(release.release_date);
  const spotifyUrl = generateSpotifyUrl(release.id);
  
  return [
    `Artist: ${artistName}`,
    `Album:  ${albumName} (${trackCount})`,
    `Link:   ${spotifyUrl}`,
    `Date:   ${releaseDate}`,
    ''
  ].join('\n');
};

/**
 * Generate header section
 * @param {number} releaseCount - Number of releases found
 * @param {number} daysBack - Number of days searched
 * @returns {string} - Formatted header
 */
const formatHeader = (releaseCount, daysBack = 10) => {
  const separator = '═'.repeat(47);
  
  if (releaseCount === 0) {
    return [
      '🎵 New Releases from Your Followed Artists',
      `No new albums or EPs found in the last ${daysBack} days.`,
      ''
    ].join('\n');
  }
  
  const releaseText = releaseCount === 1 ? 'album/EP' : 'albums/EPs';
  
  return [
    '🎵 New Releases from Your Followed Artists',
    `Found ${releaseCount} new ${releaseText} in the last ${daysBack} days`,
    separator,
    ''
  ].join('\n');
};

/**
 * Format complete output for releases
 * @param {Array} releases - Array of release objects
 * @param {Object} options - Formatting options
 * @param {number} options.daysBack - Number of days searched (default: 10)
 * @returns {string} - Complete formatted output
 */
const formatReleaseOutput = (releases, options = {}) => {
  const { daysBack = 10 } = options;
  
  const header = formatHeader(releases.length, daysBack);
  
  if (releases.length === 0) {
    return header;
  }
  
  const formattedReleases = releases
    .map(release => formatReleaseEntry(release))
    .join('\n');
  
  return header + formattedReleases;
};

/**
 * Format error message
 * @param {string} errorMessage - Error description
 * @returns {string} - Formatted error output
 */
const formatError = (errorMessage) => {
  return [
    '🎵 New Releases from Your Followed Artists',
    '═'.repeat(47),
    '',
    `❌ Error: ${errorMessage}`,
    '',
    'Please check your Spotify authentication and try again.',
    ''
  ].join('\n');
};

/**
 * Format authentication message
 * @returns {string} - Authentication prompt
 */
const formatAuthPrompt = () => {
  return [
    '🎵 Spotify Personalized Release Notifications',
    '═'.repeat(47),
    '',
    'Please authenticate with Spotify to continue...',
    'Your browser will open to complete the login process.',
    ''
  ].join('\n');
};

/**
 * Format loading message
 * @param {string} step - Current processing step
 * @returns {string} - Loading message
 */
const formatLoadingMessage = (step) => {
  return `⏳ ${step}...`;
};

/**
 * Clear the console and position cursor at top
 */
const clearConsole = () => {
  process.stdout.write('\x1b[2J\x1b[0f');
};

/**
 * Print text with optional clearing
 * @param {string} text - Text to print
 * @param {boolean} clear - Whether to clear console first
 */
const printOutput = (text, clear = false) => {
  if (clear) {
    clearConsole();
  }
  console.log(text);
};

module.exports = {
  formatReleaseDate,
  formatTrackCount,
  generateSpotifyUrl,
  formatReleaseEntry,
  formatHeader,
  formatReleaseOutput,
  formatError,
  formatAuthPrompt,
  formatLoadingMessage,
  clearConsole,
  printOutput
};