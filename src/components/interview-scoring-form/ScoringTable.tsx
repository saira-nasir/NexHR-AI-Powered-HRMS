import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Plus, Trash2, GripVertical } from 'lucide-react'

interface Competency {
  id: string
  name: string
  // allow empty inputs initially
  weight: number | null
  rating: number | null
  evidence: string
}

interface ScoringTableProps {
  title: string
  competencies: Competency[]
  onUpdate: (id: string, field: keyof Competency, value: any) => void
  onAddCompetency: () => void
  onRemoveCompetency: (id: string) => void
  onUpdateTitle: (newTitle: string) => void
  onRemoveSection: () => void
  subtotal: number
  canRemoveSection: boolean
}

export default function ScoringTable({ 
  title, 
  competencies, 
  onUpdate, 
  onAddCompetency,
  onRemoveCompetency,
  onUpdateTitle,
  onRemoveSection,
  subtotal,
  canRemoveSection
}: ScoringTableProps) {
  return (
    <Card className="border-2 hover:border-primary/30 transition-colors">
      <CardHeader className="bg-gradient-to-r from-indigo-50/50 to-white">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            <GripVertical className="h-5 w-5 text-gray-400 flex-shrink-0" />
            <Input
              value={title}
              onChange={(e) => onUpdateTitle(e.target.value)}
              className="text-lg font-semibold border-none shadow-none focus-visible:ring-1 focus-visible:ring-primary px-2 bg-transparent"
              placeholder="Section Name"
            />
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-primary/10 text-primary font-bold px-3 py-1">
              {subtotal} pts
            </Badge>
            {canRemoveSection && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onRemoveSection}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        <CardDescription>Set weights before interview, record ratings and evidence during interview</CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-4">
          {competencies.map((competency, index) => (
            <div key={competency.id} className="p-4 border rounded-lg space-y-3 bg-card hover:bg-muted/20 transition-colors group/item">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex-1 min-w-0">
                  <Label htmlFor={`name-${competency.id}`} className="text-xs font-medium text-muted-foreground mb-1 block">
                    Competency Name
                  </Label>
                  <Input
                    id={`name-${competency.id}`}
                    value={competency.name}
                    onChange={(e) => onUpdate(competency.id, 'name', e.target.value)}
                    className="h-9"
                    placeholder={`Competency ${index + 1}`}
                  />
                </div>
                <div className="flex items-center gap-2 pt-5">
                  <Badge variant="secondary" className="bg-indigo-100 text-indigo-700 font-bold px-2.5 py-1">
                    {competency.rating * competency.weight}
                  </Badge>
                  {competencies.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemoveCompetency(competency.id)}
                      className="opacity-0 group-hover/item:opacity-100 transition-opacity text-red-600 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Weight (numeric input 1-5) */}
                <div className="space-y-2">
                  <Label htmlFor={`weight-${competency.id}`} className="text-xs font-medium">
                    Weight (1-5)
                  </Label>
                  <Input
                    id={`weight-${competency.id}`}
                    type="number"
                    min={1}
                    max={5}
                    value={competency.weight === null ? '' : String(competency.weight)}
                    onChange={(e) => {
                      const raw = e.target.value
                      if (raw === '') {
                        onUpdate(competency.id, 'weight', null)
                        return
                      }
                      const v = parseInt(raw, 10)
                      if (Number.isNaN(v)) {
                        onUpdate(competency.id, 'weight', null)
                        return
                      }
                      // clamp: values >5 -> 5, values <=0 -> 1
                      const clamped = v <= 0 ? 1 : v > 5 ? 5 : v
                      onUpdate(competency.id, 'weight', clamped)
                    }}
                    className="h-9 w-full"
                  />
                </div>

                {/* Rating (numeric input 1-5) */}
                <div className="space-y-2">
                  <Label htmlFor={`rating-${competency.id}`} className="text-xs font-medium">
                    Rating (1-5)
                  </Label>
                  <Input
                    id={`rating-${competency.id}`}
                    type="number"
                    min={1}
                    max={5}
                    value={competency.rating === null ? '' : String(competency.rating)}
                    onChange={(e) => {
                      const raw = e.target.value
                      if (raw === '') {
                        onUpdate(competency.id, 'rating', null)
                        return
                      }
                      const v = parseInt(raw, 10)
                      if (Number.isNaN(v)) {
                        onUpdate(competency.id, 'rating', null)
                        return
                      }
                      // clamp: values >5 -> 5, values <=0 -> 1
                      const clamped = v <= 0 ? 1 : v > 5 ? 5 : v
                      onUpdate(competency.id, 'rating', clamped)
                    }}
                    className="h-9 w-full"
                  />
                </div>

                {/* Weighted Score (Read-only) */}
                <div className="space-y-2">
                  <Label className="text-xs">Weighted Score</Label>
                  <div className="flex items-center justify-center h-9 px-3 bg-accent/10 border border-accent rounded-md">
                    <span className="font-semibold text-primary">{competency.rating * competency.weight}</span>
                  </div>
                </div>
              </div>

              {/* Evidence */}
              <div className="space-y-2">
                <Label htmlFor={`evidence-${competency.id}`} className="text-xs">
                  Evidence & Comments (Specific examples)
                </Label>
                <Textarea
                  id={`evidence-${competency.id}`}
                  placeholder="Provide specific examples that justify this rating..."
                  value={competency.evidence}
                  onChange={(e) => onUpdate(competency.id, 'evidence', e.target.value)}
                  className="min-h-20 resize-none"
                />
              </div>
            </div>
          ))}

          {/* Add Competency Button */}
          <Button
            type="button"
            onClick={onAddCompetency}
            variant="outline"
            className="w-full border-dashed border-2 hover:border-primary hover:bg-primary/5 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Competency
          </Button>

          {/* Subtotal */}
          <div className="mt-4 p-4 bg-gradient-to-r from-primary/5 to-indigo-50 border-2 border-primary/30 rounded-lg flex justify-between items-center">
            <p className="font-semibold text-primary">Section Subtotal</p>
            <p className="text-2xl font-bold text-primary">{subtotal}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

