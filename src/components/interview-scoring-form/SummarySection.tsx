import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'

interface SummarySectionProps {
  keyStrengths: string
  setKeyStrengths: (value: string) => void
  keyWeaknesses: string
  setKeyWeaknesses: (value: string) => void
  generalNotes: string
  setGeneralNotes: (value: string) => void
  justification: string
  setJustification: (value: string) => void
  recommendation: string | null
  finalWeightedScore: number
  maxPossibleScore: number
  percentage: number
}

export default function SummarySection({
  keyStrengths,
  setKeyStrengths,
  keyWeaknesses,
  setKeyWeaknesses,
  generalNotes,
  setGeneralNotes,
  justification,
  setJustification,
  recommendation,
  finalWeightedScore,
  maxPossibleScore,
  percentage,
}: SummarySectionProps) {
  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card className="border-2 border-primary">
        <CardHeader>
          <CardTitle className="text-primary">Final Score Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">Final Score</p>
              <p className="text-3xl font-bold text-primary">{finalWeightedScore}</p>
              <p className="text-xs text-muted-foreground mt-1">of {maxPossibleScore}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">Percentage</p>
              <p className="text-3xl font-bold text-accent">{percentage.toFixed(1)}%</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">Recommendation</p>
              <p className="text-lg font-bold">
                {recommendation === 'strong-hire' && <Badge className="bg-green-600">Strong Hire</Badge>}
                {recommendation === 'hire' && <Badge className="bg-blue-600">Hire</Badge>}
                {recommendation === 'hold' && <Badge className="bg-yellow-600">Hold</Badge>}
                {recommendation === 'no-hire' && <Badge className="bg-red-600">No Hire</Badge>}
                {!recommendation && <Badge variant="outline">Not Selected</Badge>}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Strengths */}
      <Card>
        <CardHeader>
          <CardTitle className="text-primary">Key Strengths</CardTitle>
          <CardDescription>What impressed you about this candidate?</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="e.g., Strong problem-solving skills, excellent communication, demonstrates ownership..."
            value={keyStrengths}
            onChange={(e) => setKeyStrengths(e.target.value)}
            className="min-h-24 resize-none"
          />
        </CardContent>
      </Card>

      {/* Key Weaknesses */}
      <Card>
        <CardHeader>
          <CardTitle className="text-primary">Key Weaknesses / Red Flags</CardTitle>
          <CardDescription>What concerns do you have?</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="e.g., Limited experience with framework X, unclear on specific requirement..."
            value={keyWeaknesses}
            onChange={(e) => setKeyWeaknesses(e.target.value)}
            className="min-h-24 resize-none"
          />
        </CardContent>
      </Card>

      {/* General Notes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-primary">General Notes / Observations</CardTitle>
          <CardDescription>Any additional observations from the interview</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Any other notes or observations..."
            value={generalNotes}
            onChange={(e) => setGeneralNotes(e.target.value)}
            className="min-h-24 resize-none"
          />
        </CardContent>
      </Card>

      {/* Justification */}
      <Card>
        <CardHeader>
          <CardTitle className="text-primary">Justification for Recommendation</CardTitle>
          <CardDescription>Explain why you made this recommendation</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Provide context for your recommendation based on the scores and observations..."
            value={justification}
            onChange={(e) => setJustification(e.target.value)}
            className="min-h-24 resize-none"
          />
        </CardContent>
      </Card>
    </div>
  )
}

