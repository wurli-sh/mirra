import { HeroSection } from '@/components/home/HeroSection'
import { HowItWorks } from '@/components/home/HowItWorks'
import { LiveMirrorFeed } from '@/components/home/LiveMirrorFeed'

export function HomePage() {
  return (
    <>
      <HeroSection />
      <HowItWorks />
      <LiveMirrorFeed />
    </>
  )
}
