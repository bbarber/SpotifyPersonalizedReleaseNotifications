# Claude Code Instructions

## Project Overview
Spotify Personalized Release Notifications - A command-line tool that checks for new album and EP releases from artists you follow or have liked on Spotify.

## Development Commands

### Setup and Installation
```bash
npm install
```

### Running the Application
```bash
npm start
# or
node src/index.js
```

### Development
```bash
npm run dev
```

### Testing
```bash
npm test
```

### Linting and Type Checking
```bash
npm run lint
npm run typecheck
```

## Environment Setup
1. Copy `.env.example` to `.env`
2. Add your Spotify app credentials:
   - `SPOTIFY_CLIENT_ID`
   - `SPOTIFY_CLIENT_SECRET`
   - `REDIRECT_URI=http://127.0.0.1:8888/callback`

## Project Structure
```
src/
├── index.js           # Main entry point
├── auth/              # Authentication module
├── spotify/           # Spotify API interactions
└── utils/             # Utility functions
```

## Implementation Progress
Track progress using the numbered requirement files (01-09):
- 01-PROJECT-SETUP.md
- 02-SPOTIFY-AUTHENTICATION.md
- 03-FOLLOWED-ARTISTS.md
- 04-LIKED-ARTISTS-EXTRACTION.md
- 05-ARTIST-LIST-MANAGEMENT.md
- 06-ALBUM-RETRIEVAL.md
- 07-RELEASE-FILTERING.md
- 08-CONSOLE-OUTPUT.md
- 09-ERROR-HANDLING.md

## Key Requirements
- Node.js command-line application
- Spotify OAuth authentication
- Track both followed artists and artists from liked tracks
- Show only albums and EPs (no singles)
- Console output with: Artist, Album Name, Track Count, Spotify Link
- No data persistence required

## Spotify API Requirements
- Client ID and Client Secret from Spotify Developer Dashboard
- Required scopes: `user-follow-read`, `user-library-read`
- OAuth redirect URI: `http://127.0.0.1:8888/callback`