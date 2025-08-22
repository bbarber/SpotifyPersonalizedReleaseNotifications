/**
 * Saved Albums Artists Extraction Module
 * Extracts unique artists from the user's saved albums on Spotify
 */

class SavedAlbumsArtists {
  constructor(spotifyApi) {
    this.spotifyApi = spotifyApi;
  }

  /**
   * Fetch a single page of saved albums
   * @param {number} offset - Offset for pagination
   * @param {number} limit - Number of albums to fetch (max 50)
   * @returns {Promise<Object>} Page of saved albums
   */
  async fetchAlbumsPage(offset = 0, limit = 50) {
    try {
      const options = {
        limit: Math.min(limit, 50), // Spotify max is 50
        offset: offset,
        market: 'from_token' // Use user's market
      };

      const response = await this.spotifyApi.getMySavedAlbums(options);
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
   * Extract all unique artists from saved albums
   * @returns {Promise<Array>} Array of unique artists from saved albums
   */
  async extractAll() {
    const artistsMap = new Map(); // Use Map for O(1) deduplication by artist ID
    let offset = 0;
    let totalFetched = 0;
    let totalAlbums = null;
    let hasMoreItems = true;

    console.log('📥 Fetching saved albums to extract artists...');

    try {
      while (hasMoreItems && (totalAlbums === null || offset < totalAlbums)) {
        // Add small delay to be respectful to API
        if (offset > 0) {
          await this.delay(100);
        }

        const page = await this.fetchAlbumsPage(offset, 50);
        
        // Store total on first page
        if (totalAlbums === null) {
          totalAlbums = page.total;
          console.log(`   Found ${totalAlbums} saved albums to process`);
        }

        if (page.items && page.items.length > 0) {
          // Extract artists from each album
          page.items.forEach(item => {
            if (item.album && item.album.artists) {
              item.album.artists.forEach(artist => {
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
          
          // Show progress every 100 albums or at the end
          if (totalFetched % 100 === 0 || totalFetched === totalAlbums) {
            console.log(`   Processed ${totalFetched}/${totalAlbums} albums, found ${artistsMap.size} unique artists...`);
          }

          // Set up next pagination
          offset += page.items.length;
          hasMoreItems = page.items.length === 50; // Still more items if we got a full page
        } else {
          // No more items
          hasMoreItems = false;
        }
      }

      // Convert Map to Array
      const uniqueArtists = Array.from(artistsMap.values());

      console.log(`✅ Extracted ${uniqueArtists.length} unique artists from ${totalFetched} saved albums`);
      return uniqueArtists;

    } catch (error) {
      console.error('❌ Error extracting artists from saved albums:', error.message);
      
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
   * Get statistics about saved album artists
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

module.exports = SavedAlbumsArtists;