# Troubleshooting Guide - Biological Requests Feature

## Error: "Erreur lors de la création de la demande"

This error appears when trying to create a biological request from the frontend.

### Root Causes & Solutions

---

## ⚠️ Issue 1: Database Migration Not Applied

### Problem
The `BiologicalRequest` table doesn't exist in your database yet.

### Solution

```bash
# Navigate to your project directory
cd C:\Users\MSI\Downloads\cabinetBack

# Apply the migration
npx prisma migrate deploy
```

**OR in development:**

```bash
npx prisma migrate dev
```

### What this does:
- Creates the `BiologicalRequest` table in your database
- Creates the `BiologicalRequestStatus` enum
- Sets up foreign keys to Patient and Medecin tables

---

## ⚠️ Issue 2: Prisma Client Not Updated

### Problem
The Prisma client doesn't have the new `biologicalRequest` methods.

### Solution

```bash
# Generate the updated Prisma client
npx prisma generate
```

### What this does:
- Updates the Prisma client with the new model
- Adds `prisma.biologicalRequest.create()`, `.findMany()`, `.update()` methods

---

## ⚠️ Issue 3: Server Not Restarted

### Problem
The server is still running old code without the new endpoints.

### Solution

**If using nodemon (auto-restart):**
- Just save any file in `src/` folder

**If running manually:**
```bash
# Stop the server (Ctrl+C)
# Then restart:
npm run dev
# OR
node src/server.js
```

---

## 🔍 Debugging Steps

### Step 1: Check Database Connection

```bash
# Test Prisma connection
npx prisma studio
```

If this opens successfully, your database connection is working.

### Step 2: Verify Migration Status

```bash
# Check migration status
npx prisma migrate status
```

You should see the `20251109161722_add_biological_requests` migration as "Applied".

### Step 3: Check Server Logs

Look at your server console for errors. Common errors:

**Error: "Unknown arg `biologicalRequest`"**
- **Fix:** Run `npx prisma generate`

**Error: "Table 'BiologicalRequest' does not exist"**
- **Fix:** Run `npx prisma migrate deploy`

**Error: "Property 'biologicalRequest' does not exist on type 'PrismaClient'"**
- **Fix:** Run `npx prisma generate` then restart your IDE/editor

### Step 4: Test Endpoint Directly

Use Postman or curl to test the endpoint:

```bash
curl -X POST http://localhost:4000/medecin/biological-requests \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"patientId\": 1, \"sampleTypes\": [\"Sang\"], \"requestedExams\": [\"Glycémie à jeun\"], \"status\": \"En cours\"}"
```

**Expected response (success):**
```json
{
  "request": {
    "id": 1,
    "requestNumber": "...",
    "status": "En cours"
  },
  "message": "Biological request created successfully"
}
```

**Error responses:**
- `400` - Missing required fields
- `401` - Invalid/missing token
- `403` - Patient doesn't belong to this medecin
- `500` - Server/database error (check logs)

---

## 🛠️ Complete Setup Checklist

Run these commands in order:

```bash
# 1. Navigate to project
cd C:\Users\MSI\Downloads\cabinetBack

# 2. Install dependencies (if needed)
npm install

# 3. Apply database migration
npx prisma migrate deploy

# 4. Generate Prisma client
npx prisma generate

# 5. Restart server
# Stop current server (Ctrl+C)
npm run dev
```

---

## 📋 Verify Everything Works

### Test 1: Check Routes
Visit: `http://localhost:4000/`
Should see: "API is running"

### Test 2: Check Prisma Studio
```bash
npx prisma studio
```
Should see `BiologicalRequest` in the left sidebar.

### Test 3: Check Server Console
When you start the server, you should NOT see errors about:
- Unknown models
- Missing tables
- Invalid types

---

## 🐛 Common Error Messages & Fixes

### Error: "Invalid `prisma.biologicalRequest.create()`"
**Cause:** Prisma client not updated
**Fix:** `npx prisma generate`

### Error: "Table 'BiologicalRequest' does not exist"
**Cause:** Migration not applied
**Fix:** `npx prisma migrate deploy`

### Error: "Column 'requestNumber' cannot be null"
**Cause:** Prisma not generating CUID properly
**Fix:** 
1. Check your Prisma version: `npx prisma --version`
2. Update if needed: `npm install prisma@latest @prisma/client@latest`
3. Regenerate: `npx prisma generate`

### Error: "Access denied: Patient does not belong to this medecin"
**Cause:** Patient ownership check failing
**Fix:** Make sure the patient with that ID belongs to the logged-in medecin

### Error: "Patient ID, sample types, and requested exams are required"
**Cause:** Frontend sending incomplete data
**Fix:** Check frontend console for the request body being sent

---

## 🔧 If Nothing Works

### Nuclear Option - Regenerate Everything

```bash
# 1. Delete generated files
rm -rf node_modules
rm -rf prisma/migrations

# 2. Reinstall
npm install

# 3. Create fresh migration
npx prisma migrate dev --name init

# 4. Generate client
npx prisma generate

# 5. Restart server
npm run dev
```

**⚠️ WARNING:** This will reset your migrations. Only do this in development!

---

## 📞 Still Having Issues?

Check these files for errors:

1. **Server logs** - Look for stack traces
2. **Browser console** - Check the Network tab for API responses
3. **Prisma logs** - Set `DATABASE_URL` with `?logging=true` for debug logs

### Enable Debug Logging

In your `.env` file:
```env
DATABASE_URL="postgresql://...?logging=true"
```

Then restart the server and check logs.

---

## ✅ Success Indicators

You'll know everything works when:

1. ✅ Server starts without errors
2. ✅ Prisma Studio shows `BiologicalRequest` table
3. ✅ Frontend can create requests without "Erreur" message
4. ✅ Requests appear in the table on the frontend
5. ✅ You can update results without errors

---

**Last Updated:** 2025-11-09
**Related Files:** 
- `prisma/schema.prisma`
- `src/controllers/medecinController.js`
- `src/routes/medecin.js`
