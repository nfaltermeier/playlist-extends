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

export { paginateRequest };
