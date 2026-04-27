import React from 'react'
import { ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

const PageHeader = ({ 
  title, 
  description, 
  breadcrumbs = [], 
  actions = [],
  className = ''
}) => {
  return (
    <div className={`bg-white border-b border-gray-200 px-6 py-4 ${className}`}>
      {/* Breadcrumbs */}
      {breadcrumbs.length > 0 && (
        <nav className="flex items-center space-x-1 text-sm text-gray-500 mb-2">
          {breadcrumbs.map((breadcrumb, index) => (
            <React.Fragment key={index}>
              {index > 0 && <ChevronRight className="h-4 w-4" />}
              <span 
                className={index === breadcrumbs.length - 1 ? 'text-gray-900 font-medium' : 'hover:text-gray-700 cursor-pointer'}
              >
                {breadcrumb.label}
              </span>
            </React.Fragment>
          ))}
        </nav>
      )}
      
      {/* Header avec titre et actions */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          {description && (
            <p className="text-gray-600 mt-1">{description}</p>
          )}
        </div>
        
        {/* Actions */}
        {actions.length > 0 && (
          <div className="flex items-center space-x-3">
            {actions.map((action, index) => (
              <Button
                key={index}
                variant={action.variant || 'default'}
                size={action.size || 'default'}
                onClick={action.onClick}
                disabled={action.disabled}
              >
                {action.icon && <span className="mr-2">{action.icon}</span>}
                {action.label}
              </Button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default PageHeader