# Senior-Project-1

# Start frontend and backend

Open new terminal and run...
```bash
npm install
npm run start
```

This results on the frontend at "http://localhost:4200/" and backend at "http://localhost:3000/" 

# Database setup

1. cd to backend/scripts
2. Change DB_USER in bootstrap.sh to your username for your computer
3. Run the following in your terminal
```bash
sh bootstrap.sh
```
4. Enter your password for your current device when prompted
5. The database should be setup now!

# Firebase Connection
Firebase connection is currently functioning, but with little features currently.
Using firebaseConnection.ts in \backend\src\firebase\ will let you call functions to get items from firebase.
