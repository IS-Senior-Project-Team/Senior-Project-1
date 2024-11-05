const fs = require('fs');
const { addCase, addVolunteer } = require('./firebaseConnection.js');

// Read the JSON file
const dbData = JSON.parse(fs.readFileSync('../../db.json', 'utf-8'));

// Function to populate Firestore
async function populateFirestore() {
  // Add cases
  if (dbData.cases && Array.isArray(dbData.cases)) {
    for (const caseData of dbData.cases) {
      await addCase(caseData);
    }
  }

  // Add volunteers
  if (dbData.volunteers && Array.isArray(dbData.volunteers)) {
    for (const volunteerData of dbData.volunteers) {
      await addVolunteer(volunteerData);
    }
  }

  console.log('Firestore population completed.');
}

// Run the function
populateFirestore().catch(error => console.error('Error populating Firestore:', error));