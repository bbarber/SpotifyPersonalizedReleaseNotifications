/**
 * Liked Artists Extraction Module
 * Extracts unique artists from the user's saved (liked) tracks on Spotify
 */

class LikedArtists {
  constructor(spotifyApi) {
    this.spotifyApi = spotifyApi;
  }

  /**
   * Fetch a single page of saved tracks
   * @param {number} offset - Offset for pagination
   * @param {number} limit - Number of tracks to fetch (max 50)
   * @returns {Promise<Object>} Page of saved tracks
   */
  async fetchTracksPage(offset = 0, limit = 50) {
    try {
      const options = {
        limit: Math.min(limit, 50), // Spotify max is 50
        offset: offset,
        market: 'from_token' // Use user's market
      };

      const response = await this.spotifyApi.getMySavedTracks(options);
      return response.body;
    } catch (error) {
      if (error.statusCode === 429) {
        // Rate limited - extract retry-after header
        const retryAfter = error.headers['retry-after'] || 1;
        throw new Error(`Rate limited. Retry after ${retryAfter} seconds`);
      } else if (error.statusCode === 401) {
        throw new Error('Access token expired. Please re-authenticate');
      } else if (error.statusCode >= 500) {
        throw new Error(`Spotify API error: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Extract all unique artists from saved tracks
   * @returns {Promise<Array>} Array of unique artists from liked tracks
   */
  async extractAll() {
    const artistsMap = new Map(); // Use Map for O(1) deduplication by artist ID
    let offset = 0;
    let totalFetched = 0;
    let totalTracks = null;

    console.log('📥 Fetching saved tracks to extract artists...');

    try {
      do {
        // Add small delay to be respectful to API
        if (offset > 0) {
          await this.delay(100);
        }

        const page = await this.fetchTracksPage(offset, 50);
        
        // Store total on first page
        if (totalTracks === null) {
          totalTracks = page.total;
          console.log(`   Found ${totalTracks} saved tracks to process`);
        }

        if (page.items && page.items.length > 0) {
          // Extract artists from each track
          page.items.forEach(item => {
            if (item.track && item.track.artists) {
              item.track.artists.forEach(artist => {
                // Only add if we haven't seen this artist before
                if (!artistsMap.has(artist.id)) {
                  artistsMap.set(artist.id, {
                    id: artist.id,
                    name: artist.name,
                    spotify_url: artist.external_urls ? artist.external_urls.spotify : null
                  });
                }
              });
            }
          });

          totalFetched += page.items.length;
          
          // Show progress every 500 tracks
          if (totalFetched % 500 === 0 || totalFetched === totalTracks) {
            console.log(`   Processed ${totalFetched}/${totalTracks} tracks, found ${artistsMap.size} unique artists...`);
          }

          // Set up next pagination
          offset += page.items.length;
        } else {
          // No more items
          break;
        }

      } while (offset < totalTracks && page.items.length > 0);

      // Convert Map to Array
      const uniqueArtists = Array.from(artistsMap.values());

      console.log(`✅ Extracted ${uniqueArtists.length} unique artists from ${totalFetched} saved tracks`);
      return uniqueArtists;

    } catch (error) {
      console.error('❌ Error extracting artists from saved tracks:', error.message);
      
      // Return partial results if we got some data
      const partialArtists = Array.from(artistsMap.values());
      if (partialArtists.length > 0) {
        console.log(`⚠️  Returning ${partialArtists.length} artists extracted before error`);
        return partialArtists;
      }
      
      throw error;
    }
  }

  /**
   * Get statistics about liked artists
   * @param {Array} artists - Array of artist objects
   * @returns {Object} Statistics object
   */
  getStatistics(artists) {
    if (!artists || artists.length === 0) {
      return {
        total: 0,
        withSpotifyUrl: 0,
        missingUrl: 0
      };
    }

    const withUrl = artists.filter(artist => artist.spotify_url).length;
    const missingUrl = artists.length - withUrl;

    return {
      total: artists.length,
      withSpotifyUrl: withUrl,
      missingUrl: missingUrl
    };
  }

  /**
   * Get sample artists for display
   * @param {Array} artists - Array of artist objects
   * @param {number} count - Number of samples to return
   * @returns {Array} Sample artists
   */
  getSampleArtists(artists, count = 5) {
    if (!artists || artists.length === 0) {
      return [];
    }

    // Sort by name for consistent display
    const sortedArtists = artists
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name));

    return sortedArtists.slice(0, count);
  }

  /**
   * Simple delay utility
   * @param {number} ms - Milliseconds to delay
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = LikedArtists;