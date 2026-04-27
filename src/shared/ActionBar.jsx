import React from 'react'
import { Search, Filter, Plus, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const ActionBar = ({
  searchPlaceholder = "Rechercher...",
  searchValue = "",
  onSearchChange,
  filters = [],
  actions = [],
  className = ""
}) => {
  return (
    <div className={`bg-white border-b border-gray-200 p-4 ${className}`}>
      <div className="flex items-center justify-between space-x-4">
        {/* Zone de recherche */}
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={(e) => onSearchChange?.(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Filtres */}
        <div className="flex items-center space-x-2">
          {filters.map((filter, index) => (
            <div key={index} className="flex items-center space-x-2">
              {filter}
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2">
          {actions.map((action, index) => (
            <Button
              key={index}
              variant={action.variant || 'outline'}
              size={action.size || 'default'}
              onClick={action.onClick}
              disabled={action.disabled}
              className={action.className}
            >
              {action.icon && <span className="mr-2">{action.icon}</span>}
              {action.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default ActionBar