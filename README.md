# Playlist Extends
Create spotify playlists that contain other spotify playlists, and then easily update the resulting playlists.
Supports custom sorting of the resulting playlists and lets you import/export your data.

[Check it out.](https://nfaltermeier.github.io/playlist-extends)

## Design
This is a serverless app (except for Spotify, of course), so it only needs static file hosting. Because there is no backend, all logic is done in the website and so I chose to use Typescript.

## Setup

Requires having node.js installed on your system. I am using node.js 16. npm version 7+ is required.

Copy `src/config.example.ts` to `src/config.ts` and fill in values with your own Spotify developer application settings.

Run `npm i` to install dependencies.

## Running

Run `npm start` and visit [http://localhost:3000](http://localhost:3000).