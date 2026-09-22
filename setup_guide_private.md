# Complete Setup Guide (For Private Repositories)

Since your Expo repositories are **private**, the Next.js App Store backend needs special permission to "see" your releases. Below is the full step-by-step guide to setting up both the Expo side and the Website side.

---

## Phase 1: Set up the Next.js App Store

Because your repos are private, the App Store backend needs a GitHub token to access them.

### Step 1: Generate a GitHub Personal Access Token
1. Go to your GitHub Settings -> [Developer Settings](https://github.com/settings/tokens) -> **Personal access tokens (classic)**.
2. Click **Generate new token (classic)**.
3. Give it a note (e.g., `App Store Backend`).
4. Set expiration to **No expiration**.
5. Under scopes, check the **`repo`** box (this gives it read/write access to your private repos).
6. Click **Generate token** and copy it. Keep it secure!

### Step 2: Add it to your App Store Environment
1. Open your `d:\myWork\skora-playStore\.env.local` file.
2. Add this line:
   ```env
   GITHUB_TOKEN=ghp_your_secret_token_here
   ```
3. *(When deploying to Vercel, remember to add `GITHUB_TOKEN` in your Vercel project settings).*
4. Restart your `npm run dev` server so it picks up the token.

---

## Phase 2: Set up the Expo Projects (Parents & Teachers)

You need to do this for **both** your Parents and Teachers repositories.

### Step 1: Set up EAS Configuration
1. Open your Expo project code (e.g., the Teachers app).
2. Look at the `eas.json` file in your root folder. Make sure the production build profile creates an APK:
   ```json
   "build": {
     "production": {
       "android": {
         "buildType": "apk"
       }
     }
   }
   ```

### Step 2: Get your Expo Token
1. Go to [https://expo.dev](https://expo.dev), log in, and go to your **Account Settings -> Access Tokens**.
2. Create a new token and copy it.

### Step 3: Add the Expo Token to GitHub Secrets
1. Go to your private GitHub repo for the Expo app on GitHub.com.
2. Go to **Settings** -> **Secrets and variables** -> **Actions**.
3. Click **New repository secret**.
4. Name: `EXPO_TOKEN`
5. Value: *paste your Expo token here*.

### Step 4: Allow GitHub Actions to Create Releases
1. In the same GitHub repo settings, go to **Actions** -> **General** on the left sidebar.
2. Scroll down to **Workflow permissions**.
3. Select **Read and write permissions** and click Save. (This allows the automated workflow to create a GitHub Release).

### Step 5: Add the GitHub Action Workflow
1. In your Expo project code, create a folder structure exactly like this: `.github/workflows/`
2. Create a file named `build-and-release.yml` inside it.
3. Copy the exact contents from the `d:\myWork\skora-playStore\expo-pipeline-template\.github\workflows\build-and-release.yml` file into it.

---

## Phase 3: The Workflow in Action

Now that everything is wired up, here is your day-to-day workflow:

1. **Write Code**: You make updates to your Expo app.
2. **Update Version**: Open your `app.json` inside the Expo app and bump the `"version"` (e.g., from `"1.0.0"` to `"1.0.1"`).
3. **Commit & Push**: Commit your changes and push them to the `main` branch on GitHub.
4. **Sit Back & Relax**:
   - The GitHub Action automatically starts.
   - It builds the APK on Expo servers.
   - Once finished, it creates a GitHub Release in your private repo (e.g., Version 1.0.1).
   - It attaches the APK and generates a changelog from your commit messages.
5. **App Store Updates**: Because you connected this repo in the App Store Admin Panel (and added the `GITHUB_TOKEN`), your website instantly detects the new release, shows the new version, updates the APK size, and automatically downloads the new APK when a user clicks Download!
