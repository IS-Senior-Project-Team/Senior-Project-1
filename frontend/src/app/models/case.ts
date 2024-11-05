/**
 * Interface for the Case object
 * @param id The unique identifier for the case
 * @param firstName The first name of the pet owner
 * @param lastName The last name of the pet owner
 * @param phoneNumber The phone number of the pet owner
 * @param notes Any notes about the case
 * @param status The status of the case (open, closed, etc.)
 */ 
export interface Case {
    id: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
    notes: string;
    status: string;
    numOfPets: number;
    species: string;
    isExpanded: boolean;
    isDeleted: boolean;
}
  