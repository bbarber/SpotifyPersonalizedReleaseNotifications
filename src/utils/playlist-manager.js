/**
 * Playlist Manager Module
 * Handles creation and management of date-based release playlists
 */

class PlaylistManager {
  constructor(spotifyApi) {
    this.spotifyApi = spotifyApi;
    this.playlistNamePattern = /^\d{4}-\d{2}-\d{2} Releases$/; // Match "YYYY-MM-DD Releases"
  }

  /**
   * Create a date-based playlist name
   * @param {string} date - Date in YYYY-MM-DD format
   * @returns {string} Playlist name
   */
  createPlaylistName(date) {
    return `${date} Releases`;
  }

  /**
   * Get today's date in YYYY-MM-DD format
   * @returns {string} Today's date
   */
  getTodayDate() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Find all existing date-based playlists created by this app
   * @returns {Promise<Array>} Array of playlist objects
   */
  async findExistingDatePlaylists() {
    try {
      const datePlaylists = [];
      let offset = 0;
      const limit = 50;
      let hasMore = true;

      while (hasMore) {
        const response = await this.spotifyApi.getUserPlaylists({ offset, limit });
        const playlists = response.body.items;

        // Filter for our date-based playlist pattern
        const matchingPlaylists = playlists.filter(playlist => 
          this.playlistNamePattern.test(playlist.name)
        );

        datePlaylists.push(...matchingPlaylists);

        hasMore = playlists.length === limit;
        offset += limit;
      }

      return datePlaylists;

    } catch (error) {
      throw new Error(`Failed to fetch existing playlists: ${error.message}`);
    }
  }

  /**
   * Get all track IDs from existing date-based playlists
   * @returns {Promise<Set>} Set of track IDs to exclude
   */
  async getExcludedTrackIds() {
    try {
      const datePlaylists = await this.findExistingDatePlaylists();
      const excludedTrackIds = new Set();

      for (const playlist of datePlaylists) {
        const trackIds = await this.getPlaylistTrackIds(playlist.id);
        trackIds.forEach(trackId => excludedTrackIds.add(trackId));
      }

      return excludedTrackIds;

    } catch (error) {
      throw new Error(`Failed to get excluded track IDs: ${error.message}`);
    }
  }

  /**
   * Get all track IDs from a specific playlist
   * @param {string} playlistId - Spotify playlist ID
   * @returns {Promise<Array>} Array of track IDs
   */
  async getPlaylistTrackIds(playlistId) {
    try {
      const trackIds = [];
      let offset = 0;
      const limit = 100;
      let hasMore = true;

      while (hasMore) {
        const response = await this.spotifyApi.getPlaylistTracks(playlistId, { offset, limit });
        const tracks = response.body.items;

        tracks.forEach(item => {
          if (item.track && item.track.id) {
            trackIds.push(item.track.id);
          }
        });

        hasMore = tracks.length === limit;
        offset += limit;
      }

      return trackIds;

    } catch (error) {
      throw new Error(`Failed to get playlist tracks for ${playlistId}: ${error.message}`);
    }
  }

  /**
   * Find existing playlist for today's date
   * @param {string} date - Date in YYYY-MM-DD format
   * @returns {Promise<Object|null>} Playlist object or null if not found
   */
  async findTodayPlaylist(date) {
    try {
      const playlistName = this.createPlaylistName(date);
      
      // Get user's playlists (first page should be enough for recent playlists)
      const response = await this.spotifyApi.getUserPlaylists({ limit: 50 });
      const playlists = response.body.items;

      // Find playlist with exact name match
      const existingPlaylist = playlists.find(playlist => 
        playlist.name === playlistName
      );

      return existingPlaylist || null;

    } catch (error) {
      throw new Error(`Failed to find today's playlist: ${error.message}`);
    }
  }

  /**
   * Create a new date-based playlist
   * @param {string} date - Date in YYYY-MM-DD format
   * @returns {Promise<Object>} Created playlist object
   */
  async createDatePlaylist(date) {
    try {
      const playlistName = this.createPlaylistName(date);
      const description = `New album and EP releases from ${date}. Generated automatically by Spotify Release Notifications.`;

      const response = await this.spotifyApi.createPlaylist(playlistName, {
        description: description,
        public: false // Always private
      });

      return response.body;

    } catch (error) {
      throw new Error(`Failed to create playlist for ${date}: ${error.message}`);
    }
  }

  /**
   * Add tracks to a playlist in batches
   * @param {string} playlistId - Spotify playlist ID
   * @param {Array} trackUris - Array of Spotify track URIs
   * @returns {Promise<void>}
   */
  async addTracksToPlaylist(playlistId, trackUris) {
    try {
      if (!trackUris || trackUris.length === 0) {
        return;
      }

      // Spotify allows max 100 tracks per request
      const batchSize = 100;
      
      for (let i = 0; i < trackUris.length; i += batchSize) {
        const batch = trackUris.slice(i, i + batchSize);
        await this.spotifyApi.addTracksToPlaylist(playlistId, batch);
        
        // Small delay between batches to respect rate limits
        if (i + batchSize < trackUris.length) {
          await this.delay(100);
        }
      }

    } catch (error) {
      throw new Error(`Failed to add tracks to playlist ${playlistId}: ${error.message}`);
    }
  }

  /**
   * Create a custom playlist with selected tracks
   * @param {string} playlistName - Name for the playlist
   * @param {Array} tracks - Array of track objects with id and uri properties
   * @returns {Promise<Object>} Result object with playlist info and stats
   */
  async createCustomPlaylist(playlistName, tracks) {
    try {
      if (!tracks || tracks.length === 0) {
        return {
          playlist: null,
          tracksAdded: 0,
          tracksSkipped: 0,
          message: 'No tracks provided for playlist creation'
        };
      }

      // Create the playlist
      const description = `Custom playlist created by Spotify Release Notifications. Contains ${tracks.length} selected tracks.`;
      
      const response = await this.spotifyApi.createPlaylist(playlistName, {
        description: description,
        public: false // Always private
      });

      const playlist = response.body;

      // Add all tracks to the playlist
      const trackUris = tracks.map(track => track.uri);
      await this.addTracksToPlaylist(playlist.id, trackUris);

      return {
        playlist: playlist,
        playlistCreated: true,
        tracksAdded: tracks.length,
        tracksSkipped: 0,
        totalTracksInPlaylist: tracks.length,
        message: 'Created new playlist with selected tracks'
      };

    } catch (error) {
      throw new Error(`Failed to create custom playlist: ${error.message}`);
    }
  }

  /**
   * Create or update today's playlist with new tracks (original method for backwards compatibility)
   * @param {Array} tracks - Array of track objects with id and uri properties
   * @returns {Promise<Object>} Result object with playlist info and stats
   */
  async createOrUpdateTodayPlaylist(tracks) {
    const today = this.getTodayDate();
    const playlistName = this.createPlaylistName(today);
    
    try {
      // Filter out tracks that already exist in previous playlists
      const excludedTrackIds = await this.getExcludedTrackIds();
      const newTracks = tracks.filter(track => !excludedTrackIds.has(track.id));

      if (newTracks.length === 0) {
        return {
          playlist: null,
          tracksAdded: 0,
          tracksSkipped: tracks.length,
          message: 'No new tracks to add - all tracks already exist in previous playlists'
        };
      }

      // Check if today's playlist already exists
      let playlist = await this.findTodayPlaylist(today);
      let playlistCreated = false;

      if (!playlist) {
        playlist = await this.createDatePlaylist(today);
        playlistCreated = true;
      }

      // Get existing tracks in today's playlist to avoid duplicates within the same playlist
      const existingTrackIds = await this.getPlaylistTrackIds(playlist.id);
      const existingSet = new Set(existingTrackIds);
      
      const tracksToAdd = newTracks.filter(track => !existingSet.has(track.id));

      if (tracksToAdd.length > 0) {
        const trackUris = tracksToAdd.map(track => track.uri);
        await this.addTracksToPlaylist(playlist.id, trackUris);
      }

      return {
        playlist: playlist,
        playlistCreated: playlistCreated,
        tracksAdded: tracksToAdd.length,
        tracksSkipped: tracks.length - tracksToAdd.length,
        totalTracksInPlaylist: existingTrackIds.length + tracksToAdd.length,
        message: playlistCreated ? 'Created new playlist' : 'Updated existing playlist'
      };

    } catch (error) {
      throw new Error(`Failed to create or update today's playlist: ${error.message}`);
    }
  }

  /**
   * Simple delay utility
   * @param {number} ms - Milliseconds to delay
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get playlist statistics
   * @param {Array} datePlaylists - Array of date-based playlists
   * @returns {Object} Statistics object
   */
  getStatistics(datePlaylists) {
    if (!datePlaylists || datePlaylists.length === 0) {
      return {
        totalPlaylists: 0,
        totalTracks: 0,
        dateRange: null,
        averageTracksPerPlaylist: 0
      };
    }

    const totalTracks = datePlaylists.reduce((sum, playlist) => sum + playlist.tracks.total, 0);
    const playlistNames = datePlaylists.map(p => p.name).sort();
    const dateRange = playlistNames.length > 1 
      ? `${playlistNames[0].split(' ')[0]} to ${playlistNames[playlistNames.length - 1].split(' ')[0]}`
      : playlistNames[0].split(' ')[0];

    return {
      totalPlaylists: datePlaylists.length,
      totalTracks: totalTracks,
      dateRange: dateRange,
      averageTracksPerPlaylist: Math.round(totalTracks / datePlaylists.length)
    };
  }
}

module.exports = PlaylistManager;