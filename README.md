# Song Competition Reward Website

A React.js web application for managing and scoring song competitions with a comprehensive scoring system based on 5 criteria.

## Features

- **Song Management**: Add, edit, delete songs in the competition
- **Judge Management**: Create and manage judges with individual passwords
- **Scoring System**: Judges can score songs based on 5 criteria (1-5 points each):
  - (က) Entry/Exit Accuracy (သီချင်း အဝင်/အထွက် မှန်/မမှန်)
  - (ခ) Lyrics Accuracy (သီချင်းစာသား မှန်/မမှန်)
  - (ဂ) Voice Harmony (သီချင်းနှင့်သီဆိုသူ၏အသံ ဟန်ချက် ညီ/မညီ)
  - (ဃ) Performance Flow (သီချင်းသီဆိုမှုအပေါ် စီးမျောမှု ရှိ/မရှိ)
  - (င) Audience Support (ပရိတ်သတ်များ၏ အားပေးမှု)
- **Results & Rankings**: View competition results in table format with total scores
- **Program Order**: Sort and manage competition program order
- **Judge Authentication**: Secure login system for judges
- **Reward System**: Track rewards and comments from each judge

## Tech Stack

- **Frontend**: React.js 18 with React Router
- **Backend**: Node.js with Express
- **Database**: MongoDB with Mongoose
- **Styling**: CSS3 with modern gradients

## Installation

1. **Install backend dependencies**:
```bash
npm install
```

2. **Install React client dependencies**:
```bash
cd client
npm install
cd ..
```

Or use the npm script:
```bash
npm run install-client
```

3. **Create a `.env` file** in the root directory:
```
MONGODB_URI=mongodb+srv://mongodb:00000000@cluster0.horcmx3.mongodb.net/news_website?retryWrites=true&w=majority
PORT=3000
```

## Development

### Option 1: Run both servers separately (Recommended)

1. **Start the backend server** (in the root directory):
```bash
npm start
# or for auto-reload:
npm run dev
```

2. **Start the React development server** (in a new terminal):
```bash
cd client
npm start
```

The React app will open at `http://localhost:3001` (or next available port) and proxy API requests to `http://localhost:3000`.

### Option 2: Build and serve from backend

1. **Build the React app**:
```bash
cd client
npm run build
cd ..
```

2. **Start the backend server** (it will serve the built React app):
```bash
npm start
```

The app will be available at `http://localhost:3000`

## Routes

- `/judge` - Judge login page
- `/judge/scoring` - Judge scoring panel (requires login)
- `/admin/songs` - Manage songs
- `/admin/judges` - Manage judges
- `/admin/program` - Program order
- `/admin/results` - Results table

## API Endpoints

### Songs
- `GET /api/songs` - Get all songs
- `GET /api/songs/:id` - Get a specific song
- `POST /api/songs` - Create a new song
- `PUT /api/songs/:id` - Update a song
- `DELETE /api/songs/:id` - Delete a song

### Scores
- `GET /api/scores` - Get all scores
- `GET /api/scores/song/:songId` - Get scores for a specific song
- `GET /api/scores/judge/:judgeName` - Get scores by a specific judge
- `POST /api/scores` - Submit a new score
- `PUT /api/scores/:id` - Update a score
- `DELETE /api/scores/:id` - Delete a score

### Judges
- `GET /api/judges` - Get all judges
- `POST /api/judges/create` - Create judges (bulk)
- `POST /api/judges/login` - Judge login
- `PUT /api/judges/:id/password` - Update judge password
- `DELETE /api/judges/:id` - Delete a judge

### Results
- `GET /api/results/rankings` - Get competition rankings (with total scores)
- `GET /api/results/song/:songId` - Get detailed results for a specific song

## Database Structure

### Song Collection
- `title` (String, required)
- `artist` (String, required)
- `singer` (String, required) - displayed as "Competitor" in UI
- `lyrics` (String, optional)
- `audioUrl` (String, optional)
- `videoUrl` (String, optional)
- `programOrder` (Number, default: 0)
- `createdAt` (Date)

### Score Collection
- `songId` (ObjectId, reference to Song)
- `judgeName` (String, required)
- `criteria` (Object):
  - `entryExit` (Number, 1-5)
  - `lyricsAccuracy` (Number, 1-5)
  - `voiceHarmony` (Number, 1-5)
  - `performanceFlow` (Number, 1-5)
  - `audienceSupport` (Number, 1-5)
- `totalScore` (Number, auto-calculated)
- `reward` (String, optional)
- `createdAt` (Date)

### Judge Collection
- `name` (String, required, unique)
- `password` (String, required)
- `createdAt` (Date)

## Usage

1. **Admin Setup**:
   - Go to `/admin/judges`
   - Enter the number of judges
   - Click "Create Judges"
   - Save the passwords shown

2. **Judge Login**:
   - Go to `/judge`
   - Enter judge name (e.g., `judge1`)
   - Enter password
   - Click "Login"

3. **Scoring**:
   - After login, select a song
   - Adjust sliders for each criterion (1-5 points)
   - Add reward/comment if needed
   - Submit score

4. **View Results**:
   - Admin can view results in `/admin/results`
   - Results show total scores (not averages) in table format
   - Individual judge rewards are displayed

## Production Build

For production deployment:

1. Build the React app:
```bash
cd client
npm run build
cd ..
```

2. The `client/build` folder will be served automatically by the Express server

3. Start the production server:
```bash
npm start
```

## Notes

- Each judge can only score a song once (prevents duplicate scoring)
- Total score is automatically calculated (sum of all 5 criteria)
- Results are ranked by total score (highest to lowest)
- Top 3 positions have special styling (gold, silver, bronze)
- Results display total scores, not averages

- Results display total scores, not averages