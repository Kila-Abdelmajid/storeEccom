'use client'

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react'
import {useAuth} from '@/hooks/useAuth' 
import { useToast } from './ToastContext'

interface FavoritesContextType {
  favorites: Set<number>
  toggleFavorite: (productId: number) => Promise<void>
  isLoading: boolean
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(
  undefined,
)

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth()
  const [favorites, setFavorites] = useState<Set<number>>(new Set())
  const [isLoading, setIsLoading] = useState(true)
  const { showToast } = useToast()

  const fetchFavorites = async () => {
    if (!session) {
      setFavorites(new Set())
      setIsLoading(false)
      return
    }
    try {
      const res = await fetch('/api/ClientApi/favorites')
      if (res.ok) {
        const data = await res.json()
        const ids = new Set<number>(data.map((item: any) => item.id as number))
        setFavorites(ids)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchFavorites()
  }, [session])

  const toggleFavorite = async (productId: number) => {
    if (!session) {
      showToast('Please login to manage favorites', 'error')
      return
    }
    const wasFavorite = favorites.has(productId)
    // Optimistic update
    const newFavorites = new Set(favorites)
    if (wasFavorite) newFavorites.delete(productId)
    else newFavorites.add(productId)
    setFavorites(newFavorites)

    try {
      const method = wasFavorite ? 'DELETE' : 'POST'
      const url = `/api/ClientApi/favorites${wasFavorite ? `?productId=${productId}` : ''}`
      const options: RequestInit = {
        method,
        headers: { 'Content-Type': 'application/json' },
      }
      if (!wasFavorite) options.body = JSON.stringify({ productId })
      const res = await fetch(url, options)
      if (!res.ok) throw new Error()
      showToast(
        wasFavorite ? 'Removed from favorites' : 'Added to favorites',
        'success',
      )
    } catch (err) {
      // Revert on error
      const revertFavorites = new Set(favorites)
      setFavorites(revertFavorites)
      showToast('Something went wrong', 'error')
    }
  }

  return (
    <FavoritesContext.Provider value={{ favorites, toggleFavorite, isLoading }}>
      {children}
    </FavoritesContext.Provider>
  )
}

export const useFavorites = () => {
  const context = useContext(FavoritesContext)
  if (!context)
    throw new Error('useFavorites must be used within FavoritesProvider')
  return context
}
