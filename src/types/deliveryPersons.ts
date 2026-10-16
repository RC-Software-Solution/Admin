export interface DeliveryPerson {
    id: string;
    full_name: string;
    email: string;
    phone: string | null;
    nic: string | null;
    vehicle_type: string | null;
    status: "active" | "inactive";
    created_at: string;
}
