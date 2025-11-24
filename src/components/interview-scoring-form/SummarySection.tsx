import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CheckCircle2, Send } from 'lucide-react'

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
  onSubmit?: () => void
  isSubmitting?: boolean
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
  onSubmit,
  isSubmitting = false,
}: SummarySectionProps) {
  // Enable submit as soon as scoring exists (finalWeightedScore > 0).
  // Full validation (candidate/interviewer/recommendation/etc.) still runs on submit in the parent form.
  const isFormReadyToSubmit = finalWeightedScore > 0;
  
  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card className="border-2 border-primary">
        <CardHeader>
          <CardTitle className="text-primary">Final Score Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">Final Score</p>
              <p className="text-3xl font-bold text-primary">{finalWeightedScore}</p>
              <p className="text-xs text-muted-foreground mt-1">of {maxPossibleScore}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">Percentage</p>
              <p className="text-3xl font-bold text-accent">{percentage.toFixed(1)}%</p>
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

        {/* Selection status removed */}
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

      {/* Submit Button */}
      <Card className="border-2 border-indigo-200 bg-gradient-to-r from-indigo-50 to-purple-50">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-start gap-3">
              {isFormReadyToSubmit ? (
                <>
                  <CheckCircle2 className="w-6 h-6 text-green-600 mt-1" />
                  <div>
                    <p className="font-semibold text-gray-900">Ready to Submit</p>
                    <p className="text-sm text-gray-600">All required fields are complete</p>
                  </div>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-6 h-6 text-amber-600 mt-1" />
                  <div>
                    <p className="font-semibold text-gray-900">Complete Required Fields</p>
                    <p className="text-sm text-gray-600">
                      Please ensure scoring is complete. Any remaining required fields will be validated on submit.
                    </p>
                  </div>
                </>
              )}
            </div>
            <Button
              type="button"
              onClick={onSubmit}
              disabled={!isFormReadyToSubmit || isSubmitting}
              size="lg"
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-8"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5 mr-2" />
                  Submit Interview Score
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

