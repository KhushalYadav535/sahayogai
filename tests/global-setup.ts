import { execSync } from 'child_process';
import path from 'path';

async function globalSetup() {
  console.log('Running global setup: Seeding database with test data...');
  try {
    const backendPath = path.resolve(__dirname, '../../sahayogbackend');
    execSync('npx ts-node scripts/seed-test-data.ts', {
      cwd: backendPath,
      stdio: 'inherit'
    });
    console.log('Database seeded successfully.');
  } catch (error) {
    console.error('Failed to seed database:', error);
    throw error;
  }
}

export default globalSetup;
