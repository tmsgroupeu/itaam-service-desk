'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface NavLinkProps extends React.ComponentProps<typeof Link> {
  href: string
  children: React.ReactNode
  className?: string
  activeClassName?: string
}

export function NavLink({ href, children, className = '', activeClassName = 'active', ...props }: NavLinkProps) {
  const pathname = usePathname()
  
  // Basic active check: matches exactly or starts with href/ if it's not the root
  const isActive = pathname === href || (href !== '/' && pathname.startsWith(`${href}/`))

  const finalClassName = `${className} ${isActive ? activeClassName : ''}`.trim()

  return (
    <Link href={href} className={finalClassName} {...props}>
      {children}
    </Link>
  )
}
