/**
 * Test suite for release filtering utilities
 */

const {
  isAlbumOrEP,
  parseReleaseDate,
  isRecentRelease,
  sortByReleaseDate,
  filterReleases,
  daysSinceRelease
} = require('./release-filter');

// Test data
const testAlbums = [
  {
    name: 'Test Album',
    album_type: 'album',
    total_tracks: 12,
    release_date: '2025-08-20' // 2 days ago (assuming today is 2025-08-22)
  },
  {
    name: 'Test EP',
    album_type: 'single',
    total_tracks: 5,
    release_date: '2025-08-15' // 7 days ago
  },
  {
    name: 'Another EP',
    album_type: 'single',
    total_tracks: 3,
    release_date: '2025-08-18' // 4 days ago, should be excluded as single
  },
  {
    name: 'Test Single',
    album_type: 'single',
    total_tracks: 1,
    release_date: '2025-08-21' // 1 day ago, should be excluded
  },
  {
    name: 'Old Album',
    album_type: 'album',
    total_tracks: 10,
    release_date: '2025-08-01' // 21 days ago, should be excluded
  },
  {
    name: 'Year Only Release',
    album_type: 'album',
    total_tracks: 8,
    release_date: '2025'
  },
  {
    name: 'Month Precision Release',
    album_type: 'album',
    total_tracks: 9,
    release_date: '2025-08'
  },
  {
    name: 'Recent Test EP',
    album_type: 'single',
    total_tracks: 3,
    release_date: '2025-08-19' // 3 days ago, contains "EP"
  }
];

// Manual test function
const runTests = () => {
  console.log('Testing release filtering utilities...\n');
  
  // Test isAlbumOrEP
  console.log('=== Testing isAlbumOrEP ===');
  testAlbums.forEach(album => {
    const result = isAlbumOrEP(album);
    console.log(`${album.name}: ${result} (${album.album_type}, ${album.total_tracks} tracks)`);
  });
  
  // Test parseReleaseDate
  console.log('\n=== Testing parseReleaseDate ===');
  const testDates = ['2024-08-22', '2024-08', '2024', ''];
  testDates.forEach(date => {
    const parsed = parseReleaseDate(date);
    console.log(`"${date}" -> ${parsed ? parsed.toISOString().split('T')[0] : 'null'}`);
  });
  
  // Test isRecentRelease (10 days)
  console.log('\n=== Testing isRecentRelease (10 days) ===');
  testAlbums.forEach(album => {
    const result = isRecentRelease(album, 10);
    const days = daysSinceRelease(album.release_date);
    console.log(`${album.name}: ${result} (${days} days ago)`);
  });
  
  // Test filterReleases
  console.log('\n=== Testing filterReleases ===');
  const filtered = filterReleases(testAlbums);
  console.log('Filtered results:');
  filtered.forEach(album => {
    const days = daysSinceRelease(album.release_date);
    console.log(`- ${album.name} (${album.album_type}, ${album.total_tracks} tracks, ${days} days ago)`);
  });
  
  // Test with different timeframes
  console.log('\n=== Testing different timeframes ===');
  const filtered5Days = filterReleases(testAlbums, { daysBack: 5 });
  const filtered20Days = filterReleases(testAlbums, { daysBack: 20 });
  
  console.log(`5 days: ${filtered5Days.length} releases`);
  console.log(`20 days: ${filtered20Days.length} releases`);
  
  console.log('\nTests completed!');
};

// Run tests if this file is executed directly
if (require.main === module) {
  runTests();
}

module.exports = { runTests };