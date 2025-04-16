const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const admin = require("firebase-admin");
// const nodemailer = require("nodemailer");

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

// const transporter = nodemailer.createTransport({
//   service: "gmail",
//   auth: {
//     user: process.env.EMAIL_USERNAME, // Your email
//     pass: process.env.EMAIL_PASSWORD, // Your email password or app-specific password
//   },
// });

app.post("/create-user", async (req, res) => {
  try {
    //remove password from request payload?
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

    // Send email verification
    // const actionCodeSettings = {
    //   url: "http://localhost:4200/emailConfirm",
    //   handleCodeInApp: true,
    // };
    // await admin.auth().generateEmailVerificationLink(email, actionCodeSettings);
    // await transporter.sendMail({
    //   from: '"Pawesome Team" <pawesome-test@app.com>',
    //   to: email,
    //   subject: "Verify Your Email",
    //   text: `Click the link to verify your email: ${verificationLink}`,
    //   html: `<p>Click the link below to verify your email:</p><a href="${verificationLink}">${verificationLink}</a>`,
    // });

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

    // You can check for an `isAdmin` custom claim or Firestore field here
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