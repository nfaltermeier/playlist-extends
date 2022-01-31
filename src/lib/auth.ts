import axios from 'axios';
import config from '../config';

type AccessTokenRequestResponse = {
  access_token: string,
  token_type: string,
  scope: string,
  expires_in: number,
  refresh_token: string
};

const codeVerifierStorageKey = 'spotify_auth_verifier';
const stateStorageKey = 'spotify_auth_state';

// adapted from https://www.oauth.com/oauth2-servers/pkce/authorization-request/
const base64URLEncode = (buffer: Uint8Array): string => {
  return btoa(String.fromCharCode.apply(null, buffer as unknown as number[]))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

const getAuthorizationURL = async (): Promise<string> => {
  const baseURL = 'https://accounts.spotify.com/authorize?';

  const codeVerifierRaw = new Uint8Array(66);
  crypto.getRandomValues(codeVerifierRaw);
  const codeVerifier = base64URLEncode(codeVerifierRaw);
  const encoder = new TextEncoder();
  const codeChallengeBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(codeVerifier).buffer);
  const codeChallengeArray = new Uint8Array(codeChallengeBuffer);
  const codeChallenge = base64URLEncode(codeChallengeArray);

  const stateRaw = new Uint8Array(12);
  crypto.getRandomValues(stateRaw);
  const state = base64URLEncode(stateRaw);

  window.sessionStorage.setItem(codeVerifierStorageKey, codeVerifier);
  window.sessionStorage.setItem(stateStorageKey, state);

  const params = new URLSearchParams();
  params.append('client_id', config.clientId);
  params.append('response_type', 'code');
  params.append('redirect_uri', config.redirect_uri);
  params.append('state', state);
  params.append('scope', 'playlist-modify-private');
  params.append('show_dialog', 'false');
  params.append('code_challenge_method', 'S256');
  params.append('code_challenge', codeChallenge);

  return baseURL + params.toString();
};

const verifyState = (state: string): boolean => {
  const storedState = window.sessionStorage.getItem(stateStorageKey);
  if (storedState) {
    return storedState === state;
  }
  return false;
};

const requestAccessToken = async (code: string): Promise<AccessTokenRequestResponse> => {
  const baseURL = 'https://accounts.spotify.com/api/token?';

  const codeVerifier = window.sessionStorage.getItem(codeVerifierStorageKey);
  if (!codeVerifier) {
    return new Promise((resolve, reject) => { reject('Code verifier cookie not found'); });
  }

  const params = new URLSearchParams();
  params.append('grant_type', 'authorization_code');
  params.append('code', code);
  params.append('redirect_uri', config.redirect_uri);
  params.append('client_id', config.clientId);
  params.append('code_verifier', codeVerifier);

  const requestConfig = {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  };
  const result = await axios.post<AccessTokenRequestResponse>(baseURL, params, requestConfig);
  
  if (result.status === 200)
    return result.data;
  else
    return new Promise((resolve, reject) => { reject(`${result.status}: ${result.statusText}`); });
};

export { getAuthorizationURL, verifyState, requestAccessToken };