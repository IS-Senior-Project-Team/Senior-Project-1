import fs from 'fs';
import pkg from 'pg';

import dotenv from 'dotenv';
dotenv.config();

const { Pool, Client } = pkg;
let pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});
// Read the JSON file containing an array of volunteers
const volunteersData = JSON.parse(fs.readFileSync('../../senior-project-1/volunteers.json', 'utf8'));

const rootClient = new Client({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database:  process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function createDatabase() {
  try {
    await rootClient.connect();
    const res = await rootClient.query(`CREATE DATABASE ${process.env.DB_NAME}`);
    console.log(`Database ${process.env.DB_NAME} created successfully`);
  } catch (err) {
    if (err.code === '42P04') {
      console.log(`Database ${process.env.DB_NAME} already exists`);
    } else {
      console.error(`Error creating database ${process.env.DB_NAME}:`, err.stack);
    }
  } finally {
    await rootClient.end();
  }
}
// Function to create the volunteers table
async function createTable() {
  const query = `
    CREATE TABLE IF NOT EXISTS volunteers (
      id SERIAL PRIMARY KEY,
      first_name VARCHAR(100) NOT NULL,
      last_name VARCHAR(100) NOT NULL,
      username VARCHAR(100) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      preferred_centers TEXT[],  
      skills_interests TEXT[],  
      availability_times JSONB, 
      address JSONB,            
      phone_numbers JSONB,      
      email VARCHAR(100) NOT NULL,
      educational_background TEXT,
      current_licenses TEXT[],  
      emergency_contact JSONB,  
      drivers_license_on_file BOOLEAN,
      social_security_card_on_file BOOLEAN,
      approval_status VARCHAR(50),
      notes TEXT,
      opportunities INTEGER[]  
    );
  `;

  try {
    await pool.query(query);
    console.log("Table 'volunteers' is set up successfully.");
  } catch (err) {
    console.error("Error setting up table:", err.stack);
  }
}

// Function to format arrays for PostgreSQL
function formatArrayForPostgres(arr) {
  if (!arr || arr.length === 0) return '{}';
  return `{${arr.map(item => `"${item}"`).join(',')}}`;
}

// Function to insert volunteer data into the database
async function insertVolunteers(volunteers) {
  const query = `
    INSERT INTO volunteers (
      id,
      first_name,
      last_name,
      username,
      password,
      preferred_centers,
      skills_interests,
      availability_times,
      address,
      phone_numbers,
      email,
      educational_background,
      current_licenses,
      emergency_contact,
      drivers_license_on_file,
      social_security_card_on_file,
      approval_status,
      notes,
      opportunities
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19
    )
  `;

  for (const userData of volunteers) {
    const values = [
      userData.id,
      userData.first_name,
      userData.last_name,
      userData.username,
      userData.password,
      formatArrayForPostgres(userData.preferred_centers),
      formatArrayForPostgres(userData.skills_interests),
      JSON.stringify(userData.availability_times),
      JSON.stringify(userData.address),
      JSON.stringify(userData.phone_numbers),
      userData.email,
      userData.educational_background,
      formatArrayForPostgres(userData.current_licenses),
      JSON.stringify(userData.emergency_contact),
      userData.drivers_license_on_file,
      userData.social_security_card_on_file,
      userData.approval_status,
      userData.notes,
      formatArrayForPostgres(userData.opportunities)
    ];

    try {
      const res = await pool.query(query, values);
      console.log(`User ${userData.username} inserted successfully`);
    } catch (err) {
      console.error(`Error inserting user ${userData.username}`, err.stack);
    }
  }
}

// Function to set up the database and insert data
async function setupDatabase() {
  // Create the database if it doesn't exist
  await createDatabase();
  pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
  });
  // Create the table if it doesn't exist
  await createTable(); 
  // Insert data into the table
  await insertVolunteers(volunteersData); 
   // Close the database connection
  pool.end();
}

// Execute the setup
setupDatabase();