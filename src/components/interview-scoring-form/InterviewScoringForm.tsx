import { useState, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Download, RotateCcw, AlertCircle, CheckCircle2, DollarSign, Calendar, Plus, X } from 'lucide-react'
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import ScoringTable from './ScoringTable'
import SummarySection from './SummarySection'
import { interviewService } from '@/services/interviewService'
import { CandidateDetailsCard } from './CandidateDetailsCard'
import { ReferenceGuideBanner } from './ReferenceGuideBanner'

type InterviewStage = 'phone' | 'first' | 'second' | 'final'
type InterviewType = 'technical' | 'behavioral' | 'panel'

interface Competency {
  id: string
  name: string
  // allow empty values initially (user input can clear the box)
  weight: number | null
  rating: number | null
  evidence: string
}

interface ScoringSection {
  id: string
  title: string
  competencies: Competency[]
}

const getInitialSections = (): ScoringSection[] => [
  {
    id: 'section_1',
    title: 'Role-Specific & Technical Skills',
    competencies: [
      { id: 'c_1_1', name: 'Technical Skill 1 (e.g., Proficiency in SQL)', weight: null, rating: null, evidence: '' },
      { id: 'c_1_2', name: 'Technical Skill 2 (e.g., Data Visualization)', weight: null, rating: null, evidence: '' },
      { id: 'c_1_3', name: 'Role-Specific Knowledge (e.g., Understanding of HRMS)', weight: null, rating: null, evidence: '' },
    ]
  },
  {
    id: 'section_2',
    title: 'Behavioral & Soft Skills',
    competencies: [
      { id: 'c_2_1', name: 'Problem-Solving', weight: null, rating: null, evidence: '' },
      { id: 'c_2_2', name: 'Communication', weight: null, rating: null, evidence: '' },
      { id: 'c_2_3', name: 'Teamwork & Collaboration', weight: null, rating: null, evidence: '' },
      { id: 'c_2_4', name: 'Adaptability/Initiative', weight: null, rating: null, evidence: '' },
    ]
  },
  {
    id: 'section_3',
    title: 'Cultural & Values Alignment',
    competencies: [
      { id: 'c_3_1', name: 'Alignment with Company Values', weight: null, rating: null, evidence: '' },
      { id: 'c_3_2', name: 'Motivation for Role', weight: null, rating: null, evidence: '' },
    ]
  }
]

interface InterviewScoringFormProps {
  initialData?: {
    candidateName?: string;
    positionAppliedFor?: string;
    interviewDate?: Date;
    roundId?: number | string;
    interviewStage?: InterviewStage;
    interviewType?: InterviewType;
    roundMode?: string;
    candidateEmail?: string;
    candidatePhone?: string;
    meetingLink?: string | null;
    interviewTime?: string;
    // full application and job objects from API
    candidateData?: any;
    jobData?: any;
  };
  onClose?: () => void;
  // parent can register a close request handler to be called when user tries to close workspace
  onRegisterClose?: (handler: () => void) => void;
  // optional callback invoked after successful submission so parent can refresh lists
  onSubmitted?: () => Promise<void> | void;
}

export default function InterviewScoringForm({ initialData, onClose, onRegisterClose }: InterviewScoringFormProps = {}) {
  // Candidate & Interview Details
  const [candidateName, setCandidateName] = useState(initialData?.candidateName || '')
  const [positionAppliedFor, setPositionAppliedFor] = useState(initialData?.positionAppliedFor || '')
  const [interviewerName, setInterviewerName] = useState('')
  const [interviewDate, setInterviewDate] = useState(
    initialData?.interviewDate ? initialData.interviewDate.toISOString().split('T')[0] : ''
  )
  const [interviewStage, setInterviewStage] = useState<InterviewStage>(initialData?.interviewStage || 'phone')
  const [interviewType, setInterviewType] = useState<InterviewType>(initialData?.interviewType || 'technical')

  // Scoring Data - Dynamic Sections
  const [sections, setSections] = useState<ScoringSection[]>(getInitialSections())

  // Summary
  const [keyStrengths, setKeyStrengths] = useState('')
  const [keyWeaknesses, setKeyWeaknesses] = useState('')
  const [generalNotes, setGeneralNotes] = useState('')
  const [recommendation, setRecommendation] = useState<string | null>(null)
  const [justification, setJustification] = useState('')

  const [showValidation, setShowValidation] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showCloseConfirm, setShowCloseConfirm] = useState(false)

  // Dynamic Section Management
  const addSection = useCallback(() => {
    const newSection: ScoringSection = {
      id: `section_${Date.now()}`,
      title: 'New Section',
      competencies: [
        { id: `c_${Date.now()}_1`, name: 'Competency 1', weight: 3, rating: 0, evidence: '' }
      ]
    }
    setSections(prev => [...prev, newSection])
  }, [])

  const removeSection = useCallback((sectionId: string) => {
    setSections(prev => prev.filter(s => s.id !== sectionId))
  }, [])

  const updateSectionTitle = useCallback((sectionId: string, newTitle: string) => {
    setSections(prev => prev.map(s => 
      s.id === sectionId ? { ...s, title: newTitle } : s
    ))
  }, [])

  const addCompetency = useCallback((sectionId: string) => {
    setSections(prev => prev.map(s => {
      if (s.id === sectionId) {
        const newCompetency: Competency = {
          id: `c_${Date.now()}`,
          name: `Competency ${s.competencies.length + 1}`,
          weight: 3,
          rating: 0,
          evidence: ''
        }
        return { ...s, competencies: [...s.competencies, newCompetency] }
      }
      return s
    }))
  }, [])

  const removeCompetency = useCallback((sectionId: string, competencyId: string) => {
    setSections(prev => prev.map(s => {
      if (s.id === sectionId) {
        return { ...s, competencies: s.competencies.filter(c => c.id !== competencyId) }
      }
      return s
    }))
  }, [])

  const updateCompetency = useCallback((sectionId: string, competencyId: string, field: keyof Competency, value: any) => {
    setSections(prev => prev.map(s => {
      if (s.id === sectionId) {
        return {
          ...s,
          competencies: s.competencies.map(c => 
            c.id === competencyId ? { ...c, [field]: value } : c
          )
        }
      }
      return s
    }))
  }, [])

  // Calculate weighted scores
  const calculateSectionTotal = (competencies: Competency[]) => {
    return competencies.reduce((sum, c) => sum + (c.rating ?? 0) * (c.weight ?? 0), 0)
  }

  const sectionSubtotals = sections.map(s => ({
    id: s.id,
    title: s.title,
    subtotal: calculateSectionTotal(s.competencies)
  }))

  const finalWeightedScore = sectionSubtotals.reduce((sum, s) => sum + s.subtotal, 0)

  const allCompetencies = sections.flatMap(s => s.competencies)
  const maxPossibleScore = allCompetencies.reduce((sum, c) => sum + 5 * (c.weight ?? 0), 0)
  const percentage = maxPossibleScore > 0 ? (finalWeightedScore / maxPossibleScore) * 100 : 0

  // Minimal validation: only require scoring to be done
  // All other fields (candidateName, positionAppliedFor, etc.) are populated from backend data
  const isFormComplete = finalWeightedScore > 0

  const handleExportToSheets = () => {
    if (!isFormComplete) {
      setShowValidation(true)
      return
    }
    const csvContent = generateCSV()
    const element = document.createElement('a')
    element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvContent))
    element.setAttribute('download', `interview_scoring_${candidateName}_${new Date().toISOString().split('T')[0]}.csv`)
    element.style.display = 'none'
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  const generateCSV = () => {
    let csv = 'Interview Scoring Report\n\n'
    csv += `Candidate Name,${candidateName}\n`
    csv += `Position Applied For,${positionAppliedFor}\n`
    csv += `Interviewer Name,${interviewerName}\n`
    csv += `Interview Date,${interviewDate}\n`
    csv += `Interview Stage,${interviewStage}\n`
    csv += `Interview Type,${interviewType}\n\n`

    sections.forEach((section, index) => {
      csv += `${section.title}\n`
      csv += 'Competency,Weight,Rating,Weighted Score,Evidence\n'
      section.competencies.forEach((c) => {
        csv += `"${c.name}",${c.weight},${c.rating},${c.rating * c.weight},"${c.evidence.replace(/"/g, '""')}"\n`
      })
      const subtotal = calculateSectionTotal(section.competencies)
      csv += `Section ${index + 1} Subtotal,,,,${subtotal}\n\n`
    })

    csv += `Final Weighted Score,${finalWeightedScore}\n`
    csv += `Maximum Possible Score,${maxPossibleScore}\n`
    csv += `Percentage,${percentage.toFixed(2)}%\n`
    csv += `Recommendation,${recommendation || 'Not set'}\n\n`
    csv += `Key Strengths,"${keyStrengths}"\n`
    csv += `Key Weaknesses,"${keyWeaknesses}"\n`
    csv += `General Notes,"${generalNotes}"\n`
    csv += `Justification,"${justification}"\n`

    return csv
  }

  const resetForm = () => {
    setCandidateName('')
    setPositionAppliedFor('')
    setInterviewerName('')
    setInterviewDate('')
    setInterviewStage('phone')
    setInterviewType('technical')
    setSections(getInitialSections())
    setKeyStrengths('')
    setKeyWeaknesses('')
    setGeneralNotes('')
    setRecommendation(null)
    setJustification('')
    setShowValidation(false)
  }

  const hasUnsavedChanges = useCallback(() => {
    if (candidateName || positionAppliedFor || interviewerName || keyStrengths || keyWeaknesses || generalNotes || justification) return true
    // any competency with non-null or evidence
    for (const s of sections) {
      for (const c of s.competencies) {
        if (c.weight !== null || c.rating !== null || (c.evidence && c.evidence.trim() !== '') || (c.name && c.name.trim() !== '')) {
          return true
        }
      }
    }
    return false
  }, [candidateName, positionAppliedFor, interviewerName, keyStrengths, keyWeaknesses, generalNotes, justification, sections])

  const handleSubmit = async () => {
    // Prepare the data for submission (only include scores + summary per request)
    const submissionData = {
      scores: {
        sections: sections.map(section => ({
          title: section.title,
          competencies: section.competencies,
          subtotal: calculateSectionTotal(section.competencies)
        })),
        finalWeightedScore,
        maxPossibleScore,
        percentage,
      },
      summary: {
        keyStrengths,
        keyWeaknesses,
        generalNotes,
        justification,
        recommendation,
      },
      submittedAt: new Date().toISOString(),
    }
    
    // Validate form completion
    if (!isFormComplete) {
      setShowValidation(true)
      return
    }

    // Resolve round id from initialData (required by API)
    const roundId = initialData?.roundId || (initialData?.candidateData && ((initialData.candidateData as any).round_id || (initialData.candidateData as any).roundId))

    if (!roundId) {
      return
    }

    setIsSubmitting(true)

      try {
        // Submit to backend
        const resp = await interviewService.submitFeedback(roundId, submissionData)

        if (!resp.success) {
          setIsSubmitting(false)
          return
        }

        // Close workspace
        if (onClose) {
          onClose()
        }

        // Let parent refresh the scheduled rounds if provided, otherwise fall back
        if (onSubmitted) {
          await onSubmitted()
        } else {
          await interviewService.fetchScheduledRounds()
        }

      } catch (error) {
        // Error already logged by service
      } finally {
        setIsSubmitting(false)
      }
  }

  // Allow parent to request close: register a handler that checks unsaved changes and opens the dialog
  const handleParentCloseRequest = useCallback(() => {
    if (hasUnsavedChanges()) {
      setShowCloseConfirm(true)
    } else {
      onClose && onClose()
    }
  }, [hasUnsavedChanges, onClose])

  useEffect(() => {
    if (onRegisterClose) {
      onRegisterClose(handleParentCloseRequest)
      return () => onRegisterClose(() => {})
    }
    // nothing to cleanup if not provided
    return undefined
  }, [onRegisterClose, handleParentCloseRequest])



  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      {/* Reference Guide Banner */}
      <ReferenceGuideBanner />

      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-primary mb-2">Interview Scoring</h1>
            <p className="text-muted-foreground">Evaluate candidates objectively with weighted scoring</p>
          </div>
          {initialData?.meetingLink && initialData?.roundMode && initialData.roundMode.toLowerCase() === 'online' && (() => {
            // Check if interview time has arrived
            const now = new Date();
            const interviewDateTime = initialData?.interviewDate ? new Date(initialData.interviewDate) : null;
            if (interviewDateTime && initialData?.interviewTime) {
              const [hours, minutes] = initialData.interviewTime.split(':').map(Number);
              interviewDateTime.setHours(hours, minutes, 0, 0);
            }
            const canJoin = !interviewDateTime || now >= interviewDateTime;

            return canJoin ? (
              <Button
                onClick={() => initialData.meetingLink && window.open(initialData.meetingLink, '_blank')}
                className="bg-green-600 hover:bg-green-700 text-white"
                size="lg"
              >
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>
                </svg>
                Join Meeting
              </Button>
            ) : null;
          })()}
          {/* Close button: warns if unsaved changes */}
          {/* Close button moved to parent workspace modal header */}
        </div>
      </div>

      {/* Close confirmation dialog */}
      <Dialog open={showCloseConfirm} onOpenChange={(open) => {
        // Prevent closing the dialog by clicking backdrop or escape
        if (!open) {
          // User tried to close - do nothing, force them to use buttons
          return
        }
        setShowCloseConfirm(open)
      }}>
    <DialogContent className="sm:max-w-md z-[1200]" onPointerDownOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
          <DialogTitle className="text-xl font-bold text-gray-900">Discard scoring changes?</DialogTitle>
          <DialogDescription className="text-gray-600 mt-2">
            Scoring results will be discarded if you close. Are you sure you want to discard your changes?
          </DialogDescription>
          <DialogFooter className="mt-6 flex gap-3 sm:gap-3">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setShowCloseConfirm(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                setShowCloseConfirm(false)
                if (onClose) {
                  onClose()
                }
              }}
              className="flex-1 bg-red-600 hover:bg-red-700"
            >
              Yes, discard
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      

      {/* Main Form */}
      <Tabs defaultValue="candidate" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 bg-gray-100 p-1 h-auto rounded-lg">
          <TabsTrigger 
            value="candidate"
            className="data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm rounded-md transition-all"
          >
            Interview Details
          </TabsTrigger>
          <TabsTrigger 
            value="scoring"
            className="data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm rounded-md transition-all"
          >
            Scoring
          </TabsTrigger>
          <TabsTrigger 
            value="summary"
            className="data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm rounded-md transition-all"
          >
            Summary
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Candidate Details */}
        <TabsContent value="candidate">
          {/* Job Details card (from jobData when available) */}
          {initialData?.jobData ? (
            <div className="mb-6">
              <div className="p-4 bg-gradient-to-r from-indigo-50 to-white rounded-lg border">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{initialData.jobData.job_title || initialData.jobData.title}</h3>
                    <p className="text-sm text-gray-600">{initialData.jobData.company_name || ''} · {initialData.jobData.location_type || ''}</p>
                    {initialData.jobData.description && (
                      <p className="mt-2 text-sm text-gray-700 whitespace-pre-wrap">{String(initialData.jobData.description)}</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end ml-4 space-y-2">
                    {(initialData.jobData.salary_from || initialData.jobData.salary_to) && (
                      <div className="flex items-center text-sm text-blue-800">
                        <DollarSign className="h-5 w-5 text-blue-700" />
                        <div className="ml-2">
                          <span className="text-xs text-blue-700 font-medium mr-1">{initialData.jobData.currency || 'USD'}</span>
                          <span className="font-semibold">
                            {initialData.jobData.salary_from ? String(initialData.jobData.salary_from) : ''}
                            {initialData.jobData.salary_to ? ` - ${initialData.jobData.salary_to}` : ''}
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span>
                        Posted: {initialData.jobData.created_at ? new Date(initialData.jobData.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : ''}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {/* Candidate details populated from candidateData (application) when available */}
          <CandidateDetailsCard
            candidateName={
              (initialData?.candidateData && `${initialData.candidateData.candidate_fname || ''} ${initialData.candidateData.candidate_lname || ''}`.trim()) || candidateName || 'Candidate Name'
            }
            positionAppliedFor={
              (initialData?.jobData && (initialData.jobData.job_title || initialData.jobData.title)) || positionAppliedFor || 'Position Not Specified'
            }
            candidateEmail={initialData?.candidateData?.email || initialData?.candidateEmail || ''}
            candidatePhone={initialData?.candidateData?.phone || initialData?.candidatePhone || ''}
            location={initialData?.candidateData?.address || ''}
            experiences={initialData?.candidateData?.experiences || []}
            educations={initialData?.candidateData?.educations || []}
            skills={
              initialData?.candidateData?.skills && initialData.candidateData.skills.length > 0
                ? initialData.candidateData.skills.map((s:any) => s.name || s)
                : []
            }
            resumeUrl={initialData?.candidateData?.resume_url || undefined}
            appliedDate={initialData?.candidateData?.applied_at ? new Date(initialData.candidateData.applied_at) : (interviewDate ? new Date(interviewDate) : new Date())}
            matchScore={initialData?.candidateData?.final_score ? Math.round(initialData.candidateData.final_score * 100) : (initialData?.candidateData?.match_score || 0)}
          />
        </TabsContent>

        {/* Tab 2: Scoring */}
        <TabsContent value="scoring" className="space-y-6">
          {/* Dynamic Sections */}
          {sections.map((section) => (
            <ScoringTable
              key={section.id}
              title={section.title}
              competencies={section.competencies}
              onUpdate={(id, field, value) => updateCompetency(section.id, id, field, value)}
              onAddCompetency={() => addCompetency(section.id)}
              onRemoveCompetency={(id) => removeCompetency(section.id, id)}
              onUpdateTitle={(newTitle) => updateSectionTitle(section.id, newTitle)}
              onRemoveSection={() => removeSection(section.id)}
              subtotal={calculateSectionTotal(section.competencies)}
              canRemoveSection={sections.length > 1}
            />
          ))}

          {/* Add Section Button */}
          <Button
            type="button"
            onClick={addSection}
            variant="outline"
            size="lg"
            className="w-full border-dashed border-2 border-primary/50 hover:border-primary hover:bg-primary/5 transition-all h-14 text-base"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add New Section
          </Button>

          {/* Final Score Card */}
          <Card className="border-2 border-primary shadow-lg">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-indigo-50">
              <CardTitle className="text-primary text-xl">Final Score & Recommendation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              {/* Section Breakdown */}
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {sectionSubtotals.map((section, index) => (
                  <div key={section.id} className="space-y-1">
                    <p className="text-xs text-muted-foreground truncate" title={section.title}>
                      {section.title}
                    </p>
                    <p className="text-2xl font-bold text-primary">{section.subtotal}</p>
                  </div>
                ))}
                <div className="space-y-1 col-span-2 md:col-span-1">
                  <p className="text-xs text-muted-foreground">Total Score</p>
                  <p className="text-2xl font-bold text-primary">{finalWeightedScore}</p>
                </div>
              </div>

              {/* Overall Percentage */}
              <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border-2 border-primary/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Overall Performance</p>
                    <p className="text-4xl font-bold text-primary">{percentage.toFixed(1)}%</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Max Possible</p>
                    <p className="text-lg font-semibold text-gray-600">{maxPossibleScore} pts</p>
                  </div>
                </div>
              </div>

              {/* Recommendation Badges - Hidden as per request */}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Summary & Decision */}
        <TabsContent value="summary">
          <SummarySection
            keyStrengths={keyStrengths}
            setKeyStrengths={setKeyStrengths}
            keyWeaknesses={keyWeaknesses}
            setKeyWeaknesses={setKeyWeaknesses}
            generalNotes={generalNotes}
            setGeneralNotes={setGeneralNotes}
            justification={justification}
            setJustification={setJustification}
            recommendation={recommendation}
            finalWeightedScore={finalWeightedScore}
            maxPossibleScore={maxPossibleScore}
            percentage={percentage}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

