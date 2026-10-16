export interface DeliveryPerson {
    id: string;
    full_name: string;
    email: string;
    phone: string | null;
    nic: string | null;
    vehicle_type: string | null;
    area_ids: number[]; // all areas covered; area_id (primary) is the first
    area_id: number | string | null;
    status: "active" | "inactive";
    created_at: string;
}
