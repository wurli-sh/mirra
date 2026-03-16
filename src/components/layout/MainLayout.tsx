import { Outlet } from 'react-router-dom'
import { Navbar } from './Navbar'

export function MainLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-bg overflow-x-hidden">
      <Navbar />
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6">
        <Outlet />
      </main>
    </div>
  )
}
