import { Sidebar } from '@/components/Sidebar'

export const dynamic = 'force-dynamic'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Sidebar />
      <main className="main-layout fade-in">
        {children}
      </main>
    </>
  )
}
