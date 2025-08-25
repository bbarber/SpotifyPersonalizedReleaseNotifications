/**
 * Album Retrieval Module
 * Fetches albums and EPs for a list of artists from Spotify
 */

const cliProgress = require('cli-progress');

class AlbumRetrieval {
  constructor(spotifyApi, options = {}) {
    this.spotifyApi = spotifyApi;
    this.rateLimitDelay = 100; // Base delay between requests (ms)
    this.batchSize = 10; // Number of artists to process concurrently
    this.useSearchOptimization = options.useSearchOptimization === true; // Disable by default due to API issues
    this.progressBar = null; // Progress bar instance
  }

  /**
   * Check if an album is older than specified days
   * @param {string} releaseDateString - Spotify release date
   * @param {number} daysBack - Number of days to look back
   * @returns {boolean} - True if album is older than the cutoff
   */
  isOlderThanDays(releaseDateString, daysBack = 10) {
    if (!releaseDateString) return true; // Treat missing dates as old
    
    const parts = releaseDateString.split('-');
    const year = parseInt(parts[0], 10);
    const month = parts[1] ? parseInt(parts[1], 10) - 1 : 0; // JS months are 0-indexed
    const day = parts[2] ? parseInt(parts[2], 10) : 1;
    
    const releaseDate = new Date(year, month, day);
    const now = new Date();
    const cutoffDate = new Date(now.getTime() - (daysBack * 24 * 60 * 60 * 1000));
    
    return releaseDate < cutoffDate;
  }

  /**
   * Fetch recent albums using search API with tag:new filter (optimized)
   * @param {Object} artist - Artist object with id and name
   * @returns {Promise<Array>} Array of recent albums for the artist
   */
  async fetchRecentAlbumsViaSearch(artist) {
    try {
      // Try different search approaches since tag:new might have issues
      const searchQueries = [
        // Primary: tag:new filter
        `artist:"${artist.name}" tag:new`,
        // Fallback: without tag:new, just recent by default search sorting
        `artist:"${artist.name}"`
      ];

      for (const query of searchQueries) {
        try {
          // Search for albums
          const albumResponse = await this.spotifyApi.search(query, ['album'], {
            market: 'from_token',
            limit: 20 // Smaller limit since we're searching
          });

          let allAlbums = [];

          // Process album results
          if (albumResponse.body.albums && albumResponse.body.albums.items) {
            const albums = albumResponse.body.albums.items
              .filter(album => {
                // Ensure exact artist match
                return album.artists.some(a => a.id === artist.id);
              })
              .filter(album => {
                // Only include recent releases (10 days) if not using tag:new
                if (!query.includes('tag:new')) {
                  return !this.isOlderThanDays(album.release_date, 10);
                }
                return true; // tag:new already filters for recent
              })
              .map(album => ({
                id: album.id,
                name: album.name,
                album_type: album.album_type,
                total_tracks: album.total_tracks,
                release_date: album.release_date,
                release_date_precision: album.release_date_precision,
                spotify_url: album.external_urls.spotify,
                artist_id: artist.id,
                artist_name: artist.name,
                artists: album.artists.map(a => ({
                  id: a.id,
                  name: a.name
                })),
                images: album.images
              }));

            allAlbums = albums;
          }

          // If we found results or this was the tag:new query, return results
          if (allAlbums.length > 0 || query.includes('tag:new')) {
            return allAlbums;
          }

        } catch (queryError) {
          // If tag:new query fails, try the fallback
          if (query.includes('tag:new')) {
            continue;
          }
          throw queryError; // If fallback search fails, throw error
        }
      }

      return []; // No results found

    } catch (error) {
      // Silently fall back to artist albums endpoint - progress bar will show overall progress
      return this.fetchArtistAlbumsWithEarlyTermination(artist);
    }
  }

  /**
   * Fetch albums for a single artist with early termination (fallback method)
   * @param {Object} artist - Artist object with id and name
   * @returns {Promise<Array>} Array of albums for the artist
   */
  async fetchArtistAlbumsWithEarlyTermination(artist) {
    try {
      let allAlbums = [];
      let offset = 0;
      let totalAvailable = null;
      const limit = 20; // Reduced from 50 since we expect early termination

      while (totalAvailable === null || offset < totalAvailable) {
        const response = await this.spotifyApi.getArtistAlbums(artist.id, {
          include_groups: 'album,single', // Include albums and singles (will filter EPs from singles later)
          market: 'from_token',
          limit: limit,
          offset: offset
        });

        // Store total on first response
        if (totalAvailable === null) {
          totalAvailable = response.body.total;
        }

        const albums = response.body.items.map(album => ({
          id: album.id,
          name: album.name,
          album_type: album.album_type,
          total_tracks: album.total_tracks,
          release_date: album.release_date,
          release_date_precision: album.release_date_precision,
          spotify_url: album.external_urls.spotify,
          artist_id: artist.id,
          artist_name: artist.name,
          artists: album.artists.map(a => ({
            id: a.id,
            name: a.name
          })),
          images: album.images
        }));

        // Early termination: if we hit albums older than 10 days, stop fetching
        let foundOldAlbum = false;
        for (const album of albums) {
          if (this.isOlderThanDays(album.release_date, 10)) {
            foundOldAlbum = true;
            break;
          }
        }

        allAlbums.push(...albums);
        
        // Stop if we found an old album (since they're sorted by date)
        if (foundOldAlbum) {
          break;
        }
        
        offset += albums.length;
        
        // Break if we got fewer results than requested (last page)
        if (albums.length < limit) {
          break;
        }
      }

      return allAlbums;

    } catch (error) {
      if (error.statusCode === 429) {
        // Rate limited
        const retryAfter = error.headers['retry-after'] || 1;
        throw new Error(`Rate limited. Retry after ${retryAfter} seconds`);
      } else if (error.statusCode === 404) {
        // Artist not found - return empty result silently
        return [];
      } else if (error.statusCode >= 500) {
        throw new Error(`Spotify API error for ${artist.name}: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Fetch albums for a single artist (main method - uses optimized approach)
   * @param {Object} artist - Artist object with id and name
   * @returns {Promise<Array>} Array of albums for the artist
   */
  async fetchArtistAlbums(artist) {
    // Use optimization if enabled, otherwise use traditional method with early termination
    if (this.useSearchOptimization) {
      return this.fetchRecentAlbumsViaSearch(artist);
    } else {
      return this.fetchArtistAlbumsWithEarlyTermination(artist);
    }
  }

  /**
   * Process a batch of artists with rate limiting
   * @param {Array} artistBatch - Array of artists to process
   * @param {number} batchNumber - Batch number for logging
   * @returns {Promise<Array>} Array of albums from all artists in batch
   */
  async processBatch(artistBatch, batchNumber) {
    const batchResults = [];
    
    for (let i = 0; i < artistBatch.length; i++) {
      const artist = artistBatch[i];
      
      try {
        // Add delay between requests to respect rate limits
        if (i > 0) {
          await this.delay(this.rateLimitDelay);
        }
        
        const albums = await this.fetchArtistAlbums(artist);
        
        if (albums.length > 0) {
          batchResults.push(...albums);
        }
        
      } catch (error) {
        if (error.message.includes('Rate limited')) {
          // Extract wait time or use default
          const waitTime = parseInt(error.message.match(/\d+/)?.[0] || '60');
          await this.delay(waitTime * 1000);
          
          // Retry this artist
          try {
            const albums = await this.fetchArtistAlbums(artist);
            if (albums.length > 0) {
              batchResults.push(...albums);
            }
          } catch (retryError) {
            // Silent retry failure - progress bar will show overall progress
          }
        }
      }
    }
    
    return batchResults;
  }

  /**
   * Fetch albums for all artists with batching and rate limiting
   * @param {Array} artists - Array of artist objects
   * @returns {Promise<Array>} Array of all albums from all artists
   */
  async fetchAllArtistAlbums(artists) {
    console.log('\n--- Retrieving Albums for All Artists ---');
    console.log(`📥 Fetching albums for ${artists.length} artists...`);
    console.log(`   Using batch size: ${this.batchSize}, delay: ${this.rateLimitDelay}ms\n`);

    const allAlbums = [];
    const totalBatches = Math.ceil(artists.length / this.batchSize);
    
    // Initialize progress bar
    this.progressBar = new cliProgress.SingleBar({
      format: '🎵 Progress |{bar}| {percentage}% | {value}/{total} artists | ETA: {eta}s | {status}',
      barCompleteChar: '\u2588',
      barIncompleteChar: '\u2591',
      hideCursor: true,
      barsize: 30,
      stopOnComplete: true,
      clearOnComplete: false
    });

    this.progressBar.start(artists.length, 0, { status: 'Starting...' });
    
    try {
      let processedArtists = 0;
      
      for (let i = 0; i < artists.length; i += this.batchSize) {
        const batchNumber = Math.floor(i / this.batchSize) + 1;
        const artistBatch = artists.slice(i, i + this.batchSize);
        
        this.progressBar.update(processedArtists, { 
          status: `Batch ${batchNumber}/${totalBatches}` 
        });
        
        const batchAlbums = await this.processBatch(artistBatch, batchNumber);
        allAlbums.push(...batchAlbums);
        
        processedArtists += artistBatch.length;
        this.progressBar.update(processedArtists, { 
          status: `${allAlbums.length} albums found` 
        });
        
        // Larger delay between batches to be extra respectful
        if (batchNumber < totalBatches) {
          await this.delay(this.rateLimitDelay * 2);
        }
      }

      this.progressBar.update(artists.length, { 
        status: `Complete! ${allAlbums.length} total albums` 
      });
      this.progressBar.stop();
      
      console.log(`\n✅ Retrieved ${allAlbums.length} total albums from ${artists.length} artists`);
      return allAlbums;

    } catch (error) {
      if (this.progressBar) {
        this.progressBar.stop();
      }
      console.error('\n❌ Error during album retrieval:', error.message);
      
      // Return partial results if we got some data
      if (allAlbums.length > 0) {
        console.log(`⚠️  Returning ${allAlbums.length} albums retrieved before error`);
        return allAlbums;
      }
      
      throw error;
    }
  }

  /**
   * Get statistics about retrieved albums
   * @param {Array} albums - Array of album objects
   * @returns {Object} Statistics object
   */
  getStatistics(albums) {
    if (!albums || albums.length === 0) {
      return {
        total: 0,
        byType: { album: 0, single: 0 },
        byYear: {},
        averageTracks: 0,
        uniqueArtists: 0
      };
    }

    const stats = {
      total: albums.length,
      byType: { album: 0, single: 0 },
      byYear: {},
      averageTracks: 0,
      uniqueArtists: new Set()
    };

    let totalTracks = 0;

    albums.forEach(album => {
      // Count by type
      stats.byType[album.album_type]++;
      
      // Count tracks
      totalTracks += album.total_tracks;
      
      // Count by year
      if (album.release_date) {
        const year = album.release_date.substring(0, 4);
        stats.byYear[year] = (stats.byYear[year] || 0) + 1;
      }
      
      // Track unique artists
      stats.uniqueArtists.add(album.artist_id);
    });

    stats.averageTracks = Math.round(totalTracks / albums.length);
    stats.uniqueArtists = stats.uniqueArtists.size;

    return stats;
  }

  /**
   * Get recent albums (last 2 years by default)
   * @param {Array} albums - Array of album objects
   * @param {number} yearsBack - Number of years to look back (default: 2)
   * @returns {Array} Recent albums
   */
  getRecentAlbums(albums, yearsBack = 2) {
    const currentYear = new Date().getFullYear();
    const cutoffYear = currentYear - yearsBack;
    
    return albums.filter(album => {
      if (!album.release_date) return false;
      const year = parseInt(album.release_date.substring(0, 4));
      return year >= cutoffYear;
    });
  }

  /**
   * Simple delay utility
   * @param {number} ms - Milliseconds to delay
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = AlbumRetrieval;