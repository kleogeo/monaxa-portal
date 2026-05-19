import Sidebar from './Sidebar'

export default function Layout({ children }) {
  return (
    <div className="flex min-h-screen bg-brand-dark">
      <Sidebar />
      <main className="flex-1 ml-60 p-8">
        {children}
      </main>
    </div>
  )
}
