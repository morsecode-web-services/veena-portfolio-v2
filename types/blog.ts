export interface Blog {
    id: string;
    created_at: string;
    updated_at: string;
    title: string;
    slug: string;
    content: string; // HTML from TipTap
    excerpt: string;
    image_url: string | null;
    category: string;
    author: string;
    is_published: boolean;
    meta_title: string;
    meta_description: string;
    keywords: string[];
    likes?: number;
}

export type NewBlog = Omit<Blog, 'id' | 'created_at' | 'updated_at'>;
