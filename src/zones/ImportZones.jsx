import React, { useState, useCallback } from 'react'
import { Upload, Download, FileText, AlertCircle, CheckCircle, X } from 'lucide-react'
import { useImportZones, useValidateImport } from '../hooks/useZones'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useToast } from '../hooks/useToast'

const ImportZones = ({ onClose }) => {
  const { toast } = useToast()
  const [file, setFile] = useState(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [validationResult, setValidationResult] = useState(null)
  const [importResult, setImportResult] = useState(null)
  const [step, setStep] = useState('upload') // upload, validate, import, complete

  const validateImportMutation = useValidateImport()
  const importZonesMutation = useImportZones()

  // Drag & Drop handlers
  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setIsDragOver(false)
    
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile && isValidFileType(droppedFile)) {
      setFile(droppedFile)
    } else {
      toast({
        title: 'Fichier invalide',
        description: 'Veuillez sélectionner un fichier CSV ou Excel',
        variant: 'destructive'
      })
    }
  }, [toast])

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0]
    if (selectedFile && isValidFileType(selectedFile)) {
      setFile(selectedFile)
    } else {
      toast({
        title: 'Fichier invalide',
        description: 'Veuillez sélectionner un fichier CSV ou Excel',
        variant: 'destructive'
      })
    }
  }

  const isValidFileType = (file) => {
    const validTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ]
    const validExtensions = ['.csv', '.xls', '.xlsx']
    
    return validTypes.includes(file.type) || 
           validExtensions.some(ext => file.name.toLowerCase().endsWith(ext))
  }

  const handleValidate = async () => {
    if (!file) return

    const formData = new FormData()
    formData.append('file', file)

    try {
      const result = await validateImportMutation.mutateAsync(formData)
      setValidationResult(result.data)
      setStep('validate')
      
      if (result.data.isValid) {
        toast({
          title: 'Validation réussie',
          description: `${result.data.rowCount} lignes prêtes à être importées`,
          variant: 'success'
        })
      } else {
        toast({
          title: 'Erreurs de validation',
          description: `${result.data.errors.length} erreurs trouvées`,
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: 'Erreur de validation',
        description: error.message,
        variant: 'destructive'
      })
    }
  }

  const handleImport = async () => {
    if (!file) return

    const formData = new FormData()
    formData.append('file', file)

    try {
      setStep('import')
      const result = await importZonesMutation.mutateAsync(formData)
      setImportResult(result.data)
      setStep('complete')
      
      toast({
        title: 'Import terminé',
        description: `${result.data.summary.created} zones créées avec succès`,
        variant: 'success'
      })
    } catch (error) {
      setStep('validate')
      toast({
        title: 'Erreur d\'import',
        description: error.message,
        variant: 'destructive'
      })
    }
  }

  const downloadTemplate = () => {
    const csvContent = `Pays,Region,Ville,Quartier
Niger,Niamey,Commune 1,Plateau
Niger,Niamey,Commune 1,Lamorde
Niger,Niamey,Commune 2,Nouveau Marché
Niger,Maradi,Centre-ville,
Nigeria,Lagos,Victoria Island,`

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', 'template_zones.csv')
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const downloadReport = () => {
    if (!importResult) return

    const jsonContent = JSON.stringify(importResult, null, 2)
    const blob = new Blob([jsonContent], { type: 'application/json' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `import_report_${new Date().toISOString().split('T')[0]}.json`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-6">
      {/* Étapes */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className={`flex items-center ${step === 'upload' ? 'text-blue-600' : 'text-green-600'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step === 'upload' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'
            }`}>
              1
            </div>
            <span className="ml-2 text-sm font-medium">Upload</span>
          </div>
          <div className={`w-12 h-px ${step !== 'upload' ? 'bg-green-300' : 'bg-gray-300'}`}></div>
          
          <div className={`flex items-center ${
            step === 'validate' ? 'text-blue-600' : 
            ['import', 'complete'].includes(step) ? 'text-green-600' : 'text-gray-400'
          }`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step === 'validate' ? 'bg-blue-100 text-blue-600' :
              ['import', 'complete'].includes(step) ? 'bg-green-100 text-green-600' :
              'bg-gray-100 text-gray-400'
            }`}>
              2
            </div>
            <span className="ml-2 text-sm font-medium">Validation</span>
          </div>
          <div className={`w-12 h-px ${['import', 'complete'].includes(step) ? 'bg-green-300' : 'bg-gray-300'}`}></div>
          
          <div className={`flex items-center ${
            step === 'import' ? 'text-blue-600' :
            step === 'complete' ? 'text-green-600' : 'text-gray-400'
          }`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step === 'import' ? 'bg-blue-100 text-blue-600' :
              step === 'complete' ? 'bg-green-100 text-green-600' :
              'bg-gray-100 text-gray-400'
            }`}>
              3
            </div>
            <span className="ml-2 text-sm font-medium">Import</span>
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Étape 1: Upload */}
      {step === 'upload' && (
        <div className="space-y-6">
          {/* Instructions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Format attendu</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">
                Votre fichier CSV ou Excel doit contenir les colonnes suivantes :
              </p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-4 gap-4 text-sm">
                  <div><strong>Colonne A:</strong> Pays</div>
                  <div><strong>Colonne B:</strong> Région</div>
                  <div><strong>Colonne C:</strong> Ville</div>
                  <div><strong>Colonne D:</strong> Quartier (optionnel)</div>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={downloadTemplate}
                className="mt-2"
              >
                <Download className="h-4 w-4 mr-2" />
                Télécharger le template
              </Button>
            </CardContent>
          </Card>

          {/* Zone de drop */}
          <Card>
            <CardContent className="p-6">
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  isDragOver 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <div className="space-y-2">
                  <p className="text-lg font-medium text-gray-900">
                    Glissez votre fichier ici
                  </p>
                  <p className="text-gray-500">
                    ou cliquez pour sélectionner
                  </p>
                  <input
                    type="file"
                    onChange={handleFileSelect}
                    accept=".csv,.xlsx,.xls"
                    className="hidden"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 cursor-pointer"
                  >
                    Sélectionner un fichier
                  </label>
                </div>
                <p className="text-sm text-gray-400 mt-4">
                  Formats supportés: CSV, Excel (.xlsx, .xls) - Taille max: 10MB
                </p>
              </div>

              {file && (
                <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <FileText className="h-5 w-5 text-green-600 mr-2" />
                      <div>
                        <p className="font-medium text-green-800">{file.name}</p>
                        <p className="text-sm text-green-600">
                          {(file.size / 1024).toFixed(2)} KB
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setFile(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button
              onClick={handleValidate}
              disabled={!file || validateImportMutation.isLoading}
            >
              {validateImportMutation.isLoading ? 'Validation...' : 'Valider le fichier'}
            </Button>
          </div>
        </div>
      )}

      {/* Étape 2: Validation */}
      {step === 'validate' && validationResult && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                {validationResult.isValid ? (
                  <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                )}
                Résultat de la validation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {validationResult.rowCount}
                  </div>
                  <div className="text-sm text-blue-800">Lignes détectées</div>
                </div>
                <div className={`p-4 rounded-lg ${
                  validationResult.errors.length === 0 ? 'bg-green-50' : 'bg-red-50'
                }`}>
                  <div className={`text-2xl font-bold ${
                    validationResult.errors.length === 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {validationResult.errors.length}
                  </div>
                  <div className={`text-sm ${
                    validationResult.errors.length === 0 ? 'text-green-800' : 'text-red-800'
                  }`}>
                    Erreurs trouvées
                  </div>
                </div>
              </div>

              {/* Erreurs */}
              {validationResult.errors.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-red-800">Erreurs à corriger :</h4>
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {validationResult.errors.map((error, index) => (
                      <div key={index} className="text-sm text-red-700 bg-red-50 p-2 rounded">
                        {error}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Aperçu */}
              {validationResult.preview.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-800 mb-2">Aperçu des données :</h4>
                  <div className="max-h-40 overflow-y-auto border rounded-lg">
                    {validationResult.preview.map((item, index) => (
                      <div key={index} className="p-2 border-b last:border-b-0 text-sm">
                        {item.hierarchy.join(' > ')}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={() => setStep('upload')}>
              Retour
            </Button>
            <Button
              onClick={handleImport}
              disabled={!validationResult.isValid || importZonesMutation.isLoading}
            >
              {importZonesMutation.isLoading ? 'Import en cours...' : 'Lancer l\'import'}
            </Button>
          </div>
        </div>
      )}

      {/* Étape 3: Import en cours */}
      {step === 'import' && (
        <div className="text-center py-12">
          <div className="animate-spin h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <h3 className="text-lg font-medium text-gray-900">Import en cours...</h3>
          <p className="text-gray-500 mt-2">Veuillez patienter pendant le traitement des données.</p>
        </div>
      )}

      {/* Étape 4: Résultats */}
      {step === 'complete' && importResult && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-green-600">
                <CheckCircle className="h-5 w-5 mr-2" />
                Import terminé avec succès
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Résumé */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-green-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {importResult.summary.created}
                  </div>
                  <div className="text-sm text-green-800">Créées</div>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {importResult.summary.duplicates}
                  </div>
                  <div className="text-sm text-orange-800">Doublons</div>
                </div>
                <div className="bg-red-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {importResult.summary.errors}
                  </div>
                  <div className="text-sm text-red-800">Erreurs</div>
                </div>
              </div>

              {/* Détails */}
              {importResult.details.created.length > 0 && (
                <div>
                  <h4 className="font-medium text-green-800 mb-2">Zones créées :</h4>
                  <div className="max-h-32 overflow-y-auto bg-green-50 p-3 rounded-lg space-y-1">
                    {importResult.details.created.map((zone, index) => (
                      <div key={index} className="text-sm text-green-700">
                        ✓ {zone}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {importResult.details.duplicates.length > 0 && (
                <div>
                  <h4 className="font-medium text-orange-800 mb-2">Doublons ignorés :</h4>
                  <div className="max-h-32 overflow-y-auto bg-orange-50 p-3 rounded-lg space-y-1">
                    {importResult.details.duplicates.map((zone, index) => (
                      <div key={index} className="text-sm text-orange-700">
                        ⚠ {zone}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-center">
                <Button
                  variant="outline"
                  onClick={downloadReport}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Télécharger le rapport complet
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={onClose}>
              Terminer
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export default ImportZones