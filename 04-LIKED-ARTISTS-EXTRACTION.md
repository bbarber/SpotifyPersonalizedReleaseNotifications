# 04 - Liked Artists Extraction

## Overview
Extract unique artists from the user's saved (liked) tracks on Spotify to identify "hearted" artists.

## Spotify API Details
- **Endpoint**: `GET https://api.spotify.com/v1/me/tracks`
- **Required Scope**: `user-library-read`
- **Parameters**:
  - `limit=50` (maximum per request)
  - `offset` (pagination offset)
  - `market` (user's market for track availability)

## Data Processing Strategy
1. Fetch all saved tracks (paginated)
2. Extract all artists from each track (tracks can have multiple artists)
3. Deduplicate artists by Spotify ID
4. Build artist list with essential information

## Track vs Artist Data
Each saved track contains:
- `track.artists[]` - Array of artist objects
- Each artist has: `id`, `name`, `uri`, `external_urls`

## Implementation Details

### Pagination Handling
- API returns maximum 50 tracks per request
- Use `offset` parameter for offset-based pagination
- Continue fetching until total count is reached
- Process artists from each batch immediately

### Artist Extraction Logic
```javascript
// For each saved track
track.artists.forEach(artist => {
  if (!seenArtists.has(artist.id)) {
    seenArtists.add(artist.id);
    likedArtists.push({
      id: artist.id,
      name: artist.name,
      spotify_url: artist.external_urls.spotify
    });
  }
});
```

### Deduplication
- Use Set or Map to track seen artist IDs
- Prevent duplicate artists from multi-artist tracks
- Maintain consistent artist data structure

## Implementation Tasks
1. Create function to fetch saved tracks with pagination
2. Implement artist extraction from track objects
3. Build deduplication logic using artist IDs
4. Format artist data consistently with followed artists
5. Handle edge cases (tracks with no artists, deleted tracks)
6. Add progress indication for large libraries
7. Test with users having large saved track libraries

## Success Criteria
- All saved tracks are processed
- Artists are correctly extracted and deduplicated
- Data format matches followed artists format
- Large libraries (10,000+ tracks) are handled efficiently
- Progress is visible for long-running operations

## Error Scenarios
- Network connectivity issues
- Invalid or expired access token
- Rate limit exceeded
- Tracks with missing artist data
- User has no saved tracks
- Spotify API returns unavailable tracks

## Performance Considerations
- Process artists incrementally during track fetching
- Use efficient deduplication (Set vs Array.includes)
- Consider memory usage with very large libraries
- Provide progress feedback for long operations
- Balance between API efficiency and memory usage

## Special Cases
- Collaborative tracks (multiple artists)
- Compilation albums with various artists
- Tracks where artist data may be incomplete
- Regional availability affecting track data