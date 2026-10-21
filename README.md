# Progress Report

A progress dashboard for tracking personal goals. Add trackers, adjust progress
in custom increments, and remove completed or abandoned goals. Without Supabase
configuration, the dashboard uses this browser's local storage. With Supabase
configured, users can sign in with GitHub and sync their progress across devices.

## Development

Install dependencies and start the Vite development server:

```sh
npm install
npm run dev
```

To enable account sync, copy `.env.example` to `.env` and set the Supabase URL
and publishable key from the project's API settings. The app remains usable in
local-only mode when these values are not present.

Create a production build with:

```sh
npm run build
```

The GitHub Pages workflow builds the static site with the `/progress/` base
path and publishes `.output/public`.
