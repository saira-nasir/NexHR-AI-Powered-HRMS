import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  X, 
  ChevronRight, 
  Mail, 
  Phone, 
  MapPin, 
  GraduationCap, 
  FileText, 
  Calendar,
  Clock,
  CheckCircle,
  X as XIcon,
  AlertCircle,
  Star,
  Award,
  TrendingUp,
  MessageSquare,
  Download,
  Eye,
  User,
  Briefcase,
  Calendar as CalendarIcon,
  Clock as ClockIcon,
  MapPin as MapPinIcon,
  Mail as MailIcon,
  Phone as PhoneIcon,
  GraduationCap as GraduationCapIcon,
  FileText as FileTextIcon,
  ExternalLink,
  Sparkles,
  Zap,
  Target
} from 'lucide-react';
import { Candidate } from '@/data/hiringHandbookData';

interface CandidateDetailDrawerProps {
  candidate: Candidate;
  open: boolean;
  onClose: () => void;
  onAdvanceStage: (candidateId: string) => void;
}

const CandidateDetailDrawer: React.FC<CandidateDetailDrawerProps> = ({
  candidate,
  open,
  onClose,
  onAdvanceStage
}) => {
  if (!open) return null;

  const getStageBadge = (stage: string) => {
    const stageConfig = {
      applied: { label: 'Applied', color: 'bg-blue-100 text-blue-800 border-blue-200' },
      screened: { label: 'Screened', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
      assessment: { label: 'Assessment', color: 'bg-purple-100 text-purple-800 border-purple-200' },
      interview: { label: 'Interview', color: 'bg-orange-100 text-orange-800 border-orange-200' },
      offer: { label: 'Offer', color: 'bg-green-100 text-green-800 border-green-200' },
      hired: { label: 'Hired', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
      rejected: { label: 'Rejected', color: 'bg-red-100 text-red-800 border-red-200' }
    };

    const config = stageConfig[stage as keyof typeof stageConfig] || stageConfig.applied;
    return <Badge className={`${config.color} border`}>{config.label}</Badge>;
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreGradient = (score: number) => {
    if (score >= 80) return 'from-green-400 to-green-600';
    if (score >= 60) return 'from-yellow-400 to-orange-600';
    return 'from-red-400 to-red-600';
  };

  const getInterviewOutcomeIcon = (outcome: string) => {
    switch (outcome) {
      case 'passed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XIcon className="w-4 h-4 text-red-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getInterviewOutcomeColor = (outcome: string) => {
    switch (outcome) {
      case 'passed':
        return 'bg-green-50 border-green-200';
      case 'failed':
        return 'bg-red-50 border-red-200';
      case 'pending':
        return 'bg-yellow-50 border-yellow-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const canAdvance = candidate.stage !== 'hired' && candidate.stage !== 'rejected';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white rounded-xl shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                {candidate.name.charAt(0)}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{candidate.name}</h2>
                <div className="flex items-center gap-3 mt-1">
                  <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                    {candidate.appliedFor}
                  </Badge>
                  {getStageBadge(candidate.stage)}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={onClose}
                className="hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Score and Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Score Card */}
            <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-purple-50">
              <CardContent className="p-6">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <Target className="w-5 h-5 text-blue-600" />
                    <span className="text-sm font-medium text-gray-700">AI Score</span>
                  </div>
                  <div className="flex items-center justify-center gap-3 mb-4">
                    <div className={`w-16 h-2 bg-gradient-to-r ${getScoreGradient(candidate.score)} rounded-full`}></div>
                    <span className={`text-3xl font-bold ${getScoreColor(candidate.score)}`}>
                      {candidate.score}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {candidate.score >= 80 ? 'Excellent candidate' : 
                     candidate.score >= 60 ? 'Good candidate' : 'Needs review'}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="border-0 shadow-lg lg:col-span-2">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Zap className="w-5 h-5 text-orange-500" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-12 flex-col gap-1 hover:bg-blue-50 hover:text-blue-600"
                  >
                    <Mail className="w-4 h-4" />
                    <span className="text-xs">Send Email</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-12 flex-col gap-1 hover:bg-green-50 hover:text-green-600"
                  >
                    <Calendar className="w-4 h-4" />
                    <span className="text-xs">Schedule Interview</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-12 flex-col gap-1 hover:bg-purple-50 hover:text-purple-600"
                  >
                    <FileText className="w-4 h-4" />
                    <span className="text-xs">View Resume</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-12 flex-col gap-1 hover:bg-orange-50 hover:text-orange-600"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span className="text-xs">Send Message</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Information Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Contact Information */}
            <Card className="border-0 shadow-lg">
              <CardHeader className="border-b bg-gradient-to-r from-gray-50 to-blue-50">
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-600" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <MailIcon className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-medium text-gray-900">{candidate.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <PhoneIcon className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Phone</p>
                    <p className="font-medium text-gray-900">{candidate.phone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <MapPinIcon className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Location</p>
                    <p className="font-medium text-gray-900">{candidate.location}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <GraduationCapIcon className="w-4 h-4 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Education</p>
                    <p className="font-medium text-gray-900">{candidate.education}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Application Details */}
            <Card className="border-0 shadow-lg">
              <CardHeader className="border-b bg-gradient-to-r from-gray-50 to-green-50">
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-green-600" />
                  Application Details
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CalendarIcon className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Applied Date</p>
                    <p className="font-medium text-gray-900">
                      {new Date(candidate.appliedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <ClockIcon className="w-4 h-4 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Experience</p>
                    <p className="font-medium text-gray-900">{candidate.experienceYears} years</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <User className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Recruiter</p>
                    <p className="font-medium text-gray-900">{candidate.recruiter}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <FileTextIcon className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Resume</p>
                    <Button
                      variant="link"
                      size="sm"
                      className="p-0 h-auto text-blue-600 hover:text-blue-800"
                      onClick={() => window.open(candidate.resumeUrl, '_blank')}
                    >
                      View Resume <ExternalLink className="w-3 h-3 ml-1" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Skills */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="border-b bg-gradient-to-r from-gray-50 to-purple-50">
              <CardTitle className="flex items-center gap-2">
                <Star className="w-5 h-5 text-purple-600" />
                Top Skills
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex flex-wrap gap-2">
                {candidate.topSkills.map((skill, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-200"
                  >
                    {skill}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Attachments */}
          {candidate.attachments.length > 0 && (
            <Card className="border-0 shadow-lg">
              <CardHeader className="border-b bg-gradient-to-r from-gray-50 to-orange-50">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-orange-600" />
                  Attachments ({candidate.attachments.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-3">
                  {candidate.attachments.map((attachment, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="w-4 h-4 text-gray-500" />
                        <span className="font-medium text-gray-900">{attachment}</span>
                      </div>
                      <Button variant="ghost" size="sm">
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Interview History */}
          {candidate.interviewHistory.length > 0 && (
            <Card className="border-0 shadow-lg">
              <CardHeader className="border-b bg-gradient-to-r from-gray-50 to-green-50">
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-green-600" />
                  Interview History ({candidate.interviewHistory.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {candidate.interviewHistory.map((interview) => (
                    <div
                      key={interview.id}
                      className={`p-4 rounded-lg border ${getInterviewOutcomeColor(interview.outcome)}`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          {getInterviewOutcomeIcon(interview.outcome)}
                          <div>
                            <p className="font-medium text-gray-900 capitalize">
                              {interview.type} Interview
                            </p>
                            <p className="text-sm text-gray-600">
                              {new Date(interview.date).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <Badge
                          variant="secondary"
                          className={`${
                            interview.outcome === 'passed' ? 'bg-green-100 text-green-800' :
                            interview.outcome === 'failed' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {interview.outcome}
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Interviewer:</span> {interview.interviewer}
                        </p>
                        <p className="text-sm text-gray-700">{interview.notes}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          {candidate.notes && (
            <Card className="border-0 shadow-lg">
              <CardHeader className="border-b bg-gradient-to-r from-gray-50 to-yellow-50">
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-yellow-600" />
                  Notes
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <p className="text-gray-700 leading-relaxed">{candidate.notes}</p>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-200">
            {canAdvance && (
              <Button
                onClick={() => onAdvanceStage(candidate.id)}
                className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
              >
                <ChevronRight className="w-4 h-4 mr-2" />
                Advance to Next Stage
              </Button>
            )}
            <Button variant="outline" className="flex-1">
              <MessageSquare className="w-4 h-4 mr-2" />
              Send Message
            </Button>
            <Button variant="outline" className="flex-1">
              <Calendar className="w-4 h-4 mr-2" />
              Schedule Interview
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CandidateDetailDrawer;
