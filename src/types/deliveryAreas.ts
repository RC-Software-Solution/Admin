export interface DeliveryArea {
    area_id: number | string; // BIGINT: Sequelize may serialize it as a string
    area_name: string;
}
