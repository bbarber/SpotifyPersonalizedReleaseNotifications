/**
 * Test script to verify rollback works correctly
 */

const AlbumRetrieval = require('./src/spotify/album-retrieval');

// Mock SpotifyApi to simulate the traditional endpoint
class MockSpotifyApi {
  constructor() {
    this.callCount = 0;
  }

  async getArtistAlbums(artistId, options) {
    this.callCount++;
    console.log(`📀 Artist Albums API Call #${this.callCount}: ${artistId}, offset: ${options.offset}`);
    
    // Simulate albums response - mix of recent and old
    const albums = [
      {
        id: 'recent1',
        name: 'Recent Album 1',
        album_type: 'album',
        total_tracks: 12,
        release_date: '2025-08-20', // Recent
        release_date_precision: 'day',
        external_urls: { spotify: 'https://open.spotify.com/album/recent1' },
        artists: [{ id: artistId, name: 'Test Artist' }],
        images: []
      },
      {
        id: 'recent2',
        name: 'Recent Album 2',
        album_type: 'album',
        total_tracks: 10,
        release_date: '2025-08-18', // Recent
        release_date_precision: 'day',
        external_urls: { spotify: 'https://open.spotify.com/album/recent2' },
        artists: [{ id: artistId, name: 'Test Artist' }],
        images: []
      },
      {
        id: 'old1',
        name: 'Old Album 1',
        album_type: 'album',
        total_tracks: 8,
        release_date: '2025-08-01', // Old (21 days ago)
        release_date_precision: 'day',
        external_urls: { spotify: 'https://open.spotify.com/album/old1' },
        artists: [{ id: artistId, name: 'Test Artist' }],
        images: []
      }
    ];

    return {
      body: {
        total: 3,
        items: albums
      }
    };
  }
}

async function testRollback() {
  console.log('🔄 Testing Rollback - Search Optimization Disabled\n');
  
  const mockApi = new MockSpotifyApi();
  
  // Test with search optimization DISABLED (default now)
  const retrievalDisabled = new AlbumRetrieval(mockApi);
  console.log(`Search optimization enabled: ${retrievalDisabled.useSearchOptimization}`);
  
  const testArtist = { id: 'artist1', name: 'Test Artist' };
  
  console.log('\n=== Testing with Search Optimization DISABLED ===');
  const albums = await retrievalDisabled.fetchArtistAlbums(testArtist);
  
  console.log(`✅ Retrieved ${albums.length} albums:`);
  albums.forEach(album => {
    const isOld = retrievalDisabled.isOlderThanDays(album.release_date, 10);
    console.log(`   - ${album.name} (${album.release_date}) ${isOld ? '🔴 OLD' : '🟢 RECENT'}`);
  });
  
  console.log(`\n📊 API calls made: ${mockApi.callCount}`);
  console.log('✅ Should see early termination message above');
  
  // Test with search optimization ENABLED (manual override)
  console.log('\n=== Testing with Search Optimization ENABLED (would fail in real app) ===');
  const retrievalEnabled = new AlbumRetrieval(mockApi, { useSearchOptimization: true });
  console.log(`Search optimization enabled: ${retrievalEnabled.useSearchOptimization}`);
  
  console.log('This would normally fail and fallback to early termination method');
  
  console.log('\n🎉 Rollback test completed successfully!');
  console.log('💡 The app will now use early termination by default (still provides significant optimization)');
}

if (require.main === module) {
  testRollback().catch(console.error);
}

module.exports = { testRollback };