const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const admin = require("firebase-admin");

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey : process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g,'\n')
  }),
});

app.post("/create-user", async (req, res) => {
  try {
    const { email, password, isAdmin } = req.body;

    // Create user in Firebase Authentication
    const userRecord = await admin.auth().createUser({
      email,
      password,
      emailVerified: false,
      disabled: false,
    });

    // Add user to Firestore (database)
    const db = admin.firestore();
    await db.collection("staffMembers").doc(userRecord.uid).set({
      email,
      firstname: "",
      lastname: "",
      address: "",
      phoneNumber: "",
      isAdmin,
      isActive: true,
      isDeleted: false,
    });

    res.status(201).json({ message: "User created successfully!" });
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ error: "Failed to create user" });
  }
});

async function verifyAdmin(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No token provided" });
  }

  const idToken = authHeader.split("Bearer ")[1];

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);

    const userDoc = await admin.firestore().collection("staffMembers").doc(decodedToken.uid).get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: "User not found" });
    }

    const userData = userDoc.data();

    if (!userData.isAdmin) {
      return res.status(403).json({ error: "Access denied. Admins only." });
    }

    req.user = decodedToken;
    next();
  } catch (error) {
    console.error("Error verifying token:", error);
    return res.status(401).json({ error: "Unauthorized" });
  }
}

app.delete("/admin/delete-user/:uid", verifyAdmin, async (req, res) => {
  const { uid } = req.params;

  try {
    // Soft delete in Firestore
    const userRef = admin.firestore().collection("staffMembers").doc(uid);
    await userRef.update({ isDeleted: true, isActive: false });

    // Delete from Firebase Auth
    await admin.auth().deleteUser(uid);

    return res.status(200).json({ message: "User deleted successfully." });
  } catch (error) {
    console.error("Error deleting user:", error);
    return res.status(500).json({ error: "Failed to delete user." });
  }
});


const PORT = 3200;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
module.exports = verifyAdmin;