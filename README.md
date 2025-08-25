# Spotify Personalized Release Notifications

A command-line tool that checks for new album and EP releases from artists you follow or have liked on Spotify, with interactive playlist creation.

## Features

- 🎵 **Track Multiple Sources**: Monitors followed artists, liked tracks, and saved albums
- 🎯 **Interactive Selection**: Choose which releases to add to playlists
- 📋 **Smart Playlist Creation**: Create custom playlists with selected releases

## Prerequisites

- Node.js (v14 or higher)
- A Spotify account
- A Spotify Developer Application (free to create)

## Setup

### 1. Clone and Install

```bash
git clone <repository-url>
cd SpotifyPersonalizedReleaseNotifications
npm install
```

### 2. Create Spotify Application

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Log in with your Spotify account
3. Click **"Create App"**
4. Fill in the details:
   - **App name**: Your choice (e.g., "Release Notifications")
   - **App description**: Your choice
   - **Redirect URI**: `http://127.0.0.1:8888/callback`
   - **API/SDKs**: Check "Web API"
5. Click **"Save"**
6. In your app dashboard, click **"Settings"**
7. Copy your **Client ID** and **Client Secret**

### 3. Configure Environment

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Edit the `.env` file and add your Spotify credentials:
   ```env
   SPOTIFY_CLIENT_ID=your_client_id_here
   SPOTIFY_CLIENT_SECRET=your_client_secret_here
   REDIRECT_URI=http://127.0.0.1:8888/callback
   ```

## Usage

### Running the Application

```bash
npm start
```
