/**
 * Release filtering utilities for Spotify albums
 * Filters releases to show only albums and EPs from the last 10 days
 */

/**
 * Check if an album should be considered an album or EP (not a single)
 * @param {Object} album - Spotify album object
 * @returns {boolean} - True if album or EP, false if single
 */
const isAlbumOrEP = (album) => {
  // Definitely an album
  if (album.album_type === 'album') return true;
  
  // Potential EP detection for singles
  if (album.album_type === 'single') {
    // EP detection heuristics:
    // 1. 4+ tracks typically indicates an EP
    // 2. Contains "EP" in the name
    return album.total_tracks >= 4 || 
           album.name.toLowerCase().includes('ep');
  }
  
  // Exclude compilations and other types
  return false;
};

/**
 * Parse a Spotify release date string into a Date object
 * Handles various precision levels: YYYY, YYYY-MM, YYYY-MM-DD
 * @param {string} releaseDateString - Spotify release date
 * @returns {Date} - Parsed date object
 */
const parseReleaseDate = (releaseDateString) => {
  if (!releaseDateString) return null;
  
  const parts = releaseDateString.split('-');
  const year = parseInt(parts[0], 10);
  const month = parts[1] ? parseInt(parts[1], 10) - 1 : 0; // JS months are 0-indexed
  const day = parts[2] ? parseInt(parts[2], 10) : 1;
  
  return new Date(year, month, day);
};

/**
 * Check if a release is within the specified number of days
 * @param {Object} album - Spotify album object
 * @param {number} daysBack - Number of days to look back (default: 10)
 * @returns {boolean} - True if release is recent
 */
const isRecentRelease = (album, daysBack = 10) => {
  const releaseDate = parseReleaseDate(album.release_date);
  if (!releaseDate) return false;
  
  const now = new Date();
  const cutoffDate = new Date(now.getTime() - (daysBack * 24 * 60 * 60 * 1000));
  
  return releaseDate >= cutoffDate;
};

/**
 * Sort albums by release date (newest first)
 * @param {Object} a - First album to compare
 * @param {Object} b - Second album to compare
 * @returns {number} - Sort comparison result
 */
const sortByReleaseDate = (a, b) => {
  const dateA = parseReleaseDate(a.release_date);
  const dateB = parseReleaseDate(b.release_date);
  
  if (!dateA && !dateB) return 0;
  if (!dateA) return 1;
  if (!dateB) return -1;
  
  return dateB.getTime() - dateA.getTime(); // Newest first
};

/**
 * Filter and sort albums to show only recent albums and EPs
 * @param {Array} albums - Array of Spotify album objects
 * @param {Object} options - Filtering options
 * @param {number} options.daysBack - Number of days to look back (default: 10)
 * @returns {Array} - Filtered and sorted albums
 */
const filterReleases = (albums, options = {}) => {
  const { daysBack = 10 } = options;
  
  return albums
    .filter(album => isAlbumOrEP(album))
    .filter(album => isRecentRelease(album, daysBack))
    .sort(sortByReleaseDate);
};

/**
 * Calculate days since release
 * @param {string} releaseDateString - Spotify release date
 * @returns {number} - Days since release
 */
const daysSinceRelease = (releaseDateString) => {
  const releaseDate = parseReleaseDate(releaseDateString);
  if (!releaseDate) return null;
  
  const now = new Date();
  const diffTime = now.getTime() - releaseDate.getTime();
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
};

module.exports = {
  isAlbumOrEP,
  parseReleaseDate,
  isRecentRelease,
  sortByReleaseDate,
  filterReleases,
  daysSinceRelease
};