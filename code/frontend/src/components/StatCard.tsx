import { motion } from 'framer-motion'
import { LucideIcon } from 'lucide-react'

interface StatCardProps {
  title: string
  value: string | number
  icon?: LucideIcon
  change?: {
    value: number
    positive: boolean
  }
  className?: string
}

export default function StatCard({
  title,
  value,
  icon: Icon,
  change,
  className = '',
}: StatCardProps) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      className={`card group ${className}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-white/60 text-sm mb-2">{title}</p>
          <h3 className="text-3xl font-bold mb-2">{value}</h3>
          {change && (
            <p
              className={`text-sm ${
                change.positive ? 'text-green-400' : 'text-red-400'
              }`}
            >
              {change.positive ? '+' : ''}
              {change.value}% from last period
            </p>
          )}
        </div>
        {Icon && (
          <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center text-accent group-hover:bg-accent/20 transition-colors">
            <Icon className="w-6 h-6" />
          </div>
        )}
      </div>
    </motion.div>
  )
}
