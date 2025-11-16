import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Download, RotateCcw, AlertCircle, CheckCircle2 } from 'lucide-react'
import ScoringTable from './ScoringTable'
import SummarySection from './SummarySection'
import { CandidateDetailsCard } from './CandidateDetailsCard'
import { ReferenceGuideBanner } from './ReferenceGuideBanner'

type InterviewStage = 'phone' | 'first' | 'second' | 'final'
type InterviewType = 'technical' | 'behavioral' | 'panel'

interface Competency {
  id: string
  name: string
  weight: number
  rating: number
  evidence: string
}

interface SectionScores {
  technical: Competency[]
  behavioral: Competency[]
  cultural: Competency[]
}

const initialTechnicalSkills: Competency[] = [
  { id: 't1', name: 'Technical Skill 1 (e.g., Proficiency in SQL)', weight: 5, rating: 0, evidence: '' },
  { id: 't2', name: 'Technical Skill 2 (e.g., Data Visualization)', weight: 4, rating: 0, evidence: '' },
  { id: 't3', name: 'Role-Specific Knowledge (e.g., Understanding of HRMS)', weight: 3, rating: 0, evidence: '' },
]

const initialBehavioralSkills: Competency[] = [
  { id: 'b1', name: 'Problem-Solving', weight: 5, rating: 0, evidence: '' },
  { id: 'b2', name: 'Communication', weight: 4, rating: 0, evidence: '' },
  { id: 'b3', name: 'Teamwork & Collaboration', weight: 3, rating: 0, evidence: '' },
  { id: 'b4', name: 'Adaptability/Initiative', weight: 3, rating: 0, evidence: '' },
]

const initialCulturalSkills: Competency[] = [
  { id: 'c1', name: 'Alignment with Company Values', weight: 4, rating: 0, evidence: '' },
  { id: 'c2', name: 'Motivation for Role', weight: 2, rating: 0, evidence: '' },
]

interface InterviewScoringFormProps {
  initialData?: {
    candidateName?: string;
    positionAppliedFor?: string;
    interviewDate?: Date;
    interviewStage?: InterviewStage;
    interviewType?: InterviewType;
  };
}

export default function InterviewScoringForm({ initialData }: InterviewScoringFormProps = {}) {
  // Candidate & Interview Details
  const [candidateName, setCandidateName] = useState(initialData?.candidateName || '')
  const [positionAppliedFor, setPositionAppliedFor] = useState(initialData?.positionAppliedFor || '')
  const [interviewerName, setInterviewerName] = useState('')
  const [interviewDate, setInterviewDate] = useState(
    initialData?.interviewDate ? initialData.interviewDate.toISOString().split('T')[0] : ''
  )
  const [interviewStage, setInterviewStage] = useState<InterviewStage>(initialData?.interviewStage || 'phone')
  const [interviewType, setInterviewType] = useState<InterviewType>(initialData?.interviewType || 'technical')

  // Scoring Data
  const [scores, setScores] = useState<SectionScores>({
    technical: initialTechnicalSkills,
    behavioral: initialBehavioralSkills,
    cultural: initialCulturalSkills,
  })

  // Summary
  const [keyStrengths, setKeyStrengths] = useState('')
  const [keyWeaknesses, setKeyWeaknesses] = useState('')
  const [generalNotes, setGeneralNotes] = useState('')
  const [recommendation, setRecommendation] = useState<string | null>(null)
  const [justification, setJustification] = useState('')

  const [showValidation, setShowValidation] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Calculate weighted scores
  const calculateSectionTotal = (competencies: Competency[]) => {
    return competencies.reduce((sum, c) => sum + c.rating * c.weight, 0)
  }

  const technicalSubtotal = calculateSectionTotal(scores.technical)
  const behavioralSubtotal = calculateSectionTotal(scores.behavioral)
  const culturalSubtotal = calculateSectionTotal(scores.cultural)
  const finalWeightedScore = technicalSubtotal + behavioralSubtotal + culturalSubtotal

  const maxPossibleScore = [...scores.technical, ...scores.behavioral, ...scores.cultural].reduce(
    (sum, c) => sum + 5 * c.weight,
    0
  )
  const percentage = maxPossibleScore > 0 ? (finalWeightedScore / maxPossibleScore) * 100 : 0

  const isFormComplete = !!(
    candidateName && positionAppliedFor && interviewerName && interviewDate &&
    recommendation && finalWeightedScore > 0
  )

  const updateCompetency = (
    section: keyof SectionScores,
    id: string,
    field: keyof Competency,
    value: any
  ) => {
    setScores((prev) => ({
      ...prev,
      [section]: prev[section].map((c) => (c.id === id ? { ...c, [field]: value } : c)),
    }))
  }

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

    csv += 'Part 1: Technical Skills\n'
    csv += 'Competency,Weight,Rating,Weighted Score,Evidence\n'
    scores.technical.forEach((c) => {
      csv += `"${c.name}",${c.weight},${c.rating},${c.rating * c.weight},"${c.evidence.replace(/"/g, '""')}"\n`
    })
    csv += `Part 1 Subtotal,,,,${technicalSubtotal}\n\n`

    csv += 'Part 2: Behavioral & Soft Skills\n'
    csv += 'Competency,Weight,Rating,Weighted Score,Evidence\n'
    scores.behavioral.forEach((c) => {
      csv += `"${c.name}",${c.weight},${c.rating},${c.rating * c.weight},"${c.evidence.replace(/"/g, '""')}"\n`
    })
    csv += `Part 2 Subtotal,,,,${behavioralSubtotal}\n\n`

    csv += 'Part 3: Cultural & Values Alignment\n'
    csv += 'Competency,Weight,Rating,Weighted Score,Evidence\n'
    scores.cultural.forEach((c) => {
      csv += `"${c.name}",${c.weight},${c.rating},${c.rating * c.weight},"${c.evidence.replace(/"/g, '""')}"\n`
    })
    csv += `Part 3 Subtotal,,,,${culturalSubtotal}\n\n`

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
    setScores({
      technical: initialTechnicalSkills,
      behavioral: initialBehavioralSkills,
      cultural: initialCulturalSkills,
    })
    setKeyStrengths('')
    setKeyWeaknesses('')
    setGeneralNotes('')
    setRecommendation(null)
    setJustification('')
    setShowValidation(false)
  }

  const handleSubmit = async () => {
    if (!isFormComplete) {
      setShowValidation(true)
      return
    }

    setIsSubmitting(true)
    
    try {
      // Prepare the data for submission
      const submissionData = {
        candidate: {
          name: candidateName,
          position: positionAppliedFor,
        },
        interview: {
          interviewer: interviewerName,
          date: interviewDate,
          stage: interviewStage,
          type: interviewType,
        },
        scores: {
          technical: scores.technical,
          behavioral: scores.behavioral,
          cultural: scores.cultural,
          technicalSubtotal,
          behavioralSubtotal,
          culturalSubtotal,
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

      // TODO: Replace with actual API call
      console.log('Submitting interview scoring:', submissionData)
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Show success message (you can add a toast notification here)
      alert('Interview scoring submitted successfully!')
      
      // Optionally reset the form
      // resetForm()
      
    } catch (error) {
      console.error('Error submitting interview scoring:', error)
      alert('Failed to submit interview scoring. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      {/* Reference Guide Banner */}
      <ReferenceGuideBanner />

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-primary mb-2">Interview Scoring</h1>
        <p className="text-muted-foreground">Evaluate candidates objectively with weighted scoring</p>
        <div className="mt-4 flex items-center gap-2">
          {isFormComplete ? (
            <>
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <span className="text-sm text-green-600 font-medium">Form ready for export</span>
            </>
          ) : (
            <>
              <AlertCircle className="w-5 h-5 text-amber-600" />
              <span className="text-sm text-amber-600">Complete all sections to export</span>
            </>
          )}
        </div>
      </div>

      {/* Main Form */}
      <Tabs defaultValue="candidate" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 bg-gray-100 p-1 h-auto rounded-lg">
          <TabsTrigger 
            value="candidate"
            className="data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm rounded-md transition-all"
          >
            Candidate Details
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
          <CandidateDetailsCard
            candidateName={candidateName || 'Candidate Name'}
            positionAppliedFor={positionAppliedFor || 'Position Not Specified'}
            candidateEmail="candidate@example.com"
            candidatePhone="+1 (555) 123-4567"
            location="San Francisco, CA"
            experience="5+ years"
            education={[
              'Bachelor of Science in Computer Science - Stanford University (2016)',
              'Master of Science in Software Engineering - MIT (2018)'
            ]}
            skills={[
              'JavaScript',
              'TypeScript',
              'React',
              'Node.js',
              'Python',
              'SQL',
              'MongoDB',
              'AWS',
              'Docker',
              'Kubernetes',
              'Git',
              'Agile/Scrum'
            ]}
            resumeUrl="#"
            appliedDate={interviewDate ? new Date(interviewDate) : new Date()}
            matchScore={87}
          />

          {/* Interview Configuration */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Interview Configuration</CardTitle>
              <CardDescription>Set up the interview details and interviewer information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="interviewer">Interviewer Name *</Label>
                  <Input
                    id="interviewer"
                    placeholder="Full name"
                    value={interviewerName}
                    onChange={(e) => setInterviewerName(e.target.value)}
                    className={showValidation && !interviewerName ? 'border-red-500' : ''}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date">Interview Date *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={interviewDate}
                    onChange={(e) => setInterviewDate(e.target.value)}
                    className={showValidation && !interviewDate ? 'border-red-500' : ''}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="stage">Interview Stage</Label>
                  <Select value={interviewStage} onValueChange={(v) => setInterviewStage(v as InterviewStage)}>
                    <SelectTrigger id="stage">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="phone">Phone Screen</SelectItem>
                      <SelectItem value="first">1st Round</SelectItem>
                      <SelectItem value="second">2nd Round</SelectItem>
                      <SelectItem value="final">Final</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">Interview Type</Label>
                  <Select value={interviewType} onValueChange={(v) => setInterviewType(v as InterviewType)}>
                    <SelectTrigger id="type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="technical">Technical</SelectItem>
                      <SelectItem value="behavioral">Behavioral</SelectItem>
                      <SelectItem value="panel">Panel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Scoring */}
        <TabsContent value="scoring" className="space-y-6">
          {/* Part 1: Technical Skills */}
          <ScoringTable
            title="Part 1: Role-Specific & Technical Skills"
            competencies={scores.technical}
            onUpdate={(id, field, value) => updateCompetency('technical', id, field, value)}
            subtotal={technicalSubtotal}
          />

          {/* Part 2: Behavioral & Soft Skills */}
          <ScoringTable
            title="Part 2: Behavioral & Soft Skills"
            competencies={scores.behavioral}
            onUpdate={(id, field, value) => updateCompetency('behavioral', id, field, value)}
            subtotal={behavioralSubtotal}
          />

          {/* Part 3: Cultural & Values Alignment */}
          <ScoringTable
            title="Part 3: Cultural & Values Alignment"
            competencies={scores.cultural}
            onUpdate={(id, field, value) => updateCompetency('cultural', id, field, value)}
            subtotal={culturalSubtotal}
          />

          {/* Final Score Card */}
          <Card className="border-2 border-primary">
            <CardHeader>
              <CardTitle className="text-primary">Final Score & Recommendation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Part 1</p>
                  <p className="text-2xl font-bold text-primary">{technicalSubtotal}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Part 2</p>
                  <p className="text-2xl font-bold text-primary">{behavioralSubtotal}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Part 3</p>
                  <p className="text-2xl font-bold text-primary">{culturalSubtotal}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Total Score</p>
                  <p className="text-2xl font-bold text-primary">{finalWeightedScore}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Percentage</p>
                  <p className="text-2xl font-bold text-accent">{percentage.toFixed(1)}%</p>
                </div>
              </div>

              {/* Recommendation Badges */}
              <div className="pt-4 space-y-2">
                <p className="text-sm font-semibold">Recommendation *</p>
                <div className="flex flex-wrap gap-2">
                  <Badge
                    variant={recommendation === 'strong-hire' ? 'default' : 'outline'}
                    className={
                      recommendation === 'strong-hire'
                        ? 'bg-green-600 text-white cursor-pointer'
                        : 'cursor-pointer hover:bg-green-100'
                    }
                    onClick={() => setRecommendation('strong-hire')}
                  >
                    Strong Hire (≥85%)
                  </Badge>
                  <Badge
                    variant={recommendation === 'hire' ? 'default' : 'outline'}
                    className={
                      recommendation === 'hire'
                        ? 'bg-blue-600 text-white cursor-pointer'
                        : 'cursor-pointer hover:bg-blue-100'
                    }
                    onClick={() => setRecommendation('hire')}
                  >
                    Hire (70-84%)
                  </Badge>
                  <Badge
                    variant={recommendation === 'hold' ? 'default' : 'outline'}
                    className={
                      recommendation === 'hold'
                        ? 'bg-yellow-600 text-white cursor-pointer'
                        : 'cursor-pointer hover:bg-yellow-100'
                    }
                    onClick={() => setRecommendation('hold')}
                  >
                    Hold/Discuss (50-69%)
                  </Badge>
                  <Badge
                    variant={recommendation === 'no-hire' ? 'default' : 'outline'}
                    className={
                      recommendation === 'no-hire'
                        ? 'bg-red-600 text-white cursor-pointer'
                        : 'cursor-pointer hover:bg-red-100'
                    }
                    onClick={() => setRecommendation('no-hire')}
                  >
                    No Hire ({'<'}50%)
                  </Badge>
                </div>
              </div>
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

