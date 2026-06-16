import React from 'react'

export function Card({
  className = '',
  children
}: {
  className?: string
  children: React.ReactNode
}) {
  return <div className={`glass rounded-2xl shadow-xl ${className}`}>{children}</div>
}

type BtnProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'ghost' | 'danger'
}

export function Button({ variant = 'primary', className = '', ...props }: BtnProps) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-white/30'
  const styles = {
    primary: 'bg-white text-ink hover:bg-white/90',
    ghost: 'bg-white/10 text-white hover:bg-white/20',
    danger: 'bg-rose-500/80 text-white hover:bg-rose-500'
  }[variant]
  return <button className={`${base} ${styles} ${className}`} {...props} />
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded-lg bg-white/10 border border-white/10 px-3 py-2 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30 ${props.className ?? ''}`}
    />
  )
}

export function Pill({ children, tone = 'default' }: { children: React.ReactNode; tone?: 'default' | 'good' | 'warn' }) {
  const t = {
    default: 'bg-white/10 text-white/80',
    good: 'bg-emerald-400/20 text-emerald-200',
    warn: 'bg-amber-400/20 text-amber-200'
  }[tone]
  return <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${t}`}>{children}</span>
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="text-white/70 text-lg font-medium">{title}</div>
      {hint && <div className="text-white/40 text-sm mt-1">{hint}</div>}
    </div>
  )
}
