// Used for authentication of staff members
export interface StaffInfo {
    uid: string
    firstname: string;
    lastname: string;
    email: string;
    address: string;
    phoneNumber : string;
    password: string;
    isAdmin : boolean
    isActive: boolean;
    isDeleted: boolean;
}
