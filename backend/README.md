# EchoID Backend API

Node.js/Express backend API server for EchoID.

## Features

- Handle management (claim, resolve, verify)
- Consent request management
- Push notification support via Expo
- Device registration
- Transaction monitoring
- PostgreSQL database
- Rate limiting
- Error handling

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

Required variables:
- `DATABASE_URL` - PostgreSQL connection string
- `EXPO_PROJECT_ID` - Your Expo project ID
- `PORT` - Server port (default: 3000)

### 3. Set Up Database

1. Install PostgreSQL if not already installed
2. Create database:
   ```sql
   CREATE DATABASE echoid;
   ```
3. Update `.env` with your database credentials
4. Tables will be created automatically on first run

### 4. Run Server

Development:
```bash
npm run dev
```

Production:
```bash
npm start
```

## API Endpoints

### Handles
- `POST /api/handles/claim` - Claim a new handle
- `GET /api/handles/:handle` - Resolve handle to wallet address
- `POST /api/handles/challenge` - Get signature challenge
- `POST /api/handles/verify` - Verify handle signature

### Consent Requests
- `POST /api/consent-requests` - Create consent request
- `GET /api/consent-requests?handle=...` - Get pending requests
- `POST /api/consent-requests/:id/accept` - Accept request
- `POST /api/consent-requests/:id/reject` - Reject request

### Users
- `POST /api/users/:handle/register-device` - Register device for push
- `DELETE /api/users/:handle/devices/:deviceId` - Unregister device

### Notifications
- `POST /api/notifications/send` - Send push notification

### Config
- `GET /api/config` - Get protocol configuration

### Transactions
- `POST /api/transactions/monitor` - Monitor transaction status

## Database Schema

See `src/db/schema.js` for table definitions:
- `handles` - User handles and wallet mappings
- `consent_requests` - Pending consent requests
- `device_registrations` - Device push tokens
- `transactions` - On-chain transaction tracking

## Testing

Health check:
```bash
curl http://localhost:3000/health
```

## Deployment

### Environment Variables

Set all required environment variables in your hosting platform:
- Heroku: `heroku config:set KEY=value`
- Railway: Use dashboard
- AWS: Use Secrets Manager
- Vercel: Use dashboard

### Database

Use managed PostgreSQL services:
- AWS RDS
- Heroku Postgres
- Supabase
- Railway PostgreSQL

## License

ISC

