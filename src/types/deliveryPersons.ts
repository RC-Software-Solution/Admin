export interface DeliveryPerson {
    id: string;
    full_name: string;
    email: string;
    phone: string | null;
    nic: string | null;
    vehicle_type: string | null;
    area_id: number | string | null; // BIGINT: may arrive as a string
    status: "active" | "inactive";
    created_at: string;
}
