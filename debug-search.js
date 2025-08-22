/**
 * Debug script to test Spotify search API issues
 */

const SpotifyWebApi = require('spotify-web-api-node');

async function debugSearch() {
  console.log('🔍 Debug Search API Issues\n');
  
  // You'll need to run this with a valid token
  const spotifyApi = new SpotifyWebApi();
  
  console.log('Instructions:');
  console.log('1. Run your main app first to authenticate');
  console.log('2. Copy the access token from the authentication');
  console.log('3. Set it here: spotifyApi.setAccessToken("your-token-here")');
  console.log('4. Then run this debug script\n');
  
  // Uncomment and set your token here:
  // spotifyApi.setAccessToken('your-token-here');
  
  const testQueries = [
    'tag:new',
    'artist:"Taylor Swift" tag:new',
    'artist:"Radiohead" tag:new',
    'Taylor Swift',
    'year:2025',
  ];
  
  for (const query of testQueries) {
    try {
      console.log(`\n🔍 Testing query: "${query}"`);
      
      const response = await spotifyApi.search(query, ['album'], {
        market: 'from_token',
        limit: 5
      });
      
      console.log(`✅ Success! Found ${response.body.albums.items.length} results`);
      
      response.body.albums.items.forEach((album, i) => {
        console.log(`   ${i + 1}. ${album.name} by ${album.artists[0].name} (${album.release_date})`);
      });
      
    } catch (error) {
      console.log(`❌ Failed: ${error.message}`);
      console.log(`   Status: ${error.statusCode}`);
      if (error.body) {
        console.log(`   Body: ${JSON.stringify(error.body, null, 2)}`);
      }
    }
  }
}

if (require.main === module) {
  debugSearch().catch(console.error);
}

module.exports = { debugSearch };