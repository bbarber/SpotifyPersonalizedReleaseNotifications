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

/**
 * Filter albums to only include albums and EPs (exclude singles)
 * @param {Array} albums - Array of Spotify album objects
 * @returns {Array} - Filtered albums containing only albums and EPs
 */
const filterAlbumsAndEPs = (albums) => {
  return albums.filter(album => isAlbumOrEP(album));
};

/**
 * Extract all tracks from a release using the Spotify API
 * @param {Object} spotifyApi - Spotify API instance
 * @param {Object} release - Album/EP object
 * @returns {Promise<Array>} - Array of track objects with id, uri, name, and album info
 */
const extractAllTracks = async (spotifyApi, release) => {
  try {
    const tracks = [];
    let offset = 0;
    const limit = 50;
    let hasMore = true;

    while (hasMore) {
      const response = await spotifyApi.getAlbumTracks(release.id, { offset, limit });
      const albumTracks = response.body.items;

      albumTracks.forEach(track => {
        if (track.id && track.uri) {
          tracks.push({
            id: track.id,
            uri: track.uri,
            name: track.name,
            track_number: track.track_number,
            duration_ms: track.duration_ms,
            explicit: track.explicit,
            preview_url: track.preview_url,
            album: {
              id: release.id,
              name: release.name,
              release_date: release.release_date,
              album_type: release.album_type,
              artists: release.artists
            },
            artists: track.artists
          });
        }
      });

      hasMore = albumTracks.length === limit;
      offset += limit;
    }

    return tracks;

  } catch (error) {
    console.error(`Failed to extract tracks from ${release.name}: ${error.message}`);
    return [];
  }
};

/**
 * Extract all tracks from multiple releases
 * @param {Object} spotifyApi - Spotify API instance
 * @param {Array} releases - Array of album/EP objects
 * @returns {Promise<Array>} - Array of all tracks from all releases
 */
const extractAllTracksFromReleases = async (spotifyApi, releases) => {
  const allTracks = [];
  
  for (const release of releases) {
    const tracks = await extractAllTracks(spotifyApi, release);
    allTracks.push(...tracks);
    
    // Small delay to respect rate limits
    if (releases.indexOf(release) < releases.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  }

  return allTracks;
};

/**
 * Remove duplicate tracks by track ID
 * @param {Array} tracks - Array of track objects
 * @returns {Array} - Deduplicated array of tracks
 */
const removeDuplicateTracks = (tracks) => {
  const seen = new Set();
  return tracks.filter(track => {
    if (seen.has(track.id)) {
      return false;
    }
    seen.add(track.id);
    return true;
  });
};

/**
 * Get playlist-ready tracks from releases (filtered, deduplicated, with all track data)
 * @param {Object} spotifyApi - Spotify API instance
 * @param {Array} albums - Array of album objects from album retrieval
 * @param {Object} options - Options for filtering
 * @param {number} options.daysBack - Number of days to look back (default: 10)
 * @returns {Promise<Array>} - Array of track objects ready for playlist creation
 */
const getPlaylistReadyTracks = async (spotifyApi, albums, options = {}) => {
  // Filter to albums and EPs only
  const albumsAndEPs = filterAlbumsAndEPs(albums);
  
  // Filter for recent releases
  const recentReleases = filterReleases(albumsAndEPs, options);
  
  // Extract all tracks from these releases
  const allTracks = await extractAllTracksFromReleases(spotifyApi, recentReleases);
  
  // Remove duplicates
  const uniqueTracks = removeDuplicateTracks(allTracks);
  
  return uniqueTracks;
};

module.exports = {
  isAlbumOrEP,
  parseReleaseDate,
  isRecentRelease,
  sortByReleaseDate,
  filterReleases,
  daysSinceRelease,
  filterAlbumsAndEPs,
  extractAllTracks,
  extractAllTracksFromReleases,
  removeDuplicateTracks,
  getPlaylistReadyTracks
};