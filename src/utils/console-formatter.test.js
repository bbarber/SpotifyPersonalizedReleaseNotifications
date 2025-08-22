/**
 * Test suite for console formatting utilities
 */

const {
  formatReleaseDate,
  formatTrackCount,
  generateSpotifyUrl,
  formatReleaseEntry,
  formatHeader,
  formatReleaseOutput,
  formatError,
  formatAuthPrompt,
  formatLoadingMessage
} = require('./console-formatter');

// Test data
const testReleases = [
  {
    id: '4x9bMkCdm0L1ePl7S8JGDn',
    name: 'Laugh Track',
    artists: [{ name: 'The National' }],
    total_tracks: 11,
    release_date: '2025-08-20'
  },
  {
    id: '7x8bNdCm9L4fQm8S9KHEo2',
    name: 'Stranger in the Alps (Deluxe)',
    artists: [{ name: 'Phoebe Bridgers' }],
    total_tracks: 15,
    release_date: '2025-08-18'
  },
  {
    id: '2y7cKdDm8L3gRp9T8LIVn1',
    name: 'Sable, EP',
    artists: [{ name: 'Bon Iver' }],
    total_tracks: 6,
    release_date: '2025-08'
  }
];

// Test functions
const runTests = () => {
  console.log('Testing console formatting utilities...\n');
  
  // Test formatReleaseDate
  console.log('=== Testing formatReleaseDate ===');
  const testDates = ['2025-08-22', '2025-08', '2025', ''];
  testDates.forEach(date => {
    const formatted = formatReleaseDate(date);
    console.log(`"${date}" -> "${formatted}"`);
  });
  
  // Test formatTrackCount
  console.log('\n=== Testing formatTrackCount ===');
  const testCounts = [0, 1, 5, 12];
  testCounts.forEach(count => {
    const formatted = formatTrackCount(count);
    console.log(`${count} -> "${formatted}"`);
  });
  
  // Test generateSpotifyUrl
  console.log('\n=== Testing generateSpotifyUrl ===');
  const testIds = ['4x9bMkCdm0L1ePl7S8JGDn', '', null];
  testIds.forEach(id => {
    const url = generateSpotifyUrl(id);
    console.log(`"${id}" -> "${url}"`);
  });
  
  // Test formatReleaseEntry
  console.log('\n=== Testing formatReleaseEntry ===');
  const sampleRelease = testReleases[0];
  const entry = formatReleaseEntry(sampleRelease);
  console.log('Sample release entry:');
  console.log(entry);
  
  // Test formatHeader
  console.log('=== Testing formatHeader ===');
  console.log('Header with 3 releases:');
  console.log(formatHeader(3, 10));
  
  console.log('Header with 0 releases:');
  console.log(formatHeader(0, 10));
  
  console.log('Header with 1 release:');
  console.log(formatHeader(1, 10));
  
  // Test complete output
  console.log('=== Testing Complete Output ===');
  console.log('Output with multiple releases:');
  console.log(formatReleaseOutput(testReleases, { daysBack: 10 }));
  
  console.log('Output with no releases:');
  console.log(formatReleaseOutput([], { daysBack: 10 }));
  
  // Test error formatting
  console.log('=== Testing Error Formatting ===');
  console.log(formatError('Failed to authenticate with Spotify'));
  
  // Test auth prompt
  console.log('=== Testing Auth Prompt ===');
  console.log(formatAuthPrompt());
  
  // Test loading message
  console.log('=== Testing Loading Message ===');
  console.log(formatLoadingMessage('Fetching your followed artists'));
  
  console.log('Tests completed!');
};

// Test edge cases
const testEdgeCases = () => {
  console.log('\n=== Testing Edge Cases ===');
  
  // Release with missing data
  const incompleteRelease = {
    id: 'test123',
    name: '',
    artists: [],
    total_tracks: 0,
    release_date: null
  };
  
  console.log('Release with missing data:');
  console.log(formatReleaseEntry(incompleteRelease));
  
  // Very long album name
  const longNameRelease = {
    id: 'test456',
    name: 'This Is An Extremely Long Album Name That Might Cause Display Issues in Terminal Windows',
    artists: [{ name: 'Artist With Very Long Name That Also Might Cause Issues' }],
    total_tracks: 25,
    release_date: '2025-08-22'
  };
  
  console.log('Release with long names:');
  console.log(formatReleaseEntry(longNameRelease));
};

// Run tests if this file is executed directly
if (require.main === module) {
  runTests();
  testEdgeCases();
}

module.exports = { runTests, testEdgeCases };