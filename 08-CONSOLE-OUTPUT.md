# 08 - Console Output Formatting

## Overview
Format and display the filtered release results in a clean, readable console format.

## Required Output Fields
Per user requirements:
- **Artist Name** - Primary artist name
- **Album Name** - Full album/EP title
- **Track Count** - Number of tracks on the release
- **Link** - Direct Spotify URL to the album

## Output Format Design

### Header Section
```
🎵 New Releases from Your Followed Artists
Found X new albums/EPs in the last 10 days
═══════════════════════════════════════════════
```

### Release Entry Format
```
Artist: [Artist Name]
Album:  [Album/EP Name] ([Track Count] tracks)
Link:   [Spotify URL]
Date:   [Release Date]

```

### No Results Format
```
🎵 New Releases from Your Followed Artists
No new albums or EPs found in the last 10 days.
```

## Implementation Details

### Text Formatting
- Use consistent spacing and alignment
- Consider terminal width limitations
- Add visual separators between entries
- Use Unicode characters sparingly (basic terminal support)
- Support both light and dark terminal themes

### Release Grouping
- Sort by release date (newest first)
- Group by date if multiple releases on same day
- Show artist name clearly for each release

### URL Handling
- Use full Spotify URLs (https://open.spotify.com/album/...)
- Ensure URLs are clickable in most terminal emulators
- Consider shortening very long URLs if needed

### Track Count Display
- Show as "X tracks" for clarity
- Handle singular vs plural (1 track vs 2 tracks)
- Consider highlighting EPs vs full albums

## Implementation Tasks
1. Create output formatting functions
2. Implement header and summary generation
3. Build individual release entry formatter
4. Add proper spacing and alignment
5. Implement no-results handling
6. Test output readability in various terminals
7. Add release date formatting

## Console Display Examples

### Multiple Releases Example
```
🎵 New Releases from Your Followed Artists
Found 3 new albums/EPs in the last 10 days
═══════════════════════════════════════════════

Artist: The National
Album:  Laugh Track (11 tracks)
Link:   https://open.spotify.com/album/4x9bMkCdm0L1ePl7S8JGDn
Date:   2024-03-15

Artist: Phoebe Bridgers  
Album:  Stranger in the Alps (Deluxe) (15 tracks)
Link:   https://open.spotify.com/album/7x8bNdCm9L4fQm8S9KHEo2
Date:   2024-03-12

Artist: Bon Iver
Album:  Sable, EP (6 tracks)
Link:   https://open.spotify.com/album/2y7cKdDm8L3gRp9T8LIVn1
Date:   2024-03-10
```

### Error/No Results Handling
- Clear messaging when no releases found
- Helpful suggestions (check date range, followed artists)
- Error messages that don't break the format

## Technical Considerations
- Handle terminal encoding issues
- Support various terminal widths
- Maintain readability in different terminal themes
- Consider color support detection (future enhancement)

## Success Criteria
- Output is clean and readable
- All required information is displayed
- URLs are properly formatted and clickable
- Spacing and alignment are consistent
- No results scenario is handled gracefully
- Works across different terminal environments

## Future Enhancements
- Color coding for different release types
- Configurable output formats
- JSON output option for scripting
- Progress indicators during processing
- Release age indicators (e.g., "2 days ago")