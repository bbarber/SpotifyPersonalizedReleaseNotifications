# 02 - Spotify OAuth Authentication

## Overview
Implement Spotify OAuth 2.0 authentication flow to obtain access tokens for API requests.

## Authentication Flow
1. Generate authorization URL with required scopes
2. Launch browser to Spotify authorization page
3. User grants permissions
4. Receive authorization code via callback
5. Exchange code for access token
6. Store token for API requests

## Required Scopes
- `user-follow-read` - Access to user's followed artists
- `user-library-read` - Access to user's saved tracks (to extract liked artists)

## Implementation Details

### OAuth Configuration
- **Authorization URL**: `https://accounts.spotify.com/authorize`
- **Token URL**: `https://accounts.spotify.com/api/token`
- **Redirect URI**: `http://127.0.0.1:8888/callback`
- **Response Type**: `code`
- **Grant Type**: `authorization_code`

### Token Management
- Store access token in memory for session
- Handle token expiration (typically 1 hour)
- Implement token refresh if needed (for longer sessions)

### Security Considerations
- Generate random state parameter for CSRF protection
- Validate state parameter in callback
- Use HTTPS in production (localhost OK for development)
- Never log or expose client secret

## Implementation Tasks
1. Create auth module with OAuth configuration
2. Implement authorization URL generation
3. Set up temporary Express server for callback handling
4. Implement authorization code exchange
5. Create token storage and validation
6. Add error handling for auth failures
7. Test complete authentication flow

## Success Criteria
- User can authenticate via browser
- Access token is successfully obtained
- Token can be used for API requests
- Auth errors are handled gracefully
- State parameter prevents CSRF attacks

## API Endpoints Used
- `GET https://accounts.spotify.com/authorize`
- `POST https://accounts.spotify.com/api/token`

## Error Scenarios
- User denies permission
- Invalid client credentials
- Network connectivity issues
- State parameter mismatch
- Expired authorization code