import csv
import random
from datetime import datetime, timedelta

def generate_random_date():
    # Mostly last month but a few within the past year
     # 80% chance of being in the last month
    if random.random() < 0.8: 
        days_ago = random.randint(0, 7)
    # 20% chance of being in the last year
    else: 
        days_ago = random.randint(8, 90)
    return (datetime.now() - timedelta(days=days_ago)).strftime("%Y-%m-%dT%H:%M:%SZ")

# Constants for generating data
STATUSES = [
    "Already Rehomed", "Asked for more info", "Bad # or No VM", "Duplicate",
    "Found Pet", "Keeping-Behavior", "Keeping- Medical", "Keeping- Other",
    "Kitten Pack & S/N", "LM with Info", "Lost Pet", "No Show Appt",
    "Not PSN", "Open", "Owner Surrender Intake", "PSN Boarding",
    "Rehome Attempt", "Rehome Confirmed", "Reunited", "Surrender Appt",
    "Surrender Denied", "Walk-in Surrender Attempt", "Walk-in- Stray Attempt",
    "Walk-In- OS Intake", "Walk-in- Stray Intake", "Walk-in- Other",
    "Call elevated to management", "ACPS"
]

SPECIES = ["Adult Dog", "Adult Cat", "Puppy", "Kitten"]

NOTES_MAP = {
    ("Adult Dog", "Rehome Attempt"): "The owner is looking for a new home for their adult dog due to housing restrictions.",
    ("Kitten", "Lost Pet"): "The kitten has been reported missing near the park since last weekend.",
    ("Adult Cat", "Surrender Denied"): "The adult cat's surrender request was denied due to missing vaccination records.",
    ("Puppy", "Found Pet"): "A puppy was found wandering in the neighborhood and brought in by a resident.",
    ("Adult Dog", "Keeping-Behavior"): "The family decided to keep the dog despite behavioral challenges, enrolling in a training program.",
    ("Kitten", "Kitten Pack & S/N"): "The kitten received a care pack, including food and toys, and was scheduled for spaying/neutering.",
    ("Adult Cat", "Rehome Confirmed"): "A suitable family has been found to rehome the adult cat.",
    ("Puppy", "Walk-in- Stray Intake"): "The stray puppy was brought in as a walk-in and appears to be in good health.",
    ("Adult Dog", "No Show Appt"): "The scheduled surrender appointment for the adult dog was missed without prior notice.",
    ("Kitten", "Reunited"): "The kitten was successfully reunited with its owner after being identified through a microchip."
}

# Function to generate random data
def generate_case(case_id):
    species = random.choice(SPECIES)
    status = random.choice(STATUSES)
    first_name = random.choice(["John", "Jane", "Alex", "Chris", "Pat", "Taylor", "Jordan", "Sam", "Morgan", "Casey"])
    last_name = random.choice(["Smith", "Doe", "Brown", "Johnson", "Williams", "Miller", "Davis", "Garcia", "Rodriguez", "Martinez"])
    phone_number = ''.join(random.choices("0123456789", k=10))
    notes = NOTES_MAP.get((species, status))
    num_of_pets = random.randint(1, 5)
    created_date = generate_random_date()
    
    return [
        case_id,
        first_name,
        last_name,
        phone_number,
        notes,
        status,
        num_of_pets,
        species,
        created_date
    ]

# Generate CSV
def create_csv(file_name, num_cases=50):
    with open(file_name, mode='w', newline='') as file:
        writer = csv.writer(file, quoting=csv.QUOTE_MINIMAL)
        
        # Write the header
        writer.writerow(["id", "firstName", "lastName", "phoneNumber", "notes", "status", "numOfPets", "species", "createdDate"])
        
        # Write case data
        for case_id in range(1, num_cases + 1):
            writer.writerow(generate_case(case_id))

# Generate the CSV file
create_csv("test_cases.csv")
print("CSV file 'test_cases.csv' has been created.")