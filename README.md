# 🎙️ Altcast Chrome Extension

Altcast is a Chrome extension that enables users to **record and play alternate audio commentaries** on top of YouTube videos. Think of it like a "Spotify for video commentators"—where users can provide their own take, analysis, or comedic twist on existing content, and others can listen in perfect sync.

---

## 🚀 Features

### 🔴 1. Record Commentary

When a user clicks the extension icon on a YouTube page:

- A small floating window appears in the **top-left corner** of the video page.
- The window includes:
  - `Record` – Begins recording using the microphone.
  - `Stop` – Ends the current recording session.
  - `Delete` – Discards the recording.
  - `Save` – Uploads the commentary.
- The recording **always starts from the beginning of the video** and ends when the user stops it.
- When saved, the recording is uploaded and tied to the YouTube `videoId`.

⚠️ **Recording is only available to logged-in users.** If the user is not logged in, the extension prompts them to sign in.

---

### 🎧 2. Playback Commentary

When a user visits a YouTube video:

- The extension checks for existing commentaries using the video ID.
- If commentaries exist:
  - A popup appears in the **top-left corner** showing:
    - A list or dropdown of available commentaries
    - The commentator’s **profile picture** and **username**
    - A `Play Commentary` button
    - A `Like` button
    - A `Copy Link` button to share the commentary
- When the user presses `Play Commentary`:
  - The YouTube video is **muted**
  - The commentary audio plays in **sync** with the video
  - The playback remains synced:
    - Seeking in the video updates the commentary audio position
    - Pausing the video pauses the audio
    - Playing the video resumes the audio
    - ✅ If the user changes the **playback speed** (e.g. 1.5x or 2x), the commentary will match the new speed

---

### ❤️ 3. Like System

- Each commentary includes a `Like` button in the popup window
- Likes are tracked and associated with each commentary
- 🔐 **Users must be logged in to like.**
- Likes are used to sort commentaries by popularity

---

### 🔗 4. Shareable Links

- Each commentary can be shared via a button that copies a unique URL:
https://altcast.xyz/video/YOUTUBE_VIDEO_ID?commentaryId=XYZ

yaml
Copy
Edit
- When opened, the site displays the video and plays the selected commentary
- Future versions may preload this in the extension too

---

## 🔐 Signup & Login

- **Users must sign up or log in** to:
- Record a commentary
- Like a commentary
- **Signup happens directly inside the extension**, via:
- Google OAuth
- Email (magic link or password)
- Once logged in, the user stays authenticated via local token storage (`chrome.storage.local`)
- Guest users can **play and listen freely** without authentication

---

## 🛠️ Tech Stack

### Client (Chrome Extension)
- JavaScript (Manifest V3)
- DOM manipulation & YouTube API
- MediaRecorder API for audio
- Audio/Video sync via `video.currentTime`
- React (for popup UI)

### Backend & Storage
- **Supabase** (PostgreSQL + Auth + Storage)
- Supabase Auth → signup, login, session handling
- Supabase Storage → audio file uploads (WebM format)
- Supabase Database → tables for users, commentaries, likes

---

## ☁️ Storage Details

- Audio files are recorded in **WebM** format using the MediaRecorder API
- Files are uploaded to **Supabase Storage**
- A public URL is generated for each commentary and stored in the database
- Playback is handled using HTML5 `<audio>` with real-time sync to the YouTube video

---

## 🧾 Supabase Schema (MVP)

### `users` Table
```sql
id UUID PRIMARY KEY
username TEXT
profile_picture_url TEXT
created_at TIMESTAMP DEFAULT now()

### 'commentaries' Table

id UUID PRIMARY KEY
video_id TEXT
user_id UUID REFERENCES users(id)
audio_url TEXT
created_at TIMESTAMP DEFAULT now()
likes INTEGER DEFAULT 0

### 'likes' Table

id UUID PRIMARY KEY
user_id UUID REFERENCES users(id)
commentary_id UUID REFERENCES commentaries(id)
created_at TIMESTAMP DEFAULT now()