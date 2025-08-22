/**
 * Test script for optimized album retrieval
 * Tests both the new search API approach and early termination fallback
 */

const AlbumRetrieval = require('./album-retrieval');

// Mock SpotifyApi for testing
class MockSpotifyApi {
  constructor() {
    this.searchCallCount = 0;
    this.artistAlbumsCallCount = 0;
  }

  // Mock search API with tag:new
  async search(query, types, options) {
    this.searchCallCount++;
    console.log(`🔍 SEARCH API CALL #${this.searchCallCount}: "${query}"`);
    
    // Simulate recent albums response
    return {
      body: {
        albums: {
          items: [
            {
              id: 'album1',
              name: 'Recent Album 1',
              album_type: 'album',
              total_tracks: 12,
              release_date: '2025-08-20',
              release_date_precision: 'day',
              external_urls: { spotify: 'https://open.spotify.com/album/album1' },
              artists: [
                { id: 'artist1', name: 'Test Artist' }
              ],
              images: []
            },
            {
              id: 'album2',
              name: 'Recent EP',
              album_type: 'single',
              total_tracks: 5,
              release_date: '2025-08-18',
              release_date_precision: 'day',
              external_urls: { spotify: 'https://open.spotify.com/album/album2' },
              artists: [
                { id: 'artist1', name: 'Test Artist' }
              ],
              images: []
            }
          ]
        }
      }
    };
  }

  // Mock artist albums API (fallback)
  async getArtistAlbums(artistId, options) {
    this.artistAlbumsCallCount++;
    console.log(`📀 ARTIST ALBUMS API CALL #${this.artistAlbumsCallCount}: Artist ${artistId}, offset: ${options.offset}`);
    
    // Simulate albums response with mix of recent and old
    const albums = [
      {
        id: 'album3',
        name: 'Very Recent Album',
        album_type: 'album',
        total_tracks: 10,
        release_date: '2025-08-21',
        release_date_precision: 'day',
        external_urls: { spotify: 'https://open.spotify.com/album/album3' },
        artists: [{ id: artistId, name: 'Fallback Artist' }],
        images: []
      },
      {
        id: 'album4',
        name: 'Old Album',
        album_type: 'album',
        total_tracks: 8,
        release_date: '2025-08-01', // More than 10 days ago
        release_date_precision: 'day',
        external_urls: { spotify: 'https://open.spotify.com/album/album4' },
        artists: [{ id: artistId, name: 'Fallback Artist' }],
        images: []
      }
    ];

    return {
      body: {
        total: 2,
        items: albums
      }
    };
  }
}

// Test the optimization
async function testOptimizedRetrieval() {
  console.log('🧪 Testing Optimized Album Retrieval\n');
  
  const mockApi = new MockSpotifyApi();
  const retrieval = new AlbumRetrieval(mockApi);
  
  const testArtists = [
    { id: 'artist1', name: 'Test Artist' },
    { id: 'artist2', name: 'Another Artist' }
  ];

  console.log('=== Test 1: Search API with tag:new (Primary Method) ===');
  
  for (const artist of testArtists) {
    console.log(`\nTesting artist: ${artist.name}`);
    const albums = await retrieval.fetchArtistAlbums(artist);
    console.log(`✅ Found ${albums.length} recent albums:`);
    albums.forEach(album => {
      console.log(`   - ${album.name} (${album.release_date})`);
    });
  }
  
  console.log(`\n📊 Search API calls made: ${mockApi.searchCallCount}`);
  console.log(`📊 Artist Albums API calls made: ${mockApi.artistAlbumsCallCount}`);
  
  console.log('\n=== Test 2: Early Termination (Fallback Method) ===');
  
  // Test early termination directly
  const testArtist = { id: 'artist3', name: 'Fallback Test Artist' };
  console.log(`\nTesting early termination for: ${testArtist.name}`);
  
  const fallbackAlbums = await retrieval.fetchArtistAlbumsWithEarlyTermination(testArtist);
  console.log(`✅ Found ${fallbackAlbums.length} albums with early termination:`);
  fallbackAlbums.forEach(album => {
    const isOld = retrieval.isOlderThanDays(album.release_date, 10);
    console.log(`   - ${album.name} (${album.release_date}) ${isOld ? '🔴 OLD' : '🟢 RECENT'}`);
  });
  
  console.log(`\n📊 Total Search API calls: ${mockApi.searchCallCount}`);
  console.log(`📊 Total Artist Albums API calls: ${mockApi.artistAlbumsCallCount}`);
  
  console.log('\n=== Test 3: Date Check Function ===');
  
  const testDates = [
    '2025-08-22', // Today (recent)
    '2025-08-21', // Yesterday (recent)
    '2025-08-12', // 10 days ago (should be recent)
    '2025-08-11', // 11 days ago (should be old)
    '2025-08-01', // 21 days ago (old)
    '2025-07',    // Month precision (old)
    '2024'        // Year precision (very old)
  ];
  
  console.log('Testing date filtering logic:');
  testDates.forEach(date => {
    const isOld = retrieval.isOlderThanDays(date, 10);
    console.log(`   ${date}: ${isOld ? '🔴 OLD' : '🟢 RECENT'}`);
  });
  
  console.log('\n✅ Optimization tests completed!');
  
  // Calculate potential savings
  console.log('\n💡 OPTIMIZATION BENEFITS:');
  console.log('   🔍 Search API (tag:new): Fetches only recent releases (past 2 weeks)');
  console.log('   ⚡ Early termination: Stops when hitting old albums');
  console.log('   📉 Reduced page size: 20 instead of 50 per request');
  console.log('   💾 Potential data reduction: 90-95% for artists with large discographies');
}

// Run tests if this file is executed directly
if (require.main === module) {
  testOptimizedRetrieval().catch(console.error);
}

module.exports = { testOptimizedRetrieval };