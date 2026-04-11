import { UserButton } from '@clerk/nextjs'

export function Nav() {
  return (
    <nav className="flex items-center justify-between bg-ink px-5 py-4 md:hidden">
      <h1 className="text-sm font-black tracking-[0.2em] text-white uppercase">Bea&apos;s OS</h1>
      <UserButton />
    </nav>
  )
}
