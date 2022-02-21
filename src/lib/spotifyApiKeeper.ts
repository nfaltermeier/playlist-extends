import SpotifyWebApi from 'spotify-web-api-node';

// Have one global instance of the API, can't be stored in redux because it is a class
const spotifyApi = new SpotifyWebApi();

export default spotifyApi;
