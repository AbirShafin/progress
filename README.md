# Progress Report

A client-side progress dashboard for tracking personal goals. Add trackers,
adjust progress in custom increments, and remove completed or abandoned goals.
The dashboard saves its data in this browser's local storage, so it works
without an account or server database.

## Development

Install dependencies and start the Vite development server:

```sh
npm install
npm run dev
```

Create a production build with:

```sh
npm run build
```

The GitHub Pages workflow builds the static site with the `/progress/` base
path and publishes `.output/public`.
