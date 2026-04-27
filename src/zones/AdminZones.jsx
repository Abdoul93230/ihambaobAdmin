import React, { useState } from 'react'
import { Plus, Upload, Download, Eye, Edit, Trash2, Search, Filter } from 'lucide-react'
import { useZones, useZoneStats, useDeleteZone } from '../hooks/useZones'
import { useAuth } from '../contexts/AuthContext'
import { formatCurrency, getZoneTypeLabel, getZoneIcon } from '../lib/utils'
import PageHeader from '../shared/PageHeader'
import ActionBar from '../shared/ActionBar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import ImportZones from './ImportZones'
import ZoneForm from './ZoneForm'
import ZoneTreeView from './ZoneTreeView'
import ZoneStats from './ZoneStats'
import { useToast } from '../hooks/useToast' 

const AdminZones = () => {
  const { user } = useAuth()
  const { toast } = useToast()
  
  // États locaux
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState({
    type: '',
    parent: '',
    isActive: true
  })
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(20)
  const [viewMode, setViewMode] = useState('table') // 'table' ou 'tree'
  const [showImport, setShowImport] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingZone, setEditingZone] = useState(null)

  // Queries
  let { data: zonesData, isLoading, error } = useZones({
    page: currentPage,
    limit: pageSize,
    search: searchTerm,
    ...filters
  })
  // console.log({zonesData});
  
  // zonesData = zonesData?.data

  let { data: stats } = useZoneStats()
  stats = stats?.data
  const deleteZoneMutation = useDeleteZone()



  // Handlers
  const handleSearch = (value) => {
    setSearchTerm(value)
    setCurrentPage(1)
  }

  const handleFilterChange = (key, value) => {
    setFilters(prev => {
      const newFilters = { ...prev, [key]: value }
      
      // Supprimer les clés avec des valeurs vides
      Object.keys(newFilters).forEach(filterKey => {
        if (newFilters[filterKey] === '' || newFilters[filterKey] === null || newFilters[filterKey] === undefined) {
          delete newFilters[filterKey]
        }
      })
      
      return newFilters
    })
    setCurrentPage(1)
  }

  // Nouvelle fonction pour gérer le filtre isActive spécifiquement
  const handleActiveFilterChange = (value) => {
    setFilters(prev => {
      const newFilters = { ...prev }
      if (value === '') {
        delete newFilters.isActive
      } else {
        newFilters.isActive = value === 'true'
      }
      return newFilters
    })
    setCurrentPage(1)
  }

  const handleEdit = (zone) => {
    setEditingZone(zone)
    setShowForm(true)
  }

  const handleDelete = async (zone) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer "${zone.name}" ?`)) {
      return
    }

    try {
      await deleteZoneMutation.mutateAsync(zone._id)
      toast({
        title: 'Succès',
        description: 'Zone supprimée avec succès',
        variant: 'success'
      })
    } catch (error) {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive'
      })
    }
  }

  const handleFormClose = () => {
    setShowForm(false)
    setEditingZone(null)
  }

  // Actions de la barre d'en-tête
  const headerActions = [
    {
      label: 'Importer CSV',
      icon: <Upload className="h-4 w-4" />,
      onClick: () => setShowImport(true),
      variant: 'outline'
    },
    {
      label: 'Nouvelle Zone',
      icon: <Plus className="h-4 w-4" />,
      onClick: () => setShowForm(true),
      variant: 'default'
    }
  ]

  // Actions de la barre d'actions
  const actionBarActions = [
    {
      label: viewMode === 'table' ? 'Vue Arbre' : 'Vue Table',
      onClick: () => setViewMode(viewMode === 'table' ? 'tree' : 'table'),
      variant: 'outline'
    }
  ]

  // Filtres de la barre d'actions
  const actionBarFilters = [
    <select
      key="type-filter"
      value={filters.type || ''}
      onChange={(e) => handleFilterChange('type', e.target.value)}
      className="px-3 py-2 border border-gray-300 rounded-md text-sm"
    >
      <option value="">Tous les types</option>
      <option value="country">Pays</option>
      <option value="region">Région</option>
      <option value="city">Ville</option>
      <option value="district">Quartier</option>
    </select>,
    <select
      key="status-filter"
      value={filters.isActive !== undefined ? filters.isActive.toString() : ''}
      onChange={(e) => handleActiveFilterChange(e.target.value)}
      className="px-3 py-2 border border-gray-300 rounded-md text-sm"
    >
      <option value="">Toutes</option>
      <option value="true">Actives</option>
      <option value="false">Inactives</option>
    </select>
  ]

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center text-red-600">
          Erreur lors du chargement des zones : {error.message}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header de page */}
      <PageHeader
        title="Gestion des Zones"
        description="Gérez les zones géographiques et leur hiérarchie pour l'expédition"
        breadcrumbs={[
          { label: 'Administration' },
          { label: 'Zones géographiques' }
        ]}
        actions={headerActions}
      />

      {/* Statistiques */}
      {stats && <ZoneStats stats={stats} />}

      {/* Barre d'actions */}
      <ActionBar
        searchPlaceholder="Rechercher une zone..."
        searchValue={searchTerm}
        onSearchChange={handleSearch}
        filters={actionBarFilters}
        actions={actionBarActions}
      />

      {/* Contenu principal */}
      <div className="p-6">
        {viewMode === 'table' ? (
          <ZoneTable
            zones={zonesData?.data || []}
            isLoading={isLoading}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        ) : (
          <ZoneTreeView
            onEdit={handleEdit}
            onDelete={handleDelete}
            searchTerm={searchTerm}
            filters={filters}
          />
        )}

        {/* {console.log({zonesData})} */}
        

        {/* Pagination - Afficher seulement si on a des données de pagination */}
        {zonesData?.pagination && (
          <Pagination
            pagination={zonesData.pagination}
            onPageChange={setCurrentPage}
          />
        )}
      </div>

      {/* Modals */}
      <Dialog open={showImport} onOpenChange={setShowImport}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Importer des zones</DialogTitle>
          </DialogHeader>
          <ImportZones onClose={() => setShowImport(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={showForm} onOpenChange={handleFormClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingZone ? 'Modifier la zone' : 'Créer une zone'}
            </DialogTitle>
          </DialogHeader>
          <ZoneForm
            zone={editingZone}
            onClose={handleFormClose}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Composant Table des zones
const ZoneTable = ({ zones, isLoading, onEdit, onDelete }) => {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Zone
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Parent
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {zones.map((zone) => (
                <tr key={zone._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="text-lg mr-3">{getZoneIcon(zone.type)}</span>
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {zone.name}
                        </div>
                        {zone.fullPath && (
                          <div className="text-sm text-gray-500">
                            {zone.fullPath}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant="outline">
                      {getZoneTypeLabel(zone.type)}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <code className="bg-gray-100 px-2 py-1 rounded">
                      {zone.code}
                    </code>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {zone.parent?.name || '—'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant={zone.isActive ? 'success' : 'secondary'}>
                      {zone.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(zone)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(zone)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {zones.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500">
              <Search className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium">Aucune zone trouvée</h3>
              <p className="mt-1">Essayez de modifier vos filtres ou d'ajouter une nouvelle zone.</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Composant Pagination amélioré
const Pagination = ({ pagination, onPageChange }) => {
 if (!pagination || !pagination.totalItems || pagination.totalPages <= 1) {
    return null
  }

  // const { current, total, totalItems, limit } = pagination
  const {
    currentPage: current,
    totalPages: total,
    totalItems,
    itemsPerPage: limit
  } = pagination

  // Calculer les éléments affichés
  const startItem = Math.max(1, (current - 1) * limit + 1)
  const endItem = Math.min(current * limit, totalItems)

  // Générer les numéros de page à afficher
  const getPageNumbers = () => {
    const pages = []
    const maxPagesToShow = 7

    if (total <= maxPagesToShow) {
      // Afficher toutes les pages si peu de pages
      for (let i = 1; i <= total; i++) {
        pages.push(i)
      }
    } else {
      // Logique pour afficher les pages avec des ellipses
      if (current <= 4) {
        // Début : 1 2 3 4 5 ... total
        for (let i = 1; i <= 5; i++) {
          pages.push(i)
        }
        pages.push('...')
        pages.push(total)
      } else if (current >= total - 3) {
        // Fin : 1 ... total-4 total-3 total-2 total-1 total
        pages.push(1)
        pages.push('...')
        for (let i = total - 4; i <= total; i++) {
          pages.push(i)
        }
      } else {
        // Milieu : 1 ... current-1 current current+1 ... total
        pages.push(1)
        pages.push('...')
        pages.push(current - 1)
        pages.push(current)
        pages.push(current + 1)
        pages.push('...')
        pages.push(total)
      }
    }

    return pages
  }

  const pageNumbers = getPageNumbers()

  return (
    <div className="flex items-center justify-between mt-6 bg-white px-6 py-4 border border-gray-200 rounded-lg shadow-sm">
      {/* Informations sur les résultats */}
      <div className="flex items-center text-sm text-gray-700">
        <span>
          Affichage de <span className="font-medium">{startItem}</span> à{' '}
          <span className="font-medium">{endItem}</span> sur{' '}
          <span className="font-medium">{totalItems}</span> zones
        </span>
      </div>

      {/* Contrôles de pagination */}
      <div className="flex items-center space-x-2">
        {/* Bouton Première page */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(1)}
          disabled={current <= 1}
          className="hidden sm:block"
        >
          Premier
        </Button>

        {/* Bouton Page précédente */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(current - 1)}
          disabled={current <= 1}
        >
          Précédent
        </Button>

        {/* Numéros de page */}
        <div className="hidden sm:flex items-center space-x-1">
          {pageNumbers.map((page, index) => (
            <div key={index}>
              {page === '...' ? (
                <span className="px-3 py-2 text-gray-500">...</span>
              ) : (
                <Button
                  variant={page === current ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => onPageChange(page)}
                  className="min-w-[40px]"
                >
                  {page}
                </Button>
              )}
            </div>
          ))}
        </div>

        {/* Info page mobile */}
        <div className="sm:hidden flex items-center space-x-2 text-sm text-gray-700">
          <span>Page {current} sur {total}</span>
        </div>

        {/* Bouton Page suivante */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(current + 1)}
          disabled={current >= total}
        >
          Suivant
        </Button>

        {/* Bouton Dernière page */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(total)}
          disabled={current >= total}
          className="hidden sm:block"
        >
          Dernier
        </Button>
      </div>
    </div>
  )
}

export default AdminZones