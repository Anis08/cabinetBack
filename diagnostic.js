#!/usr/bin/env node

/**
 * Diagnostic Script for Ordonnance System
 * Run this to check if your Prisma setup is correct
 * 
 * Usage: node diagnostic.js
 */

import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 Starting Ordonnance System Diagnostic...\n');

// Colors for terminal output
const green = (text) => `\x1b[32m✅ ${text}\x1b[0m`;
const red = (text) => `\x1b[31m❌ ${text}\x1b[0m`;
const yellow = (text) => `\x1b[33m⚠️  ${text}\x1b[0m`;
const blue = (text) => `\x1b[34mℹ️  ${text}\x1b[0m`;

let errors = 0;
let warnings = 0;

// Check 1: .env file exists
console.log('1️⃣  Checking .env file...');
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  console.log(green('.env file exists'));
  
  // Check if DATABASE_URL is set
  const envContent = fs.readFileSync(envPath, 'utf-8');
  if (envContent.includes('DATABASE_URL=')) {
    console.log(green('DATABASE_URL is defined'));
  } else {
    console.log(red('DATABASE_URL is NOT defined in .env'));
    errors++;
  }
} else {
  console.log(red('.env file does NOT exist'));
  console.log(yellow('Create a .env file with DATABASE_URL'));
  errors++;
}

console.log('');

// Check 2: Prisma Client
console.log('2️⃣  Checking Prisma Client...');
try {
  const prisma = new PrismaClient();
  console.log(green('Prisma Client can be instantiated'));
  
  // Check if ordonnance model exists
  if (prisma.ordonnance) {
    console.log(green('Ordonnance model exists in Prisma Client'));
  } else {
    console.log(red('Ordonnance model NOT found in Prisma Client'));
    console.log(yellow('Run: npx prisma generate'));
    errors++;
  }
  
  // Check if medicament model exists
  if (prisma.medicament) {
    console.log(green('Medicament model exists in Prisma Client'));
  } else {
    console.log(red('Medicament model NOT found in Prisma Client'));
    console.log(yellow('Run: npx prisma generate'));
    errors++;
  }
  
  // Check if ordonnanceMedicament model exists
  if (prisma.ordonnanceMedicament) {
    console.log(green('OrdonnanceMedicament model exists in Prisma Client'));
  } else {
    console.log(red('OrdonnanceMedicament model NOT found in Prisma Client'));
    console.log(yellow('Run: npx prisma generate'));
    errors++;
  }
  
  await prisma.$disconnect();
} catch (error) {
  console.log(red('Failed to create Prisma Client'));
  console.log(red(`Error: ${error.message}`));
  errors++;
}

console.log('');

// Check 3: Database connection
console.log('3️⃣  Testing database connection...');
try {
  const prisma = new PrismaClient();
  await prisma.$connect();
  console.log(green('Database connection successful'));
  
  // Check if tables exist
  try {
    const ordonnancesCount = await prisma.ordonnance.count();
    console.log(green(`Ordonnance table exists (${ordonnancesCount} records)`));
  } catch (error) {
    console.log(red('Ordonnance table does NOT exist'));
    console.log(yellow('Run: npx prisma migrate dev'));
    errors++;
  }
  
  try {
    const medicamentsCount = await prisma.medicament.count();
    console.log(green(`Medicament table exists (${medicamentsCount} records)`));
  } catch (error) {
    console.log(red('Medicament table does NOT exist'));
    console.log(yellow('Run: npx prisma migrate dev'));
    errors++;
  }
  
  try {
    const ordMedCount = await prisma.ordonnanceMedicament.count();
    console.log(green(`OrdonnanceMedicament table exists (${ordMedCount} records)`));
  } catch (error) {
    console.log(red('OrdonnanceMedicament table does NOT exist'));
    console.log(yellow('Run: npx prisma migrate dev'));
    errors++;
  }
  
  await prisma.$disconnect();
} catch (error) {
  console.log(red('Database connection FAILED'));
  console.log(red(`Error: ${error.message}`));
  console.log(yellow('Check your DATABASE_URL in .env'));
  errors++;
}

console.log('');

// Check 4: Schema file
console.log('4️⃣  Checking schema.prisma...');
const schemaPath = path.join(__dirname, 'prisma', 'schema.prisma');
if (fs.existsSync(schemaPath)) {
  console.log(green('schema.prisma exists'));
  
  const schemaContent = fs.readFileSync(schemaPath, 'utf-8');
  
  if (schemaContent.includes('model Ordonnance')) {
    console.log(green('Ordonnance model defined in schema'));
  } else {
    console.log(red('Ordonnance model NOT defined in schema'));
    errors++;
  }
  
  if (schemaContent.includes('model Medicament')) {
    console.log(green('Medicament model defined in schema'));
  } else {
    console.log(red('Medicament model NOT defined in schema'));
    errors++;
  }
  
  if (schemaContent.includes('model OrdonnanceMedicament')) {
    console.log(green('OrdonnanceMedicament model defined in schema'));
  } else {
    console.log(red('OrdonnanceMedicament model NOT defined in schema'));
    errors++;
  }
} else {
  console.log(red('schema.prisma does NOT exist'));
  errors++;
}

console.log('');

// Check 5: Controller file
console.log('5️⃣  Checking ordonnanceController.js...');
const controllerPath = path.join(__dirname, 'src', 'controllers', 'ordonnanceController.js');
if (fs.existsSync(controllerPath)) {
  console.log(green('ordonnanceController.js exists'));
  
  const controllerContent = fs.readFileSync(controllerPath, 'utf-8');
  
  if (controllerContent.includes('import prisma from')) {
    console.log(green('Prisma is imported in controller'));
  } else {
    console.log(red('Prisma import NOT found in controller'));
    errors++;
  }
  
  if (controllerContent.includes('export const createOrdonnance')) {
    console.log(green('createOrdonnance function exists'));
  } else {
    console.log(red('createOrdonnance function NOT found'));
    errors++;
  }
} else {
  console.log(red('ordonnanceController.js does NOT exist'));
  errors++;
}

console.log('');

// Summary
console.log('═══════════════════════════════════════');
console.log('📊 DIAGNOSTIC SUMMARY');
console.log('═══════════════════════════════════════');

if (errors === 0 && warnings === 0) {
  console.log(green('All checks passed! ✨'));
  console.log(blue('Your ordonnance system is properly configured.'));
  console.log(blue('You can now create ordonnances via the API.'));
} else {
  console.log(red(`Found ${errors} error(s) and ${warnings} warning(s)`));
  console.log('');
  console.log('🔧 RECOMMENDED ACTIONS:');
  console.log('');
  console.log('1. Create .env file if missing:');
  console.log('   cp .env.example .env');
  console.log('   # Then edit .env with your DATABASE_URL');
  console.log('');
  console.log('2. Regenerate Prisma Client:');
  console.log('   npx prisma generate');
  console.log('');
  console.log('3. Run database migrations:');
  console.log('   npx prisma migrate dev --name add_ordonnances');
  console.log('');
  console.log('4. Restart your server:');
  console.log('   npm start');
  console.log('');
  console.log('📖 For detailed help, read: FIX_ORDONNANCE_PRISMA_ERROR.md');
}

console.log('═══════════════════════════════════════');

process.exit(errors > 0 ? 1 : 0);
