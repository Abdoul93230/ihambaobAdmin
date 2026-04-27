import React from 'react'
import { Globe, MapPin, Building, Home, TrendingUp, Activity } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const ZoneStats = ({ stats }) => {
  const getTypeIcon = (type) => {
    const icons = {
      country: <Globe className="h-5 w-5" />,
      region: <Building className="h-5 w-5" />,
      city: <MapPin className="h-5 w-5" />,
      district: <Home className="h-5 w-5" />
    }
    return icons[type] || <MapPin className="h-5 w-5" />
  }

  const getTypeLabel = (type) => {
    const labels = {
      country: 'Pays',
      region: 'Régions',
      city: 'Villes',
      district: 'Quartiers'
    }
    return labels[type] || type
  }

  const getTypeColor = (type) => {
    const colors = {
      country: 'bg-blue-500',
      region: 'bg-green-500',
      city: 'bg-yellow-500',
      district: 'bg-purple-500'
    }
    return colors[type] || 'bg-gray-500'
  }

  // Calculer le taux d'activité
  const activeRate = stats.total > 0 ? ((stats.active / stats.total) * 100).toFixed(1) : 0

  return (
    <div className="p-6 bg-white border-b border-gray-200">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total des zones */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total zones</p>
                <div className="flex items-baseline">
                  <p className="text-2xl font-semibold text-gray-900">
                    {stats.total}
                  </p>
                  <p className="ml-2 text-sm text-gray-500">
                    zones
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Zones actives */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Activity className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Zones actives</p>
                <div className="flex items-baseline">
                  <p className="text-2xl font-semibold text-gray-900">
                    {stats.active}
                  </p>
                  <Badge variant="success" className="ml-2">
                    {activeRate}%
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Répartition par type - Graphique simplifié */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Répartition par type</CardTitle>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <div className="space-y-4">
              {stats.byType.map((item) => (
                <div key={item._id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${getTypeColor(item._id)}`}>
                      <div className="text-white">
                        {getTypeIcon(item._id)}
                      </div>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {getTypeLabel(item._id)}
                      </p>
                      <p className="text-sm text-gray-500">
                        {item.count} zone{item.count > 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  
                  {/* Barre de progression */}
                  <div className="flex items-center space-x-3 min-w-0 flex-1 ml-4">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${getTypeColor(item._id)}`}
                        style={{ 
                          width: `${Math.min(100, (item.count / Math.max(...stats.byType.map(t => t.count))) * 100)}%` 
                        }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-900 w-8 text-right">
                      {item.count}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Résumé rapide */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <p className="text-lg font-semibold text-gray-900">
                    {stats.byLevel.reduce((sum, item) => sum + item.count, 0)}
                  </p>
                  <p className="text-sm text-gray-600">Total par niveau</p>
                </div>
                <div>
                  <p className="text-lg font-semibold text-gray-900">
                    {Math.max(...stats.byLevel.map(item => item._id), 0) + 1}
                  </p>
                  <p className="text-sm text-gray-600">Niveaux max</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Statistiques détaillées par niveau */}
      {stats.byLevel.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">Distribution par niveau hiérarchique</CardTitle>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <div className="grid grid-cols-4 gap-4">
              {[0, 1, 2, 3].map((level) => {
                const levelData = stats.byLevel.find(item => item._id === level)
                const count = levelData?.count || 0
                const levelLabels = ['Pays', 'Régions', 'Villes', 'Quartiers']
                const levelColors = ['bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500']
                
                return (
                  <div key={level} className="text-center">
                    <div className={`w-12 h-12 ${levelColors[level]} rounded-full flex items-center justify-center mx-auto mb-2`}>
                      <span className="text-white font-semibold">{count}</span>
                    </div>
                    <p className="text-sm font-medium text-gray-900">{levelLabels[level]}</p>
                    <p className="text-xs text-gray-500">Niveau {level}</p>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default ZoneStats