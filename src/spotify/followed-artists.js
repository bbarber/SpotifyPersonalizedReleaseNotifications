/**
 * Followed Artists Retrieval Module
 * Fetches all artists that the authenticated user follows on Spotify
 */

class FollowedArtists {
  constructor(spotifyApi) {
    this.spotifyApi = spotifyApi;
  }

  /**
   * Fetch a single page of followed artists
   * @param {string} after - Cursor for pagination (optional)
   * @param {number} limit - Number of artists to fetch (max 50)
   * @returns {Promise<Object>} Page of followed artists
   */
  async fetchPage(after = null, limit = 50) {
    try {
      const options = {
        type: 'artist',
        limit: Math.min(limit, 50) // Spotify max is 50
      };

      if (after) {
        options.after = after;
      }

      const response = await this.spotifyApi.getFollowedArtists(options);
      return response.body.artists;
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
   * Fetch all followed artists with pagination
   * @returns {Promise<Array>} Array of all followed artists
   */
  async fetchAll() {
    const allArtists = [];
    let after = null;
    let totalFetched = 0;
    let totalAvailable = null;

    console.log('📥 Fetching followed artists...');

    try {
      do {
        // Add small delay to be respectful to API
        if (after) {
          await this.delay(100);
        }

        const page = await this.fetchPage(after, 50);
        
        if (page.items && page.items.length > 0) {
          // Store total available on first page
          if (totalAvailable === null) {
            totalAvailable = page.total;
          }

          // Extract essential artist data
          const artists = page.items.map(artist => ({
            id: artist.id,
            name: artist.name,
            spotify_url: artist.external_urls.spotify,
            genres: artist.genres || [],
            popularity: artist.popularity || 0,
            followers: artist.followers ? artist.followers.total : 0
          }));

          allArtists.push(...artists);
          totalFetched += artists.length;

          console.log(`   Fetched ${totalFetched} followed artists...`);

          // Set up next pagination
          after = page.cursors && page.cursors.after ? page.cursors.after : null;
        } else {
          // No more items
          break;
        }

      } while (after && (totalAvailable === null || totalFetched < totalAvailable));

      console.log(`✅ Retrieved ${allArtists.length} followed artists`);
      return allArtists;

    } catch (error) {
      console.error('❌ Error fetching followed artists:', error.message);
      
      // Return partial results if we got some data
      if (allArtists.length > 0) {
        console.log(`⚠️  Returning ${allArtists.length} artists fetched before error`);
        return allArtists;
      }
      
      throw error;
    }
  }

  /**
   * Get statistics about followed artists
   * @param {Array} artists - Array of artist objects
   * @returns {Object} Statistics object
   */
  getStatistics(artists) {
    if (!artists || artists.length === 0) {
      return {
        total: 0,
        topGenres: [],
        averagePopularity: 0,
        totalFollowers: 0
      };
    }

    // Count genres
    const genreCounts = {};
    let totalPopularity = 0;
    let totalFollowers = 0;

    artists.forEach(artist => {
      // Count popularity
      if (artist.popularity) {
        totalPopularity += artist.popularity;
      }

      // Count followers
      if (artist.followers) {
        totalFollowers += artist.followers;
      }

      // Count genres
      if (artist.genres) {
        artist.genres.forEach(genre => {
          genreCounts[genre] = (genreCounts[genre] || 0) + 1;
        });
      }
    });

    // Get top 5 genres
    const topGenres = Object.entries(genreCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([genre, count]) => ({ genre, count }));

    return {
      total: artists.length,
      topGenres,
      averagePopularity: Math.round(totalPopularity / artists.length),
      totalFollowers
    };
  }

  /**
   * Simple delay utility
   * @param {number} ms - Milliseconds to delay
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = FollowedArtists;