/**
 * Interactive Release Selection Module
 * Handles user interaction for selecting releases to add to playlists
 */

const readline = require('readline');

class InteractiveSelector {
  constructor() {
    this.rl = null;
    this.selectedReleases = new Set();
  }

  /**
   * Create readline interface for user input
   */
  createInterface() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  /**
   * Close readline interface
   */
  closeInterface() {
    if (this.rl) {
      this.rl.close();
      this.rl = null;
    }
  }

  /**
   * Display numbered list of releases for selection
   * @param {Array} releases - Array of release objects
   */
  displayReleases(releases) {
    if (releases.length === 0) {
      console.log('📭 No recent albums or EPs found.');
      return;
    }

    console.log('\n📋 Recent Albums & EPs (last 10 days):');
    console.log('═══════════════════════════════════════════════════════════════════');
    
    releases.forEach((release, index) => {
      const number = (index + 1).toString().padStart(2, ' ');
      const type = release.album_type === 'album' ? '💿' : '🎵';
      const selected = this.selectedReleases.has(index) ? '✅' : '  ';
      const artist = release.artist_name.padEnd(25).substring(0, 25);
      const title = release.name.padEnd(30).substring(0, 30);
      const tracks = String(release.total_tracks).padStart(2);
      const date = release.release_date;
      
      console.log(`${selected} ${number}. ${type} ${artist} | ${title} | ${date} | ${tracks} tracks`);
    });

    console.log('═══════════════════════════════════════════════════════════════════');
    
    if (this.selectedReleases.size > 0) {
      console.log(`\n🎯 Selected: ${this.selectedReleases.size} release(s)`);
    }
  }

  /**
   * Get user input with a prompt
   * @param {string} question - Question to ask the user
   * @returns {Promise<string>} User's answer
   */
  askQuestion(question) {
    return new Promise((resolve) => {
      this.rl.question(question, (answer) => {
        resolve(answer.trim());
      });
    });
  }

  /**
   * Parse user selection input (supports ranges and individual numbers)
   * @param {string} input - User input like "1,3,5-8,10"
   * @param {number} maxIndex - Maximum valid index
   * @returns {Array} Array of selected indices
   */
  parseSelection(input, maxIndex) {
    if (!input) return [];
    
    const selections = new Set();
    const parts = input.split(',').map(part => part.trim());
    
    for (const part of parts) {
      if (part.includes('-')) {
        // Handle range like "5-8"
        const [start, end] = part.split('-').map(num => parseInt(num.trim()) - 1);
        if (!isNaN(start) && !isNaN(end) && start >= 0 && end < maxIndex && start <= end) {
          for (let i = start; i <= end; i++) {
            selections.add(i);
          }
        }
      } else {
        // Handle individual number
        const num = parseInt(part) - 1;
        if (!isNaN(num) && num >= 0 && num < maxIndex) {
          selections.add(num);
        }
      }
    }
    
    return Array.from(selections);
  }

  /**
   * Toggle selection for releases
   * @param {Array} indices - Array of indices to toggle
   */
  toggleSelections(indices) {
    indices.forEach(index => {
      if (this.selectedReleases.has(index)) {
        this.selectedReleases.delete(index);
      } else {
        this.selectedReleases.add(index);
      }
    });
  }

  /**
   * Clear all selections
   */
  clearSelections() {
    this.selectedReleases.clear();
  }

  /**
   * Get selected releases
   * @param {Array} releases - Array of all releases
   * @returns {Array} Array of selected releases
   */
  getSelectedReleases(releases) {
    return Array.from(this.selectedReleases)
      .sort((a, b) => a - b)
      .map(index => releases[index]);
  }

  /**
   * Generate playlist name suggestion based on selected releases
   * @param {Array} selectedReleases - Array of selected releases
   * @returns {string} Suggested playlist name
   */
  suggestPlaylistName(selectedReleases) {
    if (selectedReleases.length === 0) {
      return 'Custom Playlist';
    }

    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    
    // If only one release, use artist and album name
    if (selectedReleases.length === 1) {
      const release = selectedReleases[0];
      return `${release.artist_name} - ${release.name}`;
    }
    
    // If multiple releases from same artist
    const artists = [...new Set(selectedReleases.map(r => r.artist_name))];
    if (artists.length === 1) {
      return `${artists[0]} - Selected Releases`;
    }
    
    // Default to date-based name with count
    return `${today} Selected Releases (${selectedReleases.length} albums)`;
  }

  /**
   * Interactive selection flow for releases
   * @param {Array} releases - Array of release objects
   * @returns {Promise<Array>} Selected releases
   */
  async selectReleases(releases) {
    if (releases.length === 0) {
      return [];
    }

    this.createInterface();
    
    try {
      while (true) {
        // Clear screen and show current state
        console.clear();
        console.log('🎵 Interactive Release Selection');
        this.displayReleases(releases);
        
        console.log('\n📝 Commands:');
        console.log('   • Enter numbers: 1,3,5 or ranges: 1-5 (toggles selection)');
        console.log('   • "all" - select all releases');
        console.log('   • "clear" - clear all selections');
        console.log('   • "done" - finish selection');
        console.log('   • "quit" - cancel and exit');
        
        const answer = await this.askQuestion('\n🎯 Selection: ');
        
        if (answer.toLowerCase() === 'quit' || answer.toLowerCase() === 'q') {
          console.log('❌ Selection cancelled.');
          return [];
        }
        
        if (answer.toLowerCase() === 'done' || answer.toLowerCase() === 'd') {
          if (this.selectedReleases.size === 0) {
            console.log('\n⚠️  No releases selected. Please select at least one release.');
            await this.askQuestion('Press Enter to continue...');
            continue;
          }
          break;
        }
        
        if (answer.toLowerCase() === 'all' || answer.toLowerCase() === 'a') {
          // Select all
          this.clearSelections();
          for (let i = 0; i < releases.length; i++) {
            this.selectedReleases.add(i);
          }
          continue;
        }
        
        if (answer.toLowerCase() === 'clear' || answer.toLowerCase() === 'c') {
          this.clearSelections();
          continue;
        }
        
        // Parse and toggle selections
        const selections = this.parseSelection(answer, releases.length);
        if (selections.length > 0) {
          this.toggleSelections(selections);
        }
      }
      
      const selectedReleases = this.getSelectedReleases(releases);
      console.log(`\n✅ Selected ${selectedReleases.length} release(s)`);
      
      return selectedReleases;
      
    } finally {
      this.closeInterface();
    }
  }

  /**
   * Confirm playlist name with user
   * @param {string} suggestedName - Suggested playlist name
   * @returns {Promise<string>} Confirmed playlist name
   */
  async confirmPlaylistName(suggestedName) {
    this.createInterface();
    
    try {
      console.log(`\n🎵 Suggested playlist name: "${suggestedName}"`);
      
      const answer = await this.askQuestion('Press Enter to confirm, or type a new name: ');
      
      const finalName = answer.trim() || suggestedName;
      console.log(`✅ Playlist name confirmed: "${finalName}"`);
      
      return finalName;
      
    } finally {
      this.closeInterface();
    }
  }

  /**
   * Show final confirmation before creating playlist
   * @param {string} playlistName - Final playlist name
   * @param {Array} selectedReleases - Selected releases
   * @returns {Promise<boolean>} True if user confirms
   */
  async finalConfirmation(playlistName, selectedReleases) {
    this.createInterface();
    
    try {
      console.log('\n📋 Playlist Summary:');
      console.log(`🎵 Name: "${playlistName}"`);
      console.log(`📀 Releases: ${selectedReleases.length}`);
      
      const totalTracks = selectedReleases.reduce((sum, release) => sum + release.total_tracks, 0);
      console.log(`🎶 Total tracks: ${totalTracks}`);
      
      console.log('\n📝 Selected releases:');
      selectedReleases.forEach((release, index) => {
        const type = release.album_type === 'album' ? '💿' : '🎵';
        console.log(`   ${index + 1}. ${type} ${release.artist_name} - ${release.name} (${release.total_tracks} tracks)`);
      });
      
      const answer = await this.askQuestion('\n❓ Create this playlist? (y/n): ');
      
      return answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes';
      
    } finally {
      this.closeInterface();
    }
  }
}

module.exports = InteractiveSelector;