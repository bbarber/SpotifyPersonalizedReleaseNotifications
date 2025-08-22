const SpotifyWebApi = require('spotify-web-api-node');
const express = require('express');
const crypto = require('crypto');
const { exec } = require('child_process');

class SpotifyAuth {
  constructor() {
    this.clientId = process.env.SPOTIFY_CLIENT_ID;
    this.clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
    this.redirectUri = process.env.REDIRECT_URI || 'http://127.0.0.1:8888/callback';
    
    this.spotifyApi = new SpotifyWebApi({
      clientId: this.clientId,
      clientSecret: this.clientSecret,
      redirectUri: this.redirectUri
    });

    this.state = null;
    this.server = null;
  }

  /**
   * Generate a random state string for CSRF protection
   */
  generateState() {
    return crypto.randomBytes(16).toString('hex');
  }

  /**
   * Start the OAuth authentication flow
   */
  async authenticate() {
    return new Promise((resolve, reject) => {
      // Generate state for CSRF protection
      this.state = this.generateState();

      // Required scopes
      const scopes = [
        'user-follow-read',    // Access to followed artists
        'user-library-read'    // Access to saved tracks
      ];

      // Create authorization URL
      const authUrl = this.spotifyApi.createAuthorizeURL(scopes, this.state);

      console.log('🔐 Starting Spotify authentication...');
      console.log('Opening browser for authorization...');

      // Set up callback server
      const app = express();
      
      app.get('/callback', async (req, res) => {
        const { code, state: returnedState, error } = req.query;

        // Handle user denial
        if (error) {
          res.send(`
            <h1>❌ Authorization Failed</h1>
            <p>You denied the request or an error occurred: ${error}</p>
            <p>Please close this window and try again.</p>
          `);
          this.cleanup();
          return reject(new Error(`Authorization failed: ${error}`));
        }

        // Verify state parameter (CSRF protection)
        if (returnedState !== this.state) {
          res.send(`
            <h1>❌ Security Error</h1>
            <p>State parameter mismatch. This could be a security issue.</p>
            <p>Please close this window and try again.</p>
          `);
          this.cleanup();
          return reject(new Error('State parameter mismatch'));
        }

        try {
          // Exchange authorization code for access token
          const data = await this.spotifyApi.authorizationCodeGrant(code);
          const { access_token, refresh_token, expires_in } = data.body;

          // Set the access token on the API object
          this.spotifyApi.setAccessToken(access_token);
          this.spotifyApi.setRefreshToken(refresh_token);

          // Calculate expiration time
          const expiresAt = Date.now() + (expires_in * 1000);

          res.send(`
            <h1>✅ Authorization Successful!</h1>
            <p>You have successfully authenticated with Spotify.</p>
            <p>You can close this window and return to the terminal.</p>
          `);

          this.cleanup();
          
          resolve({
            accessToken: access_token,
            refreshToken: refresh_token,
            expiresIn: expires_in,
            expiresAt: expiresAt,
            spotifyApi: this.spotifyApi
          });

        } catch (error) {
          res.send(`
            <h1>❌ Token Exchange Failed</h1>
            <p>Failed to exchange authorization code for access token.</p>
            <p>Error: ${error.message}</p>
            <p>Please close this window and try again.</p>
          `);
          this.cleanup();
          reject(error);
        }
      });

      // Start the server
      this.server = app.listen(8888, () => {
        console.log('📡 Callback server running on http://127.0.0.1:8888');
        console.log('📍 Redirect URI configured as:', this.redirectUri);
        
        // Open browser using system command
        this.openBrowser(authUrl);
      });

      // Handle server errors
      this.server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
          reject(new Error('Port 8888 is already in use. Please close any applications using this port and try again.'));
        } else {
          reject(err);
        }
      });
    });
  }

  /**
   * Open browser with the authorization URL
   */
  openBrowser(url) {
    const platform = process.platform;
    let command;

    if (platform === 'darwin') {
      command = `open "${url}"`;
    } else if (platform === 'win32') {
      command = `start "${url}"`;
    } else {
      command = `xdg-open "${url}"`;
    }

    exec(command, (error) => {
      if (error) {
        console.log('Could not open browser automatically. Please visit this URL:');
        console.log(url);
      }
    });
  }

  /**
   * Clean up the callback server
   */
  cleanup() {
    if (this.server) {
      this.server.close();
      this.server = null;
    }
  }

  /**
   * Check if the access token is still valid
   */
  isTokenValid(expiresAt) {
    return Date.now() < expiresAt - (5 * 60 * 1000); // 5 minute buffer
  }

  /**
   * Refresh the access token if needed
   */
  async refreshTokenIfNeeded(refreshToken, expiresAt) {
    if (this.isTokenValid(expiresAt)) {
      return null; // Token is still valid
    }

    try {
      console.log('🔄 Refreshing access token...');
      this.spotifyApi.setRefreshToken(refreshToken);
      const data = await this.spotifyApi.refreshAccessToken();
      
      const { access_token, expires_in } = data.body;
      this.spotifyApi.setAccessToken(access_token);
      
      const newExpiresAt = Date.now() + (expires_in * 1000);
      
      return {
        accessToken: access_token,
        expiresAt: newExpiresAt
      };
    } catch (error) {
      throw new Error(`Failed to refresh token: ${error.message}`);
    }
  }
}

module.exports = SpotifyAuth;