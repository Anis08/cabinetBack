# Windows Setup Guide - Medical Practice Backend

## Issue: "nodemon is not recognized"

This error occurs on Windows when nodemon is not in your system PATH or not installed globally.

---

## ✅ Solutions (Choose One)

### **Solution 1: Pull Latest Changes (Recommended)**

I've updated the `package.json` to use `npx nodemon` which doesn't require global installation.

```powershell
# Pull the latest changes
git pull origin main

# Install dependencies (if needed)
npm install

# Run the server
npm run dev
```

This should now work because the script uses `npx nodemon` instead of just `nodemon`.

---

### **Solution 2: Install nodemon Globally**

Install nodemon globally on your Windows machine:

```powershell
npm install -g nodemon
```

Then run:
```powershell
npm run dev
```

---

### **Solution 3: Use Node Directly (No Hot Reload)**

If you don't need hot reload during development:

```powershell
npm run start
```

Or use the new script I added:
```powershell
npm run dev:node
```

This runs the server with regular Node.js (no automatic restart on file changes).

---

## 🚀 Complete Windows Setup Steps

### 1. Prerequisites

Ensure you have these installed:
- **Node.js** (v16 or higher): https://nodejs.org/
- **Git**: https://git-scm.com/
- **PostgreSQL** (if using local database): https://www.postgresql.org/

Check versions:
```powershell
node --version
npm --version
git --version
```

### 2. Clone/Pull Repository

If you haven't cloned yet:
```powershell
git clone https://github.com/Anis08/cabinetBack.git
cd cabinetBack
```

If you already have it, pull latest changes:
```powershell
git pull origin main
```

### 3. Install Dependencies

```powershell
npm install
```

### 4. Environment Setup

Create `.env` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/cabinet_db"

# JWT Secrets
ACCESS_TOKEN_SECRET="your-access-token-secret-here"
REFRESH_TOKEN_SECRET="your-refresh-token-secret-here"

# Server
PORT=4000
NODE_ENV=development

# CORS (if frontend on different port)
FRONTEND_URL="http://localhost:3000"
```

**Important**: Replace the values with your actual configuration!

### 5. Database Setup

#### If using PostgreSQL locally:

```powershell
# Create database
psql -U postgres
CREATE DATABASE cabinet_db;
\q

# Run migrations
npx prisma migrate deploy

# Generate Prisma Client
npx prisma generate
```

#### If using Supabase or remote PostgreSQL:

Just set the `DATABASE_URL` in `.env` to your remote connection string, then:

```powershell
npx prisma migrate deploy
npx prisma generate
```

### 6. Run the Server

```powershell
# Development mode (with auto-restart)
npm run dev

# OR Production mode (no auto-restart)
npm run start

# OR Simple node (no auto-restart)
npm run dev:node
```

The server should start on `http://localhost:4000`

---

## 🔍 Troubleshooting

### Issue: "Cannot find module '@prisma/client'"

**Solution:**
```powershell
npx prisma generate
npm install
```

---

### Issue: "Port 4000 already in use"

**Solution 1: Kill the process using port 4000**

```powershell
# Find process using port 4000
netstat -ano | findstr :4000

# Kill the process (replace PID with actual process ID)
taskkill /PID <PID> /F
```

**Solution 2: Change the port**

Edit `.env` file:
```env
PORT=4001
```

---

### Issue: "Database connection error"

**Check:**
1. PostgreSQL is running
2. `DATABASE_URL` in `.env` is correct
3. Database exists
4. User has proper permissions

**Test connection:**
```powershell
npx prisma db pull
```

---

### Issue: "JWT secret not defined"

**Solution:**

Ensure `.env` file has these secrets:
```env
ACCESS_TOKEN_SECRET="your-secret-here"
REFRESH_TOKEN_SECRET="another-secret-here"
```

Generate random secrets:
```powershell
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

### Issue: "CORS error" when calling from frontend

**Solution:**

Update `.env`:
```env
FRONTEND_URL="http://localhost:3000"
```

And ensure your frontend URL matches this in the CORS configuration.

---

## 📦 NPM Scripts Available

| Script | Command | Description |
|--------|---------|-------------|
| `npm run dev` | `npx nodemon src/server.js` | Development mode with auto-restart |
| `npm run start` | `node src/server.js` | Production mode |
| `npm run dev:node` | `node src/server.js` | Development without nodemon |
| `npm run prisma` | `prisma` | Run Prisma CLI commands |

---

## 🧪 Testing the Setup

### 1. Check Server Status

Open browser and go to:
```
http://localhost:4000
```

You should see a response (might be "Cannot GET /" which is fine).

### 2. Test an Endpoint

Using PowerShell or a tool like Postman, test the server:

```powershell
# Test endpoint (will require authentication)
curl http://localhost:4000/medecin/appointments -H "Authorization: Bearer YOUR_TOKEN"
```

### 3. Open Prisma Studio (Database Viewer)

```powershell
npx prisma studio
```

Opens browser at `http://localhost:5555` showing your database tables.

---

## 🔐 Setting Up Authentication

To get a JWT token for testing:

1. **Register/Login through your frontend** OR
2. **Create a test user directly in database** using Prisma Studio OR
3. **Use an API tool like Postman** to call login endpoints

---

## 🗄️ Database Management Commands

```powershell
# View current database schema
npx prisma db pull

# Create a new migration
npx prisma migrate dev --name description_here

# Apply migrations to production
npx prisma migrate deploy

# Generate Prisma Client
npx prisma generate

# Open Prisma Studio (GUI for database)
npx prisma studio

# Reset database (WARNING: Deletes all data!)
npx prisma migrate reset
```

---

## 🌐 Accessing from Frontend

If your frontend is on `http://localhost:3000`:

1. **Ensure CORS is configured** in `.env`:
   ```env
   FRONTEND_URL="http://localhost:3000"
   ```

2. **In your frontend, set baseURL**:
   ```javascript
   export const baseURL = "http://localhost:4000"
   ```

3. **Make API calls**:
   ```javascript
   const response = await fetch(`${baseURL}/medecin/appointments`, {
     headers: {
       'Authorization': `Bearer ${token}`
     }
   })
   ```

---

## 🚨 Common Windows-Specific Issues

### PowerShell Execution Policy

If scripts don't run, you might need to change PowerShell execution policy:

```powershell
# Check current policy
Get-ExecutionPolicy

# Set to allow scripts (as Administrator)
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Node Modules Path Issues

If npm commands don't work:

1. **Add npm to PATH**:
   - Open "Environment Variables"
   - Add `C:\Program Files\nodejs` to PATH
   - Add `C:\Users\<YourName>\AppData\Roaming\npm` to PATH

2. **Restart PowerShell** after changing PATH

### Line Ending Issues (CRLF vs LF)

If you see errors about line endings:

```powershell
# Configure git to handle line endings
git config --global core.autocrlf true
```

---

## 📊 Endpoints Available

After setup, these endpoints will be available:

### Authentication
- `POST /auth/login` - Login
- `POST /auth/register` - Register
- `POST /auth/refresh` - Refresh token

### Appointments
- `GET /medecin/appointments` - All appointments
- `GET /medecin/completed-appointments` - Completed (flat array)
- `GET /medecin/completed-appointments-grouped` - Completed (grouped by date)
- `GET /medecin/today-appointments` - Today's appointments

### Statistics
- `GET /medecin/statistics` - Practice statistics

### Patients
- `GET /medecin/list-patients` - All patients
- `POST /medecin/create-patient` - Create patient
- `GET /medecin/profile-patient/:id` - Patient profile

### Biological Requests
- `GET /medecin/biological-requests/:patientId` - Get requests
- `POST /medecin/biological-requests` - Create request
- `PUT /medecin/biological-requests/:requestId` - Update request

---

## ✅ Verification Checklist

Before starting development, verify:

- [ ] Node.js installed (v16+)
- [ ] Git installed and configured
- [ ] Repository cloned/pulled
- [ ] Dependencies installed (`npm install`)
- [ ] `.env` file created with correct values
- [ ] Database connection works
- [ ] Prisma migrations applied
- [ ] Prisma client generated
- [ ] Server starts without errors
- [ ] Can access `http://localhost:4000`
- [ ] API endpoints respond correctly

---

## 🆘 Still Having Issues?

### Check Logs

Look for error messages when running `npm run dev`. Common issues:

1. **Module not found**: Run `npm install`
2. **Database connection**: Check `DATABASE_URL`
3. **Port in use**: Change port or kill existing process
4. **Permission denied**: Run PowerShell as Administrator
5. **Prisma errors**: Run `npx prisma generate`

### Get Help

Check these files in the repository:
- `TROUBLESHOOTING.md` - General troubleshooting
- `HISTORY_SIMPLE_FRONTEND_GUIDE.md` - Frontend integration
- `GROUPED_APPOINTMENTS_ENDPOINT.md` - API documentation

---

## 🎉 Success!

If you see this output, everything is working:

```
Server is running on port 4000
Database connected successfully
Prisma Client generated
```

Now you can:
1. ✅ Start your frontend
2. ✅ Test API endpoints
3. ✅ Develop features
4. ✅ Use Prisma Studio to manage data

---

**Last Updated:** 2025-11-09  
**Platform:** Windows 10/11  
**Node Version:** 16+  
**Status:** ✅ Production Ready
