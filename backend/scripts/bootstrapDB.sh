#!/bin/bash

# Set environment variables
DB_USER="andreas"
DB_HOST="localhost"
DB_NAME="senior_project_db"
DB_PORT="5432"

# Prompt for the database password to avoid storing it in the script
echo "Enter password for user $DB_USER:"
read -s DB_PASSWORD

# Check if the database already exists
DB_EXISTS=$(PGPASSWORD=$DB_PASSWORD psql -U $DB_USER -h $DB_HOST -p $DB_PORT -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'")

if [ "$DB_EXISTS" = "1" ]; then
  echo "Database $DB_NAME already exists. Skipping database creation."
else
  # Command to create the database, connecting to the default "postgres" database
  CREATE_DB_COMMAND="CREATE DATABASE $DB_NAME;"

  # Execute the command using psql, connecting to the "postgres" database
  echo "Creating database $DB_NAME..."
  PGPASSWORD=$DB_PASSWORD psql -U $DB_USER -h $DB_HOST -p $DB_PORT -d postgres -c "$CREATE_DB_COMMAND"

  # Check if the database was created successfully
  if [ $? -eq 0 ]; then
      echo "Database $DB_NAME created successfully."
  else
      echo "Error creating database $DB_NAME. Please check your settings."
      exit 1
  fi
fi

# Run the JavaScript file to populate the database
echo "Running the database population script..."
node ./bootstrapDB.js

# Check if the JavaScript file ran successfully
if [ $? -eq 0 ]; then
    echo "Database population script executed successfully."
else
    echo "Error running the database population script."
    exit 1
fi

echo "Setup completed."