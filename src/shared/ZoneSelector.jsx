import React, { useState, useEffect, useRef, useMemo } from 'react'
import { Search, ChevronDown, MapPin, Check } from 'lucide-react'
import { useZoneSearch } from '../hooks/useZones'
import { getZoneTypeLabel, getZoneIcon, buildZoneFullPath, debounce } from '../lib/utils'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

const ZoneSelector = ({
  placeholder = "Sélectionner une zone...",
  selectedZone = null,
  onSelect,
  excludeZoneIds = [],
  disabled = false,
  className = ""
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredZones, setFilteredZones] = useState([])
  const dropdownRef = useRef(null)
  
  const { searchZones, searchResults, isSearching } = useZoneSearch()

  // Créer la fonction debounced avec useMemo pour qu'elle soit stable
  const debouncedSearch = useMemo(
    () => debounce(searchZones, 300),
    [searchZones]
  )

  useEffect(() => {
    if (searchTerm.length >= 2) {
      debouncedSearch(searchTerm)
    } else {
      setFilteredZones([])
    }
  }, [searchTerm]) // Retirer debouncedSearch des dépendances

  useEffect(() => {
    // Filtrer les zones exclues
    const filtered = searchResults.filter(zone => 
      !excludeZoneIds.includes(zone._id)
    )
    setFilteredZones(filtered)
  }, [searchResults, excludeZoneIds])

  // Fermer le dropdown quand on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = (zone) => {
    onSelect?.(zone)
    setIsOpen(false)
    setSearchTerm('')
  }

  const displayValue = selectedZone ? buildZoneFullPath(selectedZone) : ''

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Trigger Button */}
      <Button
        type="button"
        variant="outline"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className="w-full justify-between text-left font-normal"
      >
        <span className="flex items-center">
          <MapPin className="h-4 w-4 mr-2 text-gray-500" />
          {selectedZone ? (
            <span className="truncate">{displayValue}</span>
          ) : (
            <span className="text-gray-500">{placeholder}</span>
          )}
        </span>
        <ChevronDown className="h-4 w-4 text-gray-500" />
      </Button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-80 overflow-hidden">
          {/* Search Input */}
          <div className="p-3 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Rechercher une zone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                autoFocus
              />
            </div>
          </div>

          {/* Results */}
          <div className="max-h-60 overflow-y-auto">
            {isSearching ? (
              <div className="p-4 text-center text-gray-500">
                <div className="animate-spin h-5 w-5 border-2 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
                <span className="mt-2 block">Recherche en cours...</span>
              </div>
            ) : filteredZones.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                {searchTerm.length < 2 ? (
                  "Tapez au moins 2 caractères pour rechercher"
                ) : (
                  "Aucune zone trouvée"
                )}
              </div>
            ) : (
              filteredZones.map((zone) => (
                <button
                  key={zone._id}
                  type="button"
                  onClick={() => handleSelect(zone)}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center justify-between group"
                >
                  <div className="flex items-center space-x-3 min-w-0 flex-1">
                    <span className="text-lg">{getZoneIcon(zone.type)}</span>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-gray-900 truncate">
                        {zone.name}
                      </div>
                      <div className="text-sm text-gray-500 truncate">
                        {zone.fullPath || buildZoneFullPath(zone)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                      {getZoneTypeLabel(zone.type)}
                    </span>
                    {selectedZone?._id === zone._id && (
                      <Check className="h-4 w-4 text-green-600" />
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default ZoneSelector