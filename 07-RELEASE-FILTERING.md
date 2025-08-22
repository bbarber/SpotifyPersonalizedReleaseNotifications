# 07 - Release Filtering and Processing

## Overview
Filter retrieved albums to show only albums and EPs (excluding singles) and focus on recent releases.

## Filtering Criteria

### Album Type Filtering
- **Include**: Albums (`album_type: 'album'`)
- **Include**: EPs (from `album_type: 'single'` with 4+ tracks typically)
- **Exclude**: Singles (from `album_type: 'single'` with 1-3 tracks)
- **Exclude**: Compilations and appears-on releases

### EP Detection Logic
Since Spotify classifies EPs as "single" type, use heuristics:
- `album_type === 'single'` AND `total_tracks >= 4` = likely EP
- `album_type === 'single'` AND `total_tracks <= 3` = likely single
- Consider release names containing "EP" keyword

### Recency Filtering
- Define "recent" as releases within last 10 days by default
- Make timeframe configurable for future enhancement
- Use release_date for comparison
- Handle various date formats (YYYY, YYYY-MM, YYYY-MM-DD)

## Date Processing
- Parse Spotify release dates (may be incomplete)
- Handle precision levels:
  - `"2024"` - Year only
  - `"2024-03"` - Year and month
  - `"2024-03-15"` - Full date
- Compare dates accurately despite different precisions

## Implementation Details

### Filtering Pipeline
```javascript
const filterReleases = (albums) => {
  return albums
    .filter(isAlbumOrEP)
    .filter(isRecentRelease)
    .sort(sortByReleaseDate);
};
```

### EP Detection Algorithm
```javascript
const isAlbumOrEP = (album) => {
  // Definitely an album
  if (album.album_type === 'album') return true;
  
  // Potential EP detection
  if (album.album_type === 'single') {
    return album.total_tracks >= 4 || 
           album.name.toLowerCase().includes('ep');
  }
  
  return false;
};
```

### Date Comparison Logic
- Convert all dates to comparable format
- Handle incomplete dates conservatively
- Default to first day of month/year for incomplete dates
- Account for timezone differences

## Implementation Tasks
1. Create album type filtering function
2. Implement EP detection heuristics
3. Build date parsing and comparison utilities
4. Create recency filtering logic
5. Implement release sorting (newest first)
6. Add configuration for recency timeframe
7. Test with various release types and dates

## Success Criteria
- Singles are excluded from results
- Albums are included
- EPs are correctly identified and included
- Only recent releases are shown
- Results are sorted by release date (newest first)
- Date parsing handles all Spotify date formats

## Configuration Options
- Recency timeframe (default: 10 days)
- EP detection threshold (default: 4+ tracks)
- Sort order preference
- Include/exclude specific album types

## Edge Cases
- Albums with unusual track counts
- Releases with only year-precision dates
- Re-releases of old albums
- Deluxe editions and remastered versions
- International vs local release dates
- Albums with "EP" in title but many tracks

## Quality Assurance
- Test with known EPs vs singles
- Verify date parsing accuracy
- Confirm recency filtering works
- Check sorting order
- Validate with edge case releases

## Data Enrichment
- Calculate days since release
- Add release age indicators
- Include track count in output
- Preserve original release date precision