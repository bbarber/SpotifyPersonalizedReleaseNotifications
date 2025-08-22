# Spotify Personalized Release Notifications - Product Requirements

## Overview
A command-line tool that checks for new album and EP releases from Spotify artists you follow or have hearted/liked.

## Core Features

### Application Type
- Console/command-line application
- Personal use only
- Run manually (no background services)

### Authentication
- Spotify OAuth with web browser flow
- Use existing Spotify app credentials (Client ID + Client Secret)

### Artist Tracking
- Track both followed artists and hearted/liked artists from Spotify
- Automatically sync with user's Spotify account (no manual artist management)

### Release Detection
- Monitor for new albums and EPs only (exclude singles)
- Check only when tool is executed (no scheduled/periodic checks)
- No data persistence between runs

### Output Format
Console output displaying:
- Artist name
- Album/EP name  
- Track count
- Direct link to the album/EP

### Technical Constraints
- No database/storage requirements
- No notification system (console output only)
- No data persistence needed
- Single user application

## User Flow
1. User runs the command-line tool
2. Tool authenticates with Spotify (if needed)
3. Tool fetches user's followed and hearted artists
4. Tool checks for new releases (albums/EPs) from those artists
5. Tool displays results in console and exits

## Success Criteria
- Successfully authenticate with Spotify API
- Retrieve user's followed and liked artists
- Identify new album/EP releases
- Display clean, readable output with required information
- Handle errors gracefully (network issues, API limits, etc.)