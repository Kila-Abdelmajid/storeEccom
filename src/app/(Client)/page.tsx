import CategoriesSection from '@/components/client/CategoriesSection/CategoriesSection'
import Contact from '@/components/client/Contact/Contact'
import ProductSection from '@/components/client/ProductSection/ProductSection'
import HeroSlider from '@/components/client/HeroSection/HeroSlider'

// Example usage in app/page.tsx (or any page)
import { products } from '@/data/productData'
import { categories } from '@/data/categoryData'
import CrispChat from '@/components/client/CrispChat'
import FloatingMenu from '@/components/client/FloatingMenu'

import { getSession } from '@/lib/auth';
import ClientReviews from '@/components/client/ClientReviews/ClientReviews'


// Mock data for demonstration

export default async function HomePage() {

  const session = await getSession();
  const currentUserId = session?.userId ?? null;
  return (
    <main className='min-h-screen'>
      <HeroSlider />
      <section id='shop'>
        <CategoriesSection />
        <ProductSection />
      </section>
      
      <ClientReviews currentUserId={currentUserId} />

      <section id='contact'>
        <Contact />
      </section>
      <CrispChat />
      <FloatingMenu />
    </main>
  )
}
