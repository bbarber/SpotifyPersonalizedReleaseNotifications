# 05 - Artist List Management

## Overview
Combine followed artists and liked artists into a single deduplicated list for release checking.

## Data Sources
1. **Followed Artists** - From `/me/following` endpoint
2. **Liked Artists** - Extracted from saved tracks in `/me/tracks` endpoint

## Combination Strategy
- Merge both artist lists into single collection
- Deduplicate by Spotify artist ID
- Maintain consistent data structure
- Preserve artist metadata from best source

## Data Structure Standardization
```javascript
{
  id: 'spotify_artist_id',
  name: 'Artist Name',
  spotify_url: 'https://open.spotify.com/artist/...',
  source: ['followed', 'liked'] // Track where artist came from
}
```

## Implementation Details

### Deduplication Logic
- Use artist ID as primary key
- If artist appears in both sources, combine source tags
- Prefer followed artist data over liked artist data (more complete)
- Handle edge cases where same artist has different data

### Source Tracking
- Track whether artist came from followed list, liked tracks, or both
- Useful for debugging and user insights
- Can be used for future filtering options

### Data Validation
- Ensure all artists have required fields (id, name, spotify_url)
- Handle missing or malformed data gracefully
- Log statistics about artist list composition

## Implementation Tasks
1. Create artist combination function
2. Implement deduplication by artist ID
3. Add source tracking for each artist
4. Validate combined artist data
5. Create statistics/summary function
6. Add logging for debugging
7. Test with various artist list combinations

## Success Criteria
- All unique artists from both sources are included
- No duplicate artists in final list
- Data structure is consistent across all artists
- Source information is accurately tracked
- Statistics provide useful insights

## Statistics to Track
- Total unique artists
- Artists from followed only
- Artists from liked tracks only  
- Artists from both sources
- Artists with missing data

## Error Handling
- Handle empty artist lists from either source
- Manage malformed artist data
- Deal with network failures during data fetching
- Validate final combined list

## Performance Considerations
- Use efficient data structures (Map/Set for O(1) lookups)
- Minimize memory usage during combination
- Process artists in reasonable batch sizes
- Provide progress feedback for large lists

## Edge Cases
- User follows no artists
- User has no saved tracks
- Same artist with different spellings/data
- Artists with missing essential fields
- Very large artist lists (1000+ artists)