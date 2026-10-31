# Gym Tracker

A phone app for logging workouts and tracking progress week by week.
Installs to the iPhone home screen and works offline. All workout data stays on your device.

## Features

- Saved routines (e.g. "Push Day") that load their exercises in one tap
- Tick-off set logging with last time's numbers shown for every set
- New exercises start their own history log automatically
- Progress per exercise: personal records, a weekly chart, and a week-by-week table
- Weekly sets per muscle group
- lbs / kg switch, backup download and restore

## Run it on your computer

```bash
npm install
npm run dev
```

Then open http://localhost:5173.

## Publish

Pushing to the `main` branch on GitHub builds and publishes the app to GitHub Pages
(see `.github/workflows/deploy.yml`). The repository must be named `gym-tracker`,
or change `REPO_NAME` in `vite.config.js` to match.

## Change the starter exercises

Edit `src/data/starterExercises.js`, then increase `STARTER_VERSION` by one.

## Change the app icon

Replace `public/icon.svg`, then run `npx pwa-assets-generator`.
