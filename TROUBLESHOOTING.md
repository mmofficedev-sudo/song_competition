# Troubleshooting Guide

## "Error connecting to server" Issue

If you see "Error connecting to server. Please try again." on the login page, follow these steps:

### 1. Check Environment Variables in Vercel

**Most Common Issue**: `MONGODB_URI` is not set or incorrect.

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Verify that `MONGODB_URI` is set with your MongoDB connection string
4. Make sure it's set for **Production**, **Preview**, and **Development** environments
5. After adding/updating, **redeploy** your application

### 2. Test the API Health Endpoint

Open your browser and visit:
```
https://your-project.vercel.app/api/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "connected": true
}
```

**If you get an error:**
- Check Vercel function logs (Dashboard → Functions → View Logs)
- Verify the API route is deployed correctly

### 3. Check MongoDB Atlas Configuration

**IP Whitelist:**
- Go to MongoDB Atlas → Network Access
- Add `0.0.0.0/0` to allow all IPs (for development)
- Or add Vercel's IP ranges (check Vercel docs for current IPs)

**Database User:**
- Ensure your database user has read/write permissions
- Verify the username and password in the connection string

### 4. Check Vercel Function Logs

1. Go to Vercel Dashboard → Your Project
2. Click on **Functions** tab
3. Click on a function (e.g., `/api/index.js`)
4. Check the **Logs** for errors

Common errors you might see:
- `MONGODB_URI is not defined` → Set environment variable
- `MongoServerError: Authentication failed` → Check MongoDB credentials
- `MongoNetworkError` → Check IP whitelist

### 5. Test API Endpoints Directly

Use curl or Postman to test:

```bash
# Health check
curl https://your-project.vercel.app/api/health

# Test judge login (replace with actual credentials)
curl -X POST https://your-project.vercel.app/api/judges/login \
  -H "Content-Type: application/json" \
  -d '{"name":"judge1","password":"judge1123"}'
```

### 6. Verify Vercel Configuration

Check that `vercel.json` is correct:
- API routes should be at `/api/*`
- Frontend should be served from `client/build`

### 7. Check Browser Console

1. Open your deployed site
2. Press F12 to open Developer Tools
3. Go to **Console** tab
4. Look for any errors when trying to login
5. Go to **Network** tab
6. Try logging in and check the API request:
   - Status code (should be 200 for success)
   - Response body
   - Any CORS errors

### 8. Common Solutions

**Solution 1: Redeploy After Setting Environment Variables**
```bash
# After setting MONGODB_URI in Vercel dashboard
# Trigger a new deployment or wait for auto-deploy
```

**Solution 2: Check MongoDB Connection String Format**
```
mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority
```

**Solution 3: Verify Routes Are Working**
- Test `/api/health` first
- Then test `/api/judges/login`
- Check Vercel function logs for detailed errors

### 9. Debug Steps

1. ✅ Check `MONGODB_URI` is set in Vercel
2. ✅ Test `/api/health` endpoint
3. ✅ Check MongoDB Atlas IP whitelist
4. ✅ Check Vercel function logs
5. ✅ Test API with curl/Postman
6. ✅ Check browser console for errors
7. ✅ Verify judges exist in database (use MongoDB Atlas UI)

### 10. Still Not Working?

If the issue persists:

1. **Check Vercel Build Logs**: Make sure the build completed successfully
2. **Check Function Logs**: Look for runtime errors
3. **Test Locally**: Run `vercel dev` to test locally with same environment
4. **Verify Database**: Ensure judges are created in the database
5. **Check CORS**: Should be handled by `cors()` middleware, but verify

### Quick Test Script

Create a test file to verify your setup:

```javascript
// test-api.js
const API_URL = 'https://your-project.vercel.app/api';

async function testAPI() {
  try {
    // Test health
    const health = await fetch(`${API_URL}/health`);
    console.log('Health:', await health.json());
    
    // Test login
    const login = await fetch(`${API_URL}/judges/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'judge1', password: 'judge1123' })
    });
    console.log('Login:', await login.json());
  } catch (error) {
    console.error('Error:', error);
  }
}

testAPI();
```

Run with: `node test-api.js`
