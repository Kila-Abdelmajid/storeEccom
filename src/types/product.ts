

export type Product = {
  id: number;
  image: string;
  name: string;
  description: string;
  price: number;
  oldPrice: number | null;
  stock: number;
  isNew: boolean;
  categoryId: number;
  category: string;
  additionalImages: string[];
  rating: number;
  reviews: number;
};