# Fixing Vercel NOT_FOUND (404) Error

## 1. **The Fix**

### What Changed:
1. **Updated `api/index.js` export**: Changed from `module.exports = app` to ensure proper Vercel compatibility
2. **Added root endpoint**: Added a test endpoint at `/` to verify the function is accessible
3. **Added 404 handler**: Added explicit 404 handling to see what routes are being requested
4. **Added function configuration**: Added `functions` config in `vercel.json` to set timeout

### Files Modified:
- `api/index.js` - Improved error handling and added test endpoints
- `vercel.json` - Added function configuration

## 2. **Root Cause Analysis**

### What Was Happening:
When you deployed to Vercel, the serverless function at `api/index.js` wasn't being found or wasn't responding correctly. This could happen because:

1. **Export Format Issue**: Vercel's `@vercel/node` builder expects Express apps to be exported in a specific way
2. **Route Matching**: The routes might not be matching correctly when Vercel routes requests
3. **Function Not Deployed**: The function file might not have been included in the deployment
4. **Path Mismatch**: The routing configuration might not be correctly mapping requests to the function

### What It Needed To Do:
- Properly export the Express app for Vercel's serverless environment
- Handle all API routes correctly
- Provide clear error messages when routes aren't found
- Ensure the function is accessible and responding

### Conditions That Triggered This:
- Using `builds` configuration in `vercel.json` (older approach)
- Express app routes mounted at `/api/*` paths
- Vercel routing `/api/(.*)` to the serverless function
- The function not being found or not responding

### The Misconception:
The assumption was that simply exporting the Express app with `module.exports = app` would work, but Vercel's serverless environment sometimes needs explicit handling, especially with the `builds` configuration approach.

## 3. **Understanding the Concept**

### Why This Error Exists:
The NOT_FOUND error exists because:
- **Serverless Functions Are Isolated**: Each function is a separate deployment unit
- **Routing Must Be Explicit**: Vercel needs to know exactly which function handles which routes
- **Path Matching Matters**: The route patterns in `vercel.json` must correctly match requests to functions
- **Function Discovery**: Vercel must be able to find and execute the function file

### The Correct Mental Model:
Think of Vercel serverless functions like this:
1. **Request comes in** → `https://your-app.vercel.app/api/judges/login`
2. **Vercel matches route** → Pattern `/api/(.*)` matches, routes to `/api/index.js`
3. **Function executes** → Your Express app handles the request
4. **Response sent** → Express sends the response back through Vercel

The key is that:
- The function file must exist and be properly exported
- The routing configuration must correctly map requests
- The Express app must handle the paths it receives (which include `/api` prefix)

### How This Fits Into Vercel's Framework:
- **Modern Approach**: Vercel prefers files in `api/` directory (auto-detected)
- **Legacy Approach**: Using `builds` in `vercel.json` (what we're using)
- **Both work**, but the `builds` approach requires explicit configuration

## 4. **Warning Signs to Watch For**

### What To Look Out For:
1. **404 errors on all API routes** → Function not found or not deployed
2. **Some routes work, others don't** → Route matching issue
3. **Function logs show errors** → Check Vercel function logs in dashboard
4. **Build succeeds but API doesn't work** → Function export or routing issue

### Similar Mistakes:
1. **Forgetting to export the function** → Always export your Express app
2. **Wrong route patterns** → Test route patterns match your API paths
3. **Missing function file** → Ensure `api/index.js` exists and is committed
4. **Environment variables not set** → Check Vercel dashboard for env vars

### Code Smells:
- ✅ **Good**: `module.exports = app` (simple, works with @vercel/node)
- ⚠️ **Warning**: Complex routing without test endpoints
- ❌ **Bad**: No error handling or 404 handlers
- ❌ **Bad**: Routes that don't match the routing configuration

## 5. **Alternative Approaches**

### Approach 1: Current (builds configuration)
**Pros:**
- Explicit control over builds
- Can configure build settings per function
- Works with monorepos

**Cons:**
- More complex configuration
- Requires `vercel.json` maintenance
- Older approach

**When to use:** When you need explicit build control or have a complex setup

### Approach 2: Modern Vercel (auto-detection)
**Pros:**
- Simpler - just put files in `api/` directory
- Automatic function detection
- Less configuration needed

**Cons:**
- Less control over build process
- May not work well with monorepos

**How to use:**
```json
// Minimal vercel.json - just for frontend
{
  "buildCommand": "cd client && npm install && npm run build",
  "outputDirectory": "client/build"
}
```

### Approach 3: Separate API deployment
**Pros:**
- Complete separation of concerns
- Can scale independently
- Easier debugging

**Cons:**
- More complex deployment
- CORS configuration needed
- Two separate projects

**When to use:** When API and frontend have different deployment needs

## Testing the Fix

After deploying, test these endpoints:

1. **Root test**: `https://your-app.vercel.app/api/`
   - Should return: `{ "message": "API is working", ... }`

2. **Health check**: `https://your-app.vercel.app/api/health`
   - Should return: `{ "status": "ok", "connected": true/false }`

3. **Actual endpoint**: `https://your-app.vercel.app/api/judges/login`
   - Should handle the login request

## Next Steps

1. **Commit and push** the changes
2. **Redeploy** on Vercel (or wait for auto-deploy)
3. **Test** the `/api/` endpoint first
4. **Check Vercel logs** if still getting 404
5. **Verify environment variables** are set (MONGODB_URI)

## If Still Not Working

1. Check Vercel Dashboard → Functions → See if `api/index.js` appears
2. Check Build Logs → Ensure the function was built
3. Check Function Logs → Look for runtime errors
4. Test locally: `vercel dev` to simulate the environment
5. Verify the file exists: Check that `api/index.js` is in your repository
