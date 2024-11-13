import { StaffAddressInfo } from "./staff-address-info";

export interface StaffInfo {
    id : number;
    staff_firstname: string;
    staff_lastname: string;
    staff_username: string;
    staff_email: string;
    staff_address: StaffAddressInfo[];
    staff_phone : number | undefined;
    staff_password: string;
}
