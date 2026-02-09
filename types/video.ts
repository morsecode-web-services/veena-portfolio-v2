export interface Video {
    id: string;
    title: string;
    url: string;
    thumbnail_url: string;
    category_id: string;
    subcategory_id?: string;
    is_featured: boolean;
    order_index: number;
    created_at: string;
}

export type NewVideo = Omit<Video, 'id' | 'created_at'>;
