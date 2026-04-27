import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Save, X } from 'lucide-react'
import { useCreateZone, useUpdateZone } from '../hooks/useZones'
import { getZoneTypeLabel } from '../lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import ZoneSelector from '../shared/ZoneSelector'
import { useToast } from '../hooks/useToast'

const ZoneForm = ({ zone = null, onClose }) => {
  const { toast } = useToast()
  const isEditing = !!zone
  
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm({
    defaultValues: {
      name: zone?.name || '',
      code: zone?.code || '',
      type: zone?.type || 'country',
      isActive: zone?.isActive !== false
    }
  })

  const [selectedParent, setSelectedParent] = useState(zone?.parent || null)
  const createZoneMutation = useCreateZone()
  const updateZoneMutation = useUpdateZone()

  const watchedType = watch('type')

  // Définir le niveau basé sur le type sélectionné
  const typeToLevel = {
    country: 0,
    region: 1,
    city: 2,
    district: 3
  }

  // CORRECTION: Types autorisés basés sur le parent sélectionné
  const getAvailableTypes = () => {
    if (!selectedParent) {
      // Aucun parent = niveau pays uniquement
      return [{ value: 'country', label: 'Pays' }]
    }

    // Déterminer le niveau suivant basé sur le niveau du parent
    const parentLevel = selectedParent.level || 0
    const nextLevel = parentLevel + 1

    // Définir tous les types possibles par niveau
    const typesByLevel = {
      0: [{ value: 'country', label: 'Pays' }],
      1: [{ value: 'region', label: 'Région' }],
      2: [{ value: 'city', label: 'Ville' }],
      3: [{ value: 'district', label: 'Quartier' }]
    }

    // Retourner les types disponibles pour le niveau suivant
    return typesByLevel[nextLevel] || []
  }

  // CORRECTION: Mettre à jour automatiquement le type quand le parent change
  useEffect(() => {
    const availableTypes = getAvailableTypes()
    
    // Si un seul type disponible, le sélectionner automatiquement
    if (availableTypes.length === 1) {
      setValue('type', availableTypes[0].value)
    } else if (availableTypes.length > 1) {
      // Si plusieurs types, garder le type actuel s'il est valide, sinon prendre le premier
      const currentType = watch('type')
      const isCurrentTypeValid = availableTypes.some(type => type.value === currentType)
      
      if (!isCurrentTypeValid) {
        setValue('type', availableTypes[0].value)
      }
    }
  }, [selectedParent, setValue, watch])

  // CORRECTION: Auto-générer le code basé sur le nom et le parent
  const generateCode = (name, parent) => {
    if (!name) return ''
    
    // Nettoyer le nom pour créer un code
    let baseCode = name
      .replace(/\s+/g, '')
      .replace(/[^a-zA-Z0-9]/g, '')
      .toUpperCase()
    
    // Raccourcir selon le niveau pour respecter la limite de 20 caractères
    const maxLength = parent?.code ? 
      Math.max(2, 20 - parent.code.length - 1) : // -1 pour le tiret
      15 // Laisser de la place pour les niveaux futurs
    
    baseCode = baseCode.substring(0, maxLength)
    
    if (parent?.code) {
      return `${parent.code}-${baseCode}`
    }
    
    return baseCode
  }

  const onSubmit = async (data) => {
    try {
      const zoneData = {
        ...data,
        parent: selectedParent?._id || null,
        level: typeToLevel[data.type]
      }

      if (isEditing) {
        await updateZoneMutation.mutateAsync({
          id: zone._id,
          data: zoneData
        })
        toast({
          title: 'Succès',
          description: 'Zone modifiée avec succès',
          variant: 'success'
        })
      } else {
        await createZoneMutation.mutateAsync(zoneData)
        toast({
          title: 'Succès',
          description: 'Zone créée avec succès',
          variant: 'success'
        })
      }
      
      onClose()
    } catch (error) {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive'
      })
    }
  }

  const availableTypes = getAvailableTypes()

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardContent className="p-6 space-y-4">
          {/* Zone parent */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Zone parent
            </label>
            <ZoneSelector
              selectedZone={selectedParent}
              onSelect={setSelectedParent}
              placeholder="Sélectionner une zone parent (optionnel)"
              excludeZoneIds={zone ? [zone._id] : []}
            />
            <p className="text-sm text-gray-500 mt-1">
              {!selectedParent ? 
                "Aucun parent = Zone de niveau pays" :
                `Niveau suivant disponible: ${availableTypes.map(t => t.label).join(', ')}`
              }
            </p>
          </div>

          {/* CORRECTION: Type de zone avec gestion d'erreur */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type de zone
            </label>
            {availableTypes.length > 0 ? (
              <select
                {...register('type', { required: 'Le type est requis' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={availableTypes.length === 1}
              >
                {availableTypes.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            ) : (
              <div className="w-full px-3 py-2 border border-red-300 rounded-md bg-red-50 text-red-700">
                Impossible de créer un niveau supplémentaire (maximum 4 niveaux)
              </div>
            )}
            {errors.type && (
              <p className="text-sm text-red-600 mt-1">{errors.type.message}</p>
            )}
            {/* AJOUT: Affichage de debug pour développement */}
            {process.env.NODE_ENV === 'development' && (
              <p className="text-xs text-gray-400 mt-1">
                Debug: Parent level: {selectedParent?.level || 'none'}, Available types: {availableTypes.length}
              </p>
            )}
          </div>

          {/* Nom */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nom de la zone *
            </label>
            <Input
              {...register('name', { 
                required: 'Le nom est requis',
                minLength: { value: 2, message: 'Minimum 2 caractères' },
                maxLength: { value: 100, message: 'Maximum 100 caractères' }
              })}
              placeholder="Ex: Niger, Niamey, Commune 1..."
              onChange={(e) => {
                // Auto-générer le code
                const generatedCode = generateCode(e.target.value, selectedParent)
                setValue('code', generatedCode)
              }}
            />
            {errors.name && (
              <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>
            )}
          </div>

          {/* Code */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Code unique *
            </label>
            <Input
              {...register('code', { 
                required: 'Le code est requis',
                maxLength: { value: 20, message: 'Maximum 20 caractères' },
                pattern: {
                  value: /^[A-Z0-9-]+$/,
                  message: 'Le code ne peut contenir que des lettres majuscules, chiffres et tirets'
                }
              })}
              placeholder="Code généré automatiquement"
              className="font-mono text-sm"
              style={{ textTransform: 'uppercase' }}
            />
            {errors.code && (
              <p className="text-sm text-red-600 mt-1">{errors.code.message}</p>
            )}
            <p className="text-sm text-gray-500 mt-1">
              Le code sera généré automatiquement. Longueur actuelle: {watch('code')?.length || 0}/20
            </p>
          </div>

          {/* Statut */}
          <div className="flex items-center">
            <input
              type="checkbox"
              {...register('isActive')}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label className="ml-2 text-sm text-gray-700">
              Zone active
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Aperçu hiérarchique */}
      {(selectedParent || watch('name')) && (
        <Card>
          <CardContent className="p-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Aperçu de la hiérarchie</h4>
            <div className="text-sm text-gray-600">
              {selectedParent?.fullPath && (
                <span>{selectedParent.fullPath} → </span>
              )}
              <span className="font-medium text-gray-900">
                {watch('name') || '[Nom de la zone]'}
              </span>
              {watch('name') && availableTypes.length > 0 && (
                <span className="ml-2 text-xs bg-blue-100 px-2 py-1 rounded">
                  {getZoneTypeLabel(watchedType)} (Niveau {typeToLevel[watchedType]})
                </span>
              )}
            </div>
            {watch('code') && (
              <div className="text-xs text-gray-500 mt-1 font-mono">
                Code: {watch('code')}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex justify-end space-x-3 pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
        >
          <X className="h-4 w-4 mr-2" />
          Annuler
        </Button>
        <Button
          type="submit"
          disabled={
            createZoneMutation.isLoading || 
            updateZoneMutation.isLoading || 
            availableTypes.length === 0
          }
        >
          <Save className="h-4 w-4 mr-2" />
          {(createZoneMutation.isLoading || updateZoneMutation.isLoading) 
            ? 'Enregistrement...' 
            : isEditing ? 'Modifier' : 'Créer'
          }
        </Button>
      </div>
    </form>
  )
}

export default ZoneForm