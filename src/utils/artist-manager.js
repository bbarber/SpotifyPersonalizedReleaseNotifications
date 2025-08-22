/**
 * Artist List Management Module
 * Combines and manages artists from multiple sources (followed, liked tracks, saved albums)
 */

class ArtistManager {
  constructor() {
    this.combinedArtists = new Map(); // Use Map for efficient deduplication by artist ID
  }

  /**
   * Combine artists from multiple sources into a single deduplicated list
   * @param {Array} followedArtists - Artists from followed list
   * @param {Array} likedTrackArtists - Artists from liked tracks
   * @param {Array} savedAlbumArtists - Artists from saved albums
   * @returns {Array} Combined and deduplicated artist list
   */
  combineArtistSources(followedArtists = [], likedTrackArtists = [], savedAlbumArtists = []) {
    console.log('\n--- Combining Artist Lists ---');
    console.log('🔄 Merging artists from all sources...');

    // Clear any existing data
    this.combinedArtists.clear();

    // Process followed artists
    this.addArtistsFromSource(followedArtists, 'followed');
    
    // Process liked track artists
    this.addArtistsFromSource(likedTrackArtists, 'liked_tracks');
    
    // Process saved album artists
    this.addArtistsFromSource(savedAlbumArtists, 'saved_albums');

    // Convert Map to Array with combined source information
    const finalArtists = Array.from(this.combinedArtists.values());

    console.log(`✅ Combined into ${finalArtists.length} unique artists`);
    
    return finalArtists;
  }

  /**
   * Add artists from a specific source, handling deduplication and source tracking
   * @param {Array} artists - Artists from a source
   * @param {string} sourceName - Name of the source
   */
  addArtistsFromSource(artists, sourceName) {
    if (!artists || artists.length === 0) {
      console.log(`   ${sourceName}: 0 artists`);
      return;
    }

    let newArtists = 0;
    let duplicates = 0;

    artists.forEach(artist => {
      if (!artist.id) {
        console.warn(`   Warning: Artist without ID found: ${artist.name}`);
        return;
      }

      if (this.combinedArtists.has(artist.id)) {
        // Artist already exists, add this source to the sources array
        const existingArtist = this.combinedArtists.get(artist.id);
        if (!existingArtist.sources.includes(sourceName)) {
          existingArtist.sources.push(sourceName);
        }
        duplicates++;
      } else {
        // New artist, add with source information
        const enhancedArtist = {
          id: artist.id,
          name: artist.name,
          spotify_url: artist.spotify_url,
          sources: [sourceName],
          // Preserve additional data from followed artists if available
          ...(artist.genres && { genres: artist.genres }),
          ...(artist.popularity && { popularity: artist.popularity }),
          ...(artist.followers && { followers: artist.followers })
        };
        
        this.combinedArtists.set(artist.id, enhancedArtist);
        newArtists++;
      }
    });

    console.log(`   ${sourceName}: ${artists.length} artists (${newArtists} new, ${duplicates} duplicates)`);
  }

  /**
   * Get statistics about the combined artist list
   * @param {Array} artists - Combined artist list
   * @returns {Object} Statistics object
   */
  getStatistics(artists) {
    if (!artists || artists.length === 0) {
      return {
        total: 0,
        bySource: {},
        multipleSourceCount: 0,
        withGenres: 0,
        withPopularity: 0,
        averagePopularity: 0
      };
    }

    const stats = {
      total: artists.length,
      bySource: {
        followed: 0,
        liked_tracks: 0,
        saved_albums: 0
      },
      multipleSourceCount: 0,
      withGenres: 0,
      withPopularity: 0,
      averagePopularity: 0
    };

    let totalPopularity = 0;
    let popularityCount = 0;

    artists.forEach(artist => {
      // Count by source
      if (artist.sources.includes('followed')) stats.bySource.followed++;
      if (artist.sources.includes('liked_tracks')) stats.bySource.liked_tracks++;
      if (artist.sources.includes('saved_albums')) stats.bySource.saved_albums++;

      // Count artists with multiple sources
      if (artist.sources.length > 1) {
        stats.multipleSourceCount++;
      }

      // Count additional data
      if (artist.genres && artist.genres.length > 0) {
        stats.withGenres++;
      }

      if (artist.popularity !== undefined) {
        stats.withPopularity++;
        totalPopularity += artist.popularity;
        popularityCount++;
      }
    });

    if (popularityCount > 0) {
      stats.averagePopularity = Math.round(totalPopularity / popularityCount);
    }

    return stats;
  }

  /**
   * Get artists that appear in multiple sources (high confidence)
   * @param {Array} artists - Combined artist list
   * @returns {Array} Artists found in multiple sources
   */
  getMultiSourceArtists(artists) {
    return artists.filter(artist => artist.sources.length > 1);
  }

  /**
   * Filter artists by source
   * @param {Array} artists - Combined artist list
   * @param {string} sourceName - Source to filter by
   * @returns {Array} Artists from the specified source
   */
  getArtistsBySource(artists, sourceName) {
    return artists.filter(artist => artist.sources.includes(sourceName));
  }

  /**
   * Get sample artists for display
   * @param {Array} artists - Combined artist list
   * @param {number} count - Number of samples to return
   * @returns {Array} Sample artists
   */
  getSampleArtists(artists, count = 5) {
    if (!artists || artists.length === 0) {
      return [];
    }

    // Sort by multiple criteria for interesting samples
    const sortedArtists = artists.slice().sort((a, b) => {
      // Prioritize multi-source artists
      if (a.sources.length !== b.sources.length) {
        return b.sources.length - a.sources.length;
      }
      
      // Then by popularity if available
      if (a.popularity && b.popularity) {
        return b.popularity - a.popularity;
      }
      
      // Finally alphabetically
      return a.name.localeCompare(b.name);
    });

    return sortedArtists.slice(0, count);
  }

  /**
   * Validate artist data quality
   * @param {Array} artists - Combined artist list
   * @returns {Object} Validation report
   */
  validateArtistData(artists) {
    const validation = {
      total: artists.length,
      missingSpotifyUrl: 0,
      missingName: 0,
      duplicateNames: 0,
      valid: 0
    };

    const nameMap = new Map();

    artists.forEach(artist => {
      let isValid = true;

      if (!artist.name || artist.name.trim() === '') {
        validation.missingName++;
        isValid = false;
      } else {
        // Check for duplicate names (different IDs, same name)
        if (nameMap.has(artist.name.toLowerCase())) {
          validation.duplicateNames++;
        } else {
          nameMap.set(artist.name.toLowerCase(), true);
        }
      }

      if (!artist.spotify_url) {
        validation.missingSpotifyUrl++;
        isValid = false;
      }

      if (isValid) {
        validation.valid++;
      }
    });

    return validation;
  }
}

module.exports = ArtistManager;