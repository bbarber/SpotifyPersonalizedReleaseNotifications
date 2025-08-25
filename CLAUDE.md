# Claude Code Instructions

## Rules

Do not commit or push changes unless explicitly instructed.

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
