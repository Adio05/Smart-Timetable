Engra Timetable

Engra is a weekly lecture timetable for keeping course schedules organized across devices. It includes a day-by-day agenda, timetable views, clash detection, class reminders, and installable app support.

## Features

- Add and edit classes with course code, title, instructor, location, notes, and color.
- View the schedule as a weekly timetable, daily view, or agenda.
- Detect overlapping classes and show suggested available time slots.
- Save the timetable locally and sync the shared timetable through Firebase after signing in.
- Sign in with Google or email and password.
- Set browser reminders and optionally install Engra as a Progressive Web App.

## Getting started

### Requirements

- Node.js 20.19+ or 22.12+
- npm

### Install and run

```bash
npm install
npm run dev
```

Open the local URL printed by Vite (usually `http://localhost:3000`).

To create a production build or preview it locally:

```bash
npm run build
npm run preview
```

To check TypeScript types:

```bash
npm run lint
```

## Firebase setup

Local timetable storage works on the device. To enable sign-in and shared cloud sync, configure a Firebase project for the app:

1. Enable **Google** and **Email/Password** providers in Firebase Authentication.
2. Add your development and deployed site domains to Firebase Authentication's authorized domains.
3. Create or select the Firestore database used by the app.
4. Publish the rules in [`firestore.rules`](firestore.rules). Signed-in users can read the shared timetable; writes are limited to the verified administrator configured in `src/lib/access.ts` and the Firestore rules.
5. Set the Firebase web app configuration in `firebase-applet-config.json` before building and deploying.

Firebase web configuration is included in the client bundle, so access must be protected with Firebase Authentication and Firestore Security Rules. Never put service account credentials or other private keys in this repository.

## Reminders and offline use

Timetable data is stored locally, so the app can show the saved schedule without signing in. When signed in, changes sync with the shared Firestore timetable. Each device must grant notification permission for reminders. Reminders are checked while the app is open; browser notifications may not arrive after the app or browser has been fully closed.

## Tech stack

React, TypeScript, Vite, Tailwind CSS, Firebase Authentication, Cloud Firestore, and Progressive Web App support.
