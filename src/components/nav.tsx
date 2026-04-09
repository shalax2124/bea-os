import { UserButton } from '@clerk/nextjs'

export function Nav() {
  return (
    <nav className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 md:hidden">
      <h1 className="text-base font-bold text-gray-900">Bea&apos;s OS</h1>
      <UserButton />
    </nav>
  )
}
