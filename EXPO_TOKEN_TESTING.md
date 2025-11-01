# Expo Token Testing Guide

This guide explains how to test and verify that the Expo PAT (Personal Access Token) is configured correctly and working.

## Configuration

The Expo PAT is configured in environment variables:
- **Backend**: `EXPO_TOKEN` or `EXPO_ACCESS_TOKEN` in `backend/.env`
- **Frontend**: Referenced via `EXPO_PUBLIC_API_BASE_URL` for backend API calls

**Current Token:** Configured and documented in `.env.example`

## Testing Methods

### 1. Frontend App Testing (Recommended)

1. Open the app
2. Navigate to **Settings**
3. Scroll to the **Notifications** section
4. Tap **"Test Expo Token"**
5. Review the test results:
   - ✅ Push Token: Retrieves device push token
   - ✅ Backend Config: Verifies backend token configuration
   - ✅ Send Notification: Sends a test notification to your device

### 2. Backend API Testing

#### Verify Token Configuration

```bash
curl http://localhost:3000/api/test-expo-token/verify
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Expo token is configured and SDK initialized successfully",
  "details": {
    "tokenConfigured": true,
    "tokenLength": 47,
    "tokenPrefix": "OLe8Hjc4mz...",
    "sdkInitialized": true,
    "tokenValidationWorking": true
  }
}
```

#### Send Test Notification

```bash
curl -X POST http://localhost:3000/api/test-expo-token/send-test \
  -H "Content-Type: application/json" \
  -d '{
    "pushToken": "ExponentPushToken[YOUR_DEVICE_TOKEN]"
  }'
```

**Get Push Token:**
- Use the app's Settings → Test Expo Token (first step will show your token)
- Or use `getNotificationToken()` from `lib/notifications.ts`

### 3. Command Line Script Testing

```bash
# From project root
node scripts/test-expo-token.js

# To send a test notification
node scripts/test-expo-token.js ExponentPushToken[YOUR_TOKEN]
```

**Requirements:**
- Backend `.env` file with `EXPO_TOKEN` set
- Backend server running on port 3000 (or update `API_BASE_URL`)

## Test Flow

### Complete End-to-End Test

1. **Get Push Token**
   - App requests notification permissions
   - Expo generates push token for device
   - Token returned to app

2. **Verify Backend Config**
   - Backend reads `EXPO_TOKEN` from environment
   - Initializes Expo SDK with token
   - Verifies SDK initialization

3. **Send Test Notification**
   - App sends push token to backend
   - Backend validates token format
   - Backend sends notification via Expo Push API
   - Device receives notification

## Troubleshooting

### Error: "EXPO_TOKEN not configured"
- Check `backend/.env` file exists
- Verify `EXPO_TOKEN=OLe8Hjc4mzmJ-eB6wVC2RxyjcNIShJRBS1uQUjmn` is set
- Restart backend server after adding token

### Error: "Invalid push token format"
- Push token must start with `ExponentPushToken[`
- Get a fresh token using `getNotificationToken()` in the app

### Error: "Failed to send notification"
- Check Expo token is valid and not expired
- Verify device has notification permissions enabled
- Check backend logs for detailed error messages

### Backend Connection Error
- Ensure backend server is running
- Check `EXPO_PUBLIC_API_BASE_URL` in app matches backend URL
- Verify CORS is configured correctly

## Integration Points

### Backend Service
- **File:** `backend/src/services/notifications.js`
- Uses `EXPO_TOKEN` to initialize Expo SDK
- Handles push notification sending

### Backend API Routes
- **File:** `backend/src/routes/test-expo-token.js`
- `/api/test-expo-token/verify` - Verify token configuration
- `/api/test-expo-token/send-test` - Send test notification

### Frontend Test Utility
- **File:** `lib/testExpoToken.ts`
- `testGetPushToken()` - Get device push token
- `testBackendTokenConfig()` - Verify backend config
- `testSendNotification()` - Send test notification
- `runCompleteExpoTokenTest()` - Run all tests

### Settings UI
- **File:** `app/(main)/settings.tsx`
- "Test Expo Token" button in Notifications section
- Displays test results in alert dialog

## Next Steps

After confirming token works:

1. ✅ Configure APNs (iOS) in Expo dashboard
2. ✅ Configure FCM (Android) in Expo dashboard
3. ✅ Test push notifications between two devices
4. ✅ Integrate push notifications into consent request flow
5. ✅ Set up device token registration endpoint
6. ✅ Implement notification delivery tracking

## Resources

- [Expo Push Notifications Documentation](https://docs.expo.dev/push-notifications/overview/)
- [Expo Server SDK](https://github.com/expo/expo-server-sdk-node)
- [Expo Dashboard](https://expo.dev)

