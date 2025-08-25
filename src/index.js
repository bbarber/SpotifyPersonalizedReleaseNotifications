#!/usr/bin/env node

/**
 * Spotify Personalized Release Notifications
 * A command-line tool to check for new releases from followed artists
 */

require('dotenv').config();
const SpotifyAuth = require('./auth/spotify-auth');
const FollowedArtists = require('./spotify/followed-artists');
const LikedArtists = require('./spotify/liked-artists');
const SavedAlbumsArtists = require('./spotify/saved-albums-artists');
const ArtistManager = require('./utils/artist-manager');
const AlbumRetrieval = require('./spotify/album-retrieval');

async function main() {
  console.log('🎵 Spotify Release Notifications');
  console.log('Setting up...');

  // Verify environment variables
  if (!process.env.SPOTIFY_CLIENT_ID || !process.env.SPOTIFY_CLIENT_SECRET) {
    console.error('❌ Missing Spotify credentials');
    console.error('Please copy .env.example to .env and add your Spotify app credentials');
    process.exit(1);
  }

  console.log('✅ Environment variables loaded');

  try {
    // Initialize authentication
    const auth = new SpotifyAuth();
    
    // Authenticate with Spotify
    const authResult = await auth.authenticate();
    
    console.log('✅ Authentication successful!');
    console.log(`Token expires in ${Math.round(authResult.expiresIn / 60)} minutes`);
    
    // Test the API connection
    const me = await authResult.spotifyApi.getMe();
    console.log(`👋 Hello, ${me.body.display_name || me.body.id}!`);
    
    // Fetch followed artists
    console.log('\n--- Retrieving Followed Artists ---');
    const followedArtists = new FollowedArtists(authResult.spotifyApi);
    const followedArtistsList = await followedArtists.fetchAll();
    
    // Display statistics
    const followedStats = followedArtists.getStatistics(followedArtistsList);
    console.log('\n📊 Followed Artists Statistics:');
    console.log(`   Total artists: ${followedStats.total}`);
    console.log(`   Average popularity: ${followedStats.averagePopularity}/100`);
    console.log(`   Total followers: ${followedStats.totalFollowers.toLocaleString()}`);
    
    if (followedStats.topGenres.length > 0) {
      console.log('   Top genres:');
      followedStats.topGenres.forEach((genre, i) => {
        console.log(`     ${i + 1}. ${genre.genre} (${genre.count} artists)`);
      });
    }
    
    // Show sample artists
    if (followedArtistsList.length > 0) {
      console.log('\n🎤 Sample followed artists:');
      followedArtistsList.slice(0, 5).forEach(artist => {
        console.log(`   • ${artist.name} (${artist.popularity}/100 popularity)`);
      });
      
      if (followedArtistsList.length > 5) {
        console.log(`   ... and ${followedArtistsList.length - 5} more`);
      }
    }

    // Fetch artists from liked tracks
    console.log('\n--- Extracting Artists from Liked Tracks ---');
    const likedArtists = new LikedArtists(authResult.spotifyApi);
    const likedArtistsList = await likedArtists.extractAll();
    
    // Display statistics
    const likedStats = likedArtists.getStatistics(likedArtistsList);
    console.log('\n📊 Liked Artists Statistics:');
    console.log(`   Total unique artists: ${likedStats.total}`);
    console.log(`   Artists with Spotify URL: ${likedStats.withSpotifyUrl}`);
    
    if (likedStats.missingUrl > 0) {
      console.log(`   Artists missing URL: ${likedStats.missingUrl}`);
    }
    
    // Show sample artists
    if (likedArtistsList.length > 0) {
      console.log('\n🎵 Sample artists from liked tracks:');
      const sampleArtists = likedArtists.getSampleArtists(likedArtistsList, 5);
      sampleArtists.forEach(artist => {
        console.log(`   • ${artist.name}`);
      });
      
      if (likedArtistsList.length > 5) {
        console.log(`   ... and ${likedArtistsList.length - 5} more`);
      }
    }

    // Fetch artists from saved albums
    console.log('\n--- Extracting Artists from Saved Albums ---');
    const savedAlbumsArtists = new SavedAlbumsArtists(authResult.spotifyApi);
    const savedAlbumArtistsList = await savedAlbumsArtists.extractAll();
    
    // Display statistics
    const savedAlbumsStats = savedAlbumsArtists.getStatistics(savedAlbumArtistsList);
    console.log('\n📊 Saved Album Artists Statistics:');
    console.log(`   Total unique artists: ${savedAlbumsStats.total}`);
    console.log(`   Artists with Spotify URL: ${savedAlbumsStats.withSpotifyUrl}`);
    
    if (savedAlbumsStats.missingUrl > 0) {
      console.log(`   Artists missing URL: ${savedAlbumsStats.missingUrl}`);
    }
    
    // Show sample artists
    if (savedAlbumArtistsList.length > 0) {
      console.log('\n💿 Sample artists from saved albums:');
      const sampleAlbumArtists = savedAlbumsArtists.getSampleArtists(savedAlbumArtistsList, 5);
      sampleAlbumArtists.forEach(artist => {
        console.log(`   • ${artist.name}`);
      });
      
      if (savedAlbumArtistsList.length > 5) {
        console.log(`   ... and ${savedAlbumArtistsList.length - 5} more`);
      }
    }
    
    // Combine all artist sources
    const artistManager = new ArtistManager();
    const allArtists = artistManager.combineArtistSources(
      followedArtistsList,
      likedArtistsList,
      savedAlbumArtistsList
    );

    // Display combined statistics
    const combinedStats = artistManager.getStatistics(allArtists);
    console.log('\n📊 Combined Artists Statistics:');
    console.log(`   Total unique artists: ${combinedStats.total}`);
    console.log(`   From followed: ${combinedStats.bySource.followed}`);
    console.log(`   From liked tracks: ${combinedStats.bySource.liked_tracks}`);
    console.log(`   From saved albums: ${combinedStats.bySource.saved_albums}`);
    console.log(`   Found in multiple sources: ${combinedStats.multipleSourceCount}`);
    
    if (combinedStats.withPopularity > 0) {
      console.log(`   With popularity data: ${combinedStats.withPopularity}/${combinedStats.total}`);
      console.log(`   Average popularity: ${combinedStats.averagePopularity}/100`);
    }

    // Show multi-source artists (high confidence)
    const multiSourceArtists = artistManager.getMultiSourceArtists(allArtists);
    if (multiSourceArtists.length > 0) {
      console.log(`\n🎯 Artists found in multiple sources (${multiSourceArtists.length}):`);
      multiSourceArtists.slice(0, 5).forEach(artist => {
        const sourcesStr = artist.sources.join(' + ');
        const popularityStr = artist.popularity ? ` (${artist.popularity}/100)` : '';
        console.log(`   • ${artist.name}${popularityStr} [${sourcesStr}]`);
      });
      
      if (multiSourceArtists.length > 5) {
        console.log(`   ... and ${multiSourceArtists.length - 5} more`);
      }
    }

    // Show sample of all artists
    console.log(`\n🎭 Sample of all tracked artists:`);
    const sampleArtists = artistManager.getSampleArtists(allArtists, 8);
    sampleArtists.forEach(artist => {
      const sourcesStr = artist.sources.join(' + ');
      const popularityStr = artist.popularity ? ` (${artist.popularity}/100)` : '';
      console.log(`   • ${artist.name}${popularityStr} [${sourcesStr}]`);
    });

    // Data validation report
    const validation = artistManager.validateArtistData(allArtists);
    console.log('\n📋 Data Quality Report:');
    console.log(`   Valid artists: ${validation.valid}/${validation.total}`);
    
    if (validation.missingSpotifyUrl > 0) {
      console.log(`   Missing Spotify URL: ${validation.missingSpotifyUrl}`);
    }
    
    if (validation.missingName > 0) {
      console.log(`   Missing name: ${validation.missingName}`);
    }
    
    if (validation.duplicateNames > 0) {
      console.log(`   Duplicate names (different artists): ${validation.duplicateNames}`);
    }

    // Retrieve albums for all artists
    const albumRetrieval = new AlbumRetrieval(authResult.spotifyApi);
    const allAlbums = await albumRetrieval.fetchAllArtistAlbums(allArtists);

    // Display album statistics
    const albumStats = albumRetrieval.getStatistics(allAlbums);
    console.log('\n📊 Album Retrieval Statistics:');
    console.log(`   Total albums retrieved: ${albumStats.total}`);
    console.log(`   Albums: ${albumStats.byType.album}`);
    console.log(`   Singles/EPs: ${albumStats.byType.single}`);
    console.log(`   Average tracks per release: ${albumStats.averageTracks}`);
    console.log(`   Artists with releases: ${albumStats.uniqueArtists}/${allArtists.length}`);

    // Show recent activity (last 1 years)
    const recentAlbums = albumRetrieval.getRecentAlbums(allAlbums, 1);
    console.log(`\n📅 Recent Activity: ${recentAlbums.length} releases`);
    
    if (recentAlbums.length > 0) {
      // Show top years
      const yearCounts = {};
      recentAlbums.forEach(album => {
        const year = album.release_date.substring(0, 4);
        yearCounts[year] = (yearCounts[year] || 0) + 1;
      });
      
      const sortedYears = Object.entries(yearCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3);
        
      console.log('   Most active years:');
      sortedYears.forEach(([year, count]) => {
        console.log(`     ${year}: ${count} releases`);
      });

      // Show sample recent releases
      const sampleRecent = recentAlbums
        .sort((a, b) => b.release_date.localeCompare(a.release_date))
        .slice(0, 5);
        
      console.log('\n🆕 Sample recent releases:');
      // Print table header
      console.log('\n   | Type | Artist             | Album / Single Title | Release Date | Tracks |');
      console.log('   |:----:|--------------------|----------------------|--------------|:------:|');

      // Sort and display sample recent releases in the table
      sampleRecent.sort((a, b) => {
        // Keep albums before singles
        if (a.album_type === b.album_type) return 0;
        return a.album_type === 'album' ? -1 : 1;
      }).forEach(album => {
        const type = album.album_type === 'album' ? '💿' : '🎵';
        const artist = album.artist_name.padEnd(18).substring(0, 18);
        const title = album.name.padEnd(20).substring(0, 20);
        const date = album.release_date;
        const tracks = String(album.total_tracks).padStart(2);
        
        console.log(`   | ${type}   | ${artist} | ${title} | ${date}   | ${tracks}     |`);
      });
    }
  } catch (error) {
    console.error('❌ Authentication failed:', error.message);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Goodbye!');
  process.exit(0);
});

main().catch(error => {
  console.error('❌ Application error:', error.message);
  process.exit(1);
});