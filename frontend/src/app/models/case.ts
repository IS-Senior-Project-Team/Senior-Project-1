import { Timestamp } from "firebase/firestore";

/**
 * Interface for the Case object
 * @param id The unique identifier for the case
 * @param firstName The first name of the pet owner
 * @param lastName The last name of the pet owner
 * @param phoneNumber The phone number of the pet owner
 * @param notes Any notes about the case
 * @param status The status of the case (open, closed, etc.)
 * @param numOfPets The number of pets for the case
 * @param species The species of the pet(s) in the case
 * @param isDeleted Used to keep track if the case is deleted or not
 * @param createdDate The Timestamp the case was uploaded to the system
 * @param callDate The Timestamp (as close as can be represented) the call was original recorded in the voicemail log xlsx file
 * @param updateDate The Timestamp representing the last time the Case was updated in the system
 * @param deletedDate The Timestamp representing when the case was marked for deletion
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
    isDeleted: boolean;
    createdDate?: Timestamp;
    callDate?: Timestamp | string;
    updateDate?: Timestamp | string;
    deletedDate?: Timestamp;
}