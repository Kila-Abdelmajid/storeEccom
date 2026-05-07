  
  import { Category } from '@/types/category';

  export const categories: Category[] = [
  {
    id: 1,
    name: 'Roses',
    image: '/photos/image1.png',
  },
  {
    id: 2,
    name: 'Dolls',
    image: '/photos/image2.png',
  },
  {
    id: 3,
    name: 'Perfume',
    image: '/photos/image3.png',
  },
 
];
export const getCategoryById = (id: number) => {
  return categories.find((c) => c.id === id);
};