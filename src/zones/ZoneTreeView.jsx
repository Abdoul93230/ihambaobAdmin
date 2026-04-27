import React, { useState } from 'react'
import { ChevronRight, ChevronDown, Edit, Trash2, Plus, MapPin } from 'lucide-react'
import { useZoneHierarchy } from '../hooks/useZones'
import { getZoneIcon, getZoneTypeLabel } from '../lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'

const ZoneTreeView = ({ onEdit, onDelete, searchTerm, filters }) => {
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(50) // Plus grand pour la vue arbre
  
  // Utiliser les paramètres de recherche et filtres pour la hiérarchie
  const { data: hierarchyData, isLoading } = useZoneHierarchy({
    page: currentPage,
    limit: pageSize,
    search: searchTerm,
    ...filters
  })

  const [expandedNodes, setExpandedNodes] = useState(new Set())

  const toggleNode = (nodeId) => {
    const newExpanded = new Set(expandedNodes)
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId)
    } else {
      newExpanded.add(nodeId)
    }
    setExpandedNodes(newExpanded)
  }

  // Fonction pour développer tous les nœuds récursivement
  const expandAllNodes = (nodes) => {
    const allIds = new Set()
    
    const collectIds = (nodeList) => {
      nodeList.forEach(node => {
        allIds.add(node._id)
        if (node.children && node.children.length > 0) {
          collectIds(node.children)
        }
      })
    }
    
    collectIds(nodes)
    return allIds
  }

  const handleExpandAll = () => {
    if (hierarchyData?.data) {
      setExpandedNodes(expandAllNodes(hierarchyData.data))
    }
  }

  const handleCollapseAll = () => {
    setExpandedNodes(new Set())
  }

  const renderNode = (zone, level = 0) => {
    const hasChildren = zone.children && zone.children.length > 0
    const isExpanded = expandedNodes.has(zone._id)
    const indent = level * 24

    return (
      <div key={zone._id}>
        {/* Nœud principal */}
        <div
          className="flex items-center justify-between p-3 hover:bg-gray-50 border-b border-gray-100 group"
          style={{ paddingLeft: `${12 + indent}px` }}
        >
          <div className="flex items-center space-x-3 min-w-0 flex-1">
            {/* Toggle pour les nœuds avec enfants */}
            <div className="w-4 flex justify-center">
              {hasChildren ? (
                <button
                  onClick={() => toggleNode(zone._id)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>
              ) : (
                <div className="w-4" />
              )}
            </div>

            {/* Icône du type */}
            <span className="text-lg flex-shrink-0">
              {getZoneIcon(zone.type)}
            </span>

            {/* Informations de la zone */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center space-x-2">
                <span className="font-medium text-gray-900 truncate">
                  {zone.name}
                </span>
                <Badge variant="outline" className="text-xs">
                  {getZoneTypeLabel(zone.type)}
                </Badge>
                {!zone.isActive && (
                  <Badge variant="secondary" className="text-xs">
                    Inactive
                  </Badge>
                )}
              </div>
              <div className="text-sm text-gray-500 truncate">
                <code className="bg-gray-100 px-1 rounded text-xs">
                  {zone.code}
                </code>
                {hasChildren && (
                  <span className="ml-2">
                    {zone.children.length} sous-zone{zone.children.length > 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(zone)}
              title="Modifier"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(zone)}
              title="Supprimer"
              className="text-red-600 hover:text-red-800"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Enfants */}
        {hasChildren && isExpanded && (
          <div>
            {zone.children.map(child => renderNode(child, level + 1))}
          </div>
        )}
      </div>
    )
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-center space-x-3">
                  <div className="h-4 w-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/6"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  const hierarchy = hierarchyData?.data || []

  if (hierarchy.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <MapPin className="h-12 w-12 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">Aucune zone trouvée</h3>
          <p className="text-gray-500 mt-1">
            {searchTerm || Object.keys(filters).length > 0 
              ? "Aucune zone ne correspond à vos critères de recherche."
              : "Commencez par créer votre première zone géographique."
            }
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-0">
          <div className="max-h-[800px] overflow-y-auto">
            {/* En-tête */}
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    Hiérarchie des zones
                  </h3>
                  {(searchTerm || Object.keys(filters).length > 0) && (
                    <p className="text-sm text-gray-500 mt-1">
                      {hierarchy.length} zone{hierarchy.length > 1 ? 's' : ''} trouvée{hierarchy.length > 1 ? 's' : ''}
                    </p>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleExpandAll}
                  >
                    Tout développer
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCollapseAll}
                  >
                    Tout replier
                  </Button>
                </div>
              </div>
            </div>

            {/* Arbre */}
            <div className="divide-y divide-gray-100">
              {hierarchy.map(zone => (
                <div key={zone._id} className="group">
                  {renderNode(zone)}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pagination pour la vue arbre */}
      {hierarchyData?.pagination && (
        <TreePagination
          pagination={hierarchyData.pagination}
          onPageChange={setCurrentPage}
        />
      )}
    </div>
  )
}

// Composant de pagination spécifique pour la vue arbre
const TreePagination = ({ pagination, onPageChange }) => {
  if (!pagination || !pagination.total || pagination.total <= 1) {
    return null
  }

  const { current, total, totalItems, limit } = pagination

  const startItem = Math.max(1, (current - 1) * limit + 1)
  const endItem = Math.min(current * limit, totalItems)

  return (
    <div className="flex items-center justify-between bg-white px-6 py-4 border border-gray-200 rounded-lg shadow-sm">
      <div className="text-sm text-gray-700">
        Page <span className="font-medium">{current}</span> sur{' '}
        <span className="font-medium">{total}</span> - {' '}
        <span className="font-medium">{totalItems}</span> zones au total
      </div>
      
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(current - 1)}
          disabled={current <= 1}
        >
          Précédent
        </Button>
        
        <div className="flex items-center space-x-1">
          <span className="text-sm text-gray-500">Page</span>
          <select
            value={current}
            onChange={(e) => onPageChange(parseInt(e.target.value))}
            className="px-2 py-1 border border-gray-300 rounded text-sm min-w-[60px]"
          >
            {Array.from({ length: total }, (_, i) => i + 1).map(page => (
              <option key={page} value={page}>
                {page}
              </option>
            ))}
          </select>
          <span className="text-sm text-gray-500">sur {total}</span>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(current + 1)}
          disabled={current >= total}
        >
          Suivant
        </Button>
      </div>
    </div>
  )
}

export default ZoneTreeView