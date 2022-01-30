import axios from 'axios';
import config from './config';

const codeVerifierCookieKey = 'spotify_auth_verifier';
const stateCookieKey = 'spotify_auth_state';

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

  const state = new Uint8Array(12);
  crypto.getRandomValues(state);
  const b64State = base64URLEncode(state);

  document.cookie = `${codeVerifierCookieKey}=${codeVerifier};max-age=${60*60*24};secure`;
  document.cookie = `${stateCookieKey}=${b64State};max-age=${60*60*24};secure`;

  const params = new URLSearchParams();
  params.append('client_id', config.clientId);
  params.append('response_type', 'code');
  params.append('redirect_uri', config.redirect_uri);
  params.append('state', b64State);
  params.append('scope', 'playlist-modify-private');
  params.append('show_dialog', 'true');
  params.append('code_challenge_method', 'S256');
  params.append('code_challenge', codeChallenge);

  return baseURL + params.toString();
};

const verifyState = (state: string): boolean => {
  const maybeStateCookie = document.cookie
    .split('; ')
    .find(row => row.startsWith(`${stateCookieKey}=`));
  if (maybeStateCookie) {
    return maybeStateCookie.split('=')[1] === state;
  }
  return false;
};

const requestAccessToken = async (code: string): Promise<any> => {
  const baseURL = 'https://accounts.spotify.com/api/token?';

  const maybeCodeVerifierCookie = document.cookie
    .split('; ')
    .find(row => row.startsWith(`${codeVerifierCookieKey}=`));
  if (!maybeCodeVerifierCookie) {
    return new Promise((resolve, reject) => { reject('Code verifier cookie not found'); });
  }
  const codeVerifier = maybeCodeVerifierCookie.split('=')[1];

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
  const result = await axios.post<string>(baseURL, params, requestConfig);
  if (result.status === 200)
    return result.data;
  else
    return new Promise((resolve, reject) => { reject(`${result.status}: ${result.statusText}`); });
};

export { getAuthorizationURL, verifyState, requestAccessToken };