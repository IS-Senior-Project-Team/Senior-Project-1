const fs = require('fs');
const pkg = require('pg');
const dotenv = require('dotenv');

dotenv.config();

const { Pool, Client } = pkg;

// Read the unified JSON file containing all data
const dbData = JSON.parse(fs.readFileSync('../../db.json', 'utf8'));
const { cases, volunteers } = dbData;

const rootClient = new Client({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// Function to create the database if it does not exist
async function createDatabase() {
  try {
    await rootClient.connect();
    const res = await rootClient.query(`SELECT 1 FROM pg_database WHERE datname = '${process.env.DB_NAME}'`);
    if (res.rowCount === 0) {
      await rootClient.query(`CREATE DATABASE ${process.env.DB_NAME}`);
      console.log(`Database ${process.env.DB_NAME} created successfully`);
    } else {
      console.log(`Database ${process.env.DB_NAME} already exists`);
    }
  } catch (err) {
    console.error(`Error creating database ${process.env.DB_NAME}:`, err.stack);
  } finally {
    await rootClient.end();
  }
}

// Function to set up the connection pool to the new database
async function setupDatabaseConnection() {
  return new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
  });
}

// Function to create the volunteers table
async function createVolunteersTable(pool) {
  const query = `
    CREATE TABLE IF NOT EXISTS volunteers (
      id SERIAL PRIMARY KEY,
      first_name VARCHAR(100) NOT NULL,
      last_name VARCHAR(100) NOT NULL,
      phone_number VARCHAR(15),
      email VARCHAR(100) NOT NULL,
      availability TEXT,
      assigned_cases INTEGER[]
    );
  `;

  try {
    await pool.query(query);
    console.log("Table 'volunteers' is set up successfully.");
  } catch (err) {
    console.error("Error setting up volunteers table:", err.stack);
  }
}

// Function to create the cases table
async function createCasesTable(pool) {
  const query = `
    CREATE TABLE IF NOT EXISTS cases (
      id SERIAL PRIMARY KEY,
      first_name VARCHAR(100) NOT NULL,
      last_name VARCHAR(100) NOT NULL,
      phone_number VARCHAR(15) NOT NULL,
      notes TEXT,
      status VARCHAR(50) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      priority VARCHAR(20),
      location VARCHAR(255),
      related_cases INTEGER[]
    );
  `;

  try {
    await pool.query(query);
    console.log("Table 'cases' is set up successfully.");
  } catch (err) {
    console.error("Error setting up cases table:", err.stack);
  }
}

// Function to insert data into volunteers and cases tables
async function insertData(pool) {
  // Insert volunteers
  for (const volunteer of volunteers) {
    try {
      await pool.query(
        `INSERT INTO volunteers (first_name, last_name, phone_number, email, availability, assigned_cases)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [volunteer.firstName, volunteer.lastName, volunteer.phoneNumber, volunteer.email, volunteer.availability, volunteer.assignedCases]
      );
      console.log(`Volunteer ${volunteer.firstName} ${volunteer.lastName} inserted successfully`);
    } catch (err) {
      console.error(`Error inserting volunteer ${volunteer.firstName} ${volunteer.lastName}:`, err.stack);
    }
  }

  // Insert cases
  for (const caseData of cases) {
    try {
      await pool.query(
        `INSERT INTO cases (first_name, last_name, phone_number, notes, status, priority, location, related_cases)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [caseData.firstName, caseData.lastName, caseData.phoneNumber, caseData.notes, caseData.status, caseData.priority, caseData.location, caseData.relatedCases]
      );
      console.log(`Case ${caseData.firstName} ${caseData.lastName} inserted successfully`);
    } catch (err) {
      console.error(`Error inserting case ${caseData.firstName} ${caseData.lastName}:`, err.stack);
    }
  }
}

// Main setup function
async function setupDatabase() {
  await createDatabase(); // Ensure the database is created
  const pool = await setupDatabaseConnection(); // Create a new connection to the database

  await createVolunteersTable(pool); // Create the volunteers table
  await createCasesTable(pool); // Create the cases table
  await insertData(pool); // Insert data into tables

  await pool.end(); // Close the connection to the pool
}

// Execute the setup
setupDatabase().catch((err) => console.error('Error during setup:', err));