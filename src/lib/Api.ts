import SpotifyWebApi from 'spotify-web-api-node';
import { refreshAccessToken } from './auth';

// copy of https://github.com/DefinitelyTyped/DefinitelyTyped/blob/74b19cf32a1b2f10958f5729f798245afb1125f5/types/spotify-web-api-node/index.d.ts#L1037
// because this interface is not exported
interface Response<T> {
  body: T;
  headers: Record<string, string>;
  statusCode: number;
}

const paginateRequest = async <T>(requestFn: (offset: number) => Promise<Response<SpotifyApi.PagingObject<T>>>): Promise<T[]> => {
  let total;
  let retrievedCount = 0;
  let results: T[] = [];
  do {
    const result = (await requestFn(retrievedCount)).body;
    total = result.total;
    retrievedCount += result.items.length;
    results = results.concat(result.items);
  } while (retrievedCount < total);

  return results;
};

const refreshAuthWrapper = async <T>(requestFn: () => Promise<T>, spotifyApi: SpotifyWebApi): Promise<T> => {
  try {
    const result = await requestFn();
    return result;
  } catch (e: any) {
    if (e.body && e.body.error && e.body.error.status === 401 && e.body.error.message === 'The access token expired') {
      const refreshToken = spotifyApi.getRefreshToken();
      if (refreshToken) {
        console.log('trying to refresh access token');
        const response = await refreshAccessToken(refreshToken);
        spotifyApi.setAccessToken(response.access_token);

        const result = await requestFn();
        return result;
      }
      console.warn('No spotify API refresh token set, cannot retry request');
      throw e;
    } else {
      throw e;
    }
  }
};

export { paginateRequest, refreshAuthWrapper };
