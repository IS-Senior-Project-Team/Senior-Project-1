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
    privateKey : process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g,'\n')
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
    console.log(userRecord)

    // Send email verification
    const actionCodeSettings = {
      url: "http://localhost:4200/emailConfirm",
      handleCodeInApp: true,
    };
    await admin.auth().generateEmailVerificationLink(email, actionCodeSettings);
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

const PORT = 5001;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});