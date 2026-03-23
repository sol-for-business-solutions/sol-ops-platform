export function Spinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const s = { sm: 'h-4 w-4', md: 'h-6 w-6', lg: 'h-10 w-10' }[size]
  return (
    <div className={`${s} animate-spin rounded-full`}
      style={{border:'2px solid #e8edf5',borderTop:'2px solid #142680'}} />
  )
}
