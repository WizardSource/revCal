"use client"

import dynamic from 'next/dynamic'
import { Suspense, useEffect, useState } from 'react'
import { ErrorBoundary } from '../components/ErrorBoundary'
import { motion, AnimatePresence } from 'framer-motion'

const BookingCalendar = dynamic(
  () => import('../components/BookingCalendar').then(mod => ({ default: mod.BookingCalendar })),
  { 
    ssr: false,
    loading: () => <LoadingSpinner />
  }
)

// Register service worker
const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    try {
      await navigator.serviceWorker.register('/sw.js');
    } catch (error) {
      console.error('Service worker registration failed:', error);
    }
  }
};

function LoadingSpinner() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="flex justify-center items-center min-h-[400px]"
    >
      <motion.div 
        className="rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      />
    </motion.div>
  )
}

export default function Home() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    registerServiceWorker();
    
    // Simulate minimum loading time for smoother transition
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen flex flex-col items-center justify-center py-8 px-4"
    >
      <div className="w-full max-w-3xl mx-auto space-y-6">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-center space-y-2 mb-6"
        >
          <h1 className="text-4xl font-bold tracking-tight text-gray-900">
            Book Your Session
          </h1>
          <p className="text-sm text-muted-foreground">
            Select a date and time that works best for you
          </p>
        </motion.div>
        
        <ErrorBoundary>
          <AnimatePresence mode="wait">
            <Suspense fallback={<LoadingSpinner />}>
              {!isLoading && <BookingCalendar />}
            </Suspense>
          </AnimatePresence>
        </ErrorBoundary>
      </div>
    </motion.main>
  )
} 