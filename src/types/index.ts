export interface Product {
  id: number;
  name: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  category_id:number ;
  description: string;
  image: string;
  rating: number;
  reviews: number;
  inStock: boolean;
  featured?: boolean;
  isNew?: boolean;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface TeamMember {
  id: number;
  name: string;
  role: string;
  phone: string;
  email: string;
  image: string;
  social: {
    facebook?: string;
    instagram?: string;
    whatsapp?: string;
    twitter?: string;
  };
}

export interface Review {
  id: number;
  name: string;
  email: string;
  rating: number;
  title: string;
  content: string;
  date: string;
  verified: boolean;
}

export interface ContactFormData {
  name: string;
  email: string;
  phone: string;
  message: string;
}
export interface CategorySection {
  id: number;
  title: string;
  image: string;
}

export interface CarouselSlide {
  id: number;
  imageUrl: string;
  title: string;
  description: string;
  buttonText: string;
  buttonLink: string;
}

export interface NavItem {
  label: string;
  href: string;
}