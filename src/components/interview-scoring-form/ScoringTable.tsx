import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'

interface Competency {
  id: string
  name: string
  weight: number
  rating: number
  evidence: string
}

interface ScoringTableProps {
  title: string
  competencies: Competency[]
  onUpdate: (id: string, field: keyof Competency, value: any) => void
  subtotal: number
}

export default function ScoringTable({ title, competencies, onUpdate, subtotal }: ScoringTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-primary">{title}</CardTitle>
        <CardDescription>Set weights before interview, record ratings and evidence during interview</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {competencies.map((competency) => (
            <div key={competency.id} className="p-4 border rounded-lg space-y-3 bg-card hover:bg-muted/30 transition">
              <div className="flex items-start justify-between">
                <Label className="text-base font-semibold">{competency.name}</Label>
                <Badge variant="secondary">{competency.rating * competency.weight}</Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Weight */}
                <div className="space-y-2">
                  <Label htmlFor={`weight-${competency.id}`} className="text-xs">
                    Weight (1-5)
                  </Label>
                  <Select
                    value={competency.weight.toString()}
                    onValueChange={(v) => onUpdate(competency.id, 'weight', parseInt(v))}
                  >
                    <SelectTrigger id={`weight-${competency.id}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <SelectItem key={n} value={n.toString()}>
                          {n}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Rating */}
                <div className="space-y-2">
                  <Label htmlFor={`rating-${competency.id}`} className="text-xs">
                    Rating (1-5)
                  </Label>
                  <Select
                    value={competency.rating.toString()}
                    onValueChange={(v) => onUpdate(competency.id, 'rating', parseInt(v))}
                  >
                    <SelectTrigger id={`rating-${competency.id}`}>
                      <SelectValue placeholder="Select rating" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Not Rated</SelectItem>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <SelectItem key={n} value={n.toString()}>
                          {n}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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

          {/* Subtotal */}
          <div className="mt-4 p-4 bg-primary/5 border-2 border-primary rounded-lg flex justify-between items-center">
            <p className="font-semibold text-primary">Section Subtotal</p>
            <p className="text-2xl font-bold text-primary">{subtotal}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

