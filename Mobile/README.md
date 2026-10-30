# FitSwap Mobile

React Native + Expo + NativeWind app for the existing FitSwap website and API. The app includes member, gym-owner, and administrator navigation, native UPI workflows, shared responsive layouts, and the website’s existing 3D membership artwork with reduced-motion-aware animation. The interface uses bundled Manrope typography, deep ink surfaces, violet and lime accents, floating phone navigation, wallet-style passes, and photo-led gym and marketplace cards. Tablet layouts use a compact navigation rail.

## Project structure

The structure follows `Client/src`:

```text
Mobile/
  App.tsx                      # Provider composition
  app.config.js                # Conditional native Google configuration
  src/
    api/                       # Feature API adapters and secure native client
    assets/images/             # Website imagery and 3D membership sculpture
    components/
      common/                  # Shared hero and resource presentation
      charts/                  # Accessible labeled charts
      gyms/                    # Gym cards and platform-specific map views
      marketplace/             # Listing cards
      memberships/             # Digital membership pass cards
      navigation/              # Floating phone tabs and tablet rail
      ui/                      # Buttons, inputs, states, and responsive grids
    constants/                 # Menus, form definitions, coverage manifest
    contexts/                  # Auth, appearance, forms, confirmations
    hooks/                     # Resources, actions, live notifications, layout
    layouts/                   # Safe-area, scrolling, keyboard-aware page shell
    pages/
      auth/ dashboard/ gyms/ memberships/ marketplace/ transfers/
      trials/ wellness/ diet/ profile/ settings/ notifications/
      security/ support/ billing/ gym-owner/ admin/
    routes/                    # Typed navigation and role policy
    types/                     # Shared domain types
    utils/                     # Formatting, media, uploads, location, preview
  scripts/check-parity.cjs      # Compare website routes with native mappings
  test/                        # Client, role, location, layout, format checks
```

The API adapters retain the website’s feature boundaries; multipart uploads and authenticated downloads use native helpers. NativeWind 4 uses Tailwind 3 independently of the website’s Tailwind 4 build.

## Start

Uses Expo SDK 58 with React Native 0.88. Requires Node 22.13+ on the 22 line or Node 24.3+ on the 24 line, and npm. Node 24.13 is supported.

```sh
cd Mobile
npm ci
cp .env.example .env
```

Expo Go automatically uses the computer address from its development server for the API on port 8000 and website on port 5173. You can leave the URL overrides blank for local development, then run:

```sh
npm start -- --clear          # Expo Go (SDK 58)
```

Optional override for a deployed backend or a different local API port:

```env
EXPO_PUBLIC_API_URL=http://YOUR_COMPUTER_LAN_IP:8000/api
EXPO_PUBLIC_WEB_URL=http://YOUR_COMPUTER_LAN_IP:5173
```

The app discovers the local Expo computer on physical iOS and Android devices and retains `10.0.2.2` / `localhost` fallbacks for simulators. Keep the API and database running. Your phone and computer must be on the same Wi-Fi, and Expo Go must have Local Network access in iOS Settings. With an Expo tunnel, set `EXPO_PUBLIC_API_URL` to an API URL reachable by your phone; the Metro tunnel does not expose the API. Use HTTPS addresses for deployed services. Reload the app after changing environment variables. The browser preview uses its own hostname for the local API, keeping session cookies on the same site.

`npm start` explicitly targets Expo Go. Scan the new QR code with the iPhone Camera app, with your phone and computer on the same network. If starting Expo directly, use `npx expo start --go --clear`; a plain `npx expo start` may select a development build because this project also includes `expo-dev-client`.

After installing or upgrading dependencies, stop any older Metro process with Ctrl+C and restart it. Do not keep a Metro process running while reinstalling its `node_modules` directory.

If Expo Go reports an SDK mismatch, the SDK in the app must match the installed Expo Go version. This project has been updated to SDK 58; do not use a saved SDK 57 QR code.

The sign-in screen includes explicit read-only previews for **Member**, **Gym owner**, and **Admin**. They use sample data, block writes and file downloads, and do not replace live authentication or authorization.

## Native builds

```sh
npm run android                # Build/run with Android Studio configured
npm run ios                    # Build/run with Xcode configured
npm run start:dev-client        # Start an installed custom development client
```

EAS profiles are included for development, preview Android APKs, and production. Configure your own Expo project and signing credentials before using them:

```sh
npx eas-cli build --platform android --profile preview
```

No cloud build, signing setup, app-store submission, or paid service has been performed. Production Google sign-in requires a native build; Expo Go cannot load its native SDK. The Expo Go sign-in screen directs you to email sign-in rather than loading that unavailable native module. Use `npm run start:dev-client` after building and installing the custom development app.

## Google and administrator sign-in

Set `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` to the same web OAuth client ID as the server’s `GOOGLE_CLIENT_ID`. Set `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` for iOS; `app.config.js` derives the iOS URL scheme and enables the Google config plugin when it is supplied. Configure the Android application ID and signing certificate in your Google OAuth project. The web preview uses Expo AuthSession and requires an authorized web redirect URI.

Native auth routes reuse existing credential checks, server sessions, JWT generation, throttling, revocation, and administrator MFA:

- `POST /api/auth/mobile/login`
- `POST /api/auth/mobile/google`
- `POST /api/auth/mobile/admin-mfa/verify`

An administrator gets a challenge before any session is created. Enrollment uses the existing challenge-protected enrollment route. A native token is returned only after the required authentication steps succeed and is stored with Expo SecureStore. Website sign-in and MFA continue to issue HTTP-only cookies and do not return a token in JSON.

## Web preview

```sh
npm run web
```

Add the exact Expo web origin to the API’s existing `CLIENT_URLS` for live web sign-in, while preserving the website’s approved origins:

```env
CLIENT_URLS=http://localhost:5173,http://localhost:8081
```

Web requests use cookies and existing CSRF checks. Native requests omit cookies and use bearer authorization. Session tokens are never embedded in URLs.

## Features and parity

See [FEATURE-COVERAGE.md](FEATURE-COVERAGE.md) for the complete route and feature checklist. All 38 patterns in the current website route file have explicit mobile mappings. Run `npm run parity` from the actual FitSwap repository to detect new website routes that need a mapping.

The native app now contains the workflows previously deferred in the first member-only scaffold: owner/admin operations, trials, maps and crowd reports, wellness/diet, support and attachments, security/settings, Google/MFA integration, direct UPI checkout, incoming payments and seller/gym approvals, subscriptions and boosts, and live in-app notifications.

Real workflows require the same API infrastructure as the website: PostgreSQL/Redis, email delivery, image/document storage and scanning, configured recipient/platform UPI accounts, and optional AI/provider configuration. Payment receipt and transfer approval remain server-controlled; entering a UTR does not automatically activate or transfer a membership.

Reset/verification links work through the existing website or the app’s token-completion screens. The app handles `fitswap://reset-password?token=...` and `fitswap://verify-email?token=...`. Production universal/app links need the real domain and signing setup.

## Checks

```sh
npm run typecheck
npm test
npm run parity
npm run export
# From FitSwap/Server:
node --test test/mobile-auth.test.js
```

Automated checks cover token/cookie separation, multipart boundaries and idempotency, session expiry, preview isolation, role access, location math, responsive card widths, formatting, and native/website login and MFA regressions. Production JavaScript exports are checked for Android, iOS, and web. Preview UI checks use labeled sample data.

These checks do not establish production readiness. Signed APK/IPA compilation, real devices, real database accounts, Google configuration, MFA enrollment, payments, uploads, and permission flows still need release validation in your environment. See [VALIDATION.md](VALIDATION.md).

Dependency audit advisories remain in the upstream Expo CLI/Tailwind 3 toolchain; the package manager’s suggested fixes include incompatible downgrades or major migrations, so they have not been applied blindly.

References: [Expo](https://docs.expo.dev/versions/latest/), [NativeWind](https://www.nativewind.dev/docs/getting-started/installation), [native Google setup](https://react-native-google-signin.github.io/docs/setting-up/expo).
