import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'md' | 'sm'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
}

export function Button({ variant = 'primary', size = 'md', className = '', ...rest }: ButtonProps) {
  const classes = ['fw-btn', `fw-btn-${variant}`, size === 'sm' ? 'fw-btn-sm' : '', className]
    .filter(Boolean)
    .join(' ')
  return <button className={classes} {...rest} />
}
