import { useState, useEffect } from 'react'

interface AnimatedImageProps {
  src: string
  alt: string
  className?: string
  placeholderClass?: string
}

export function AnimatedImage({ src, alt, className = '', placeholderClass = '' }: AnimatedImageProps) {
  const [imgLoaded, setImgLoaded] = useState(false)
  const [minWait, setMinWait] = useState(false)

  useEffect(() => {
    const id = setTimeout(() => setMinWait(true), 2000)
    return () => clearTimeout(id)
  }, [])

  const ready = imgLoaded && minWait

  return (
    <div className="relative">
      {/* Skeleton */}
      <div
        className={`absolute inset-0 z-20 rounded-lg overflow-hidden transition-opacity duration-500 ${placeholderClass} ${ready ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
      >
        <div className="h-full w-full animate-pulse bg-primary" />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-[shimmer_1.5s_infinite]" />
      </div>
      {/* Image — always rendered, fades in */}
      <img
        src={src}
        alt={alt}
        className={`${className} transition-all duration-150 ${ready ? 'opacity-100 scale-100' : 'opacity-0 scale-0'}`}
        onLoad={() => setImgLoaded(true)}
      />
    </div>
  )
}
