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
                {(candidate as any).apiData?.gender && (
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-100 rounded-lg">
                      <User className="w-4 h-4 text-indigo-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Gender</p>
                      <p className="font-medium text-gray-900 capitalize">{(candidate as any).apiData.gender}</p>
                    </div>
                  </div>
                )}
                {(candidate as any).apiData?.dob && (
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-pink-100 rounded-lg">
                      <CalendarIcon className="w-4 h-4 text-pink-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Date of Birth</p>
                      <p className="font-medium text-gray-900">{new Date((candidate as any).apiData.dob).toLocaleDateString()}</p>
                    </div>
                  </div>
                )}
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
                    <p className="text-sm text-gray-600">Status</p>
                    <div className="mt-1">{getStageBadge(candidate.stage)}</div>
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
                {(candidate as any).apiData?.experiences?.length > 0 && (
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Briefcase className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Experience</p>
                      <p className="font-medium text-gray-900">
                        {(candidate as any).apiData.experiences[0].years_of_experience} years
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Education Details */}
          {(candidate as any).apiData?.educations?.length > 0 && (
            <Card className="border-0 shadow-lg">
              <CardHeader className="border-b bg-gradient-to-r from-gray-50 to-indigo-50">
                <CardTitle className="flex items-center gap-2">
                  <GraduationCapIcon className="w-5 h-5 text-indigo-600" />
                  Education Details
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {(candidate as any).apiData.educations.map((edu: any, index: number) => (
                    <div key={edu.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-gray-900 capitalize">{edu.education_level}</h4>
                          <p className="text-sm text-gray-600">{edu.institution_name}</p>
                        </div>
                        {edu.grades && (
                          <Badge variant="secondary" className="bg-indigo-100 text-indigo-800">
                            {edu.grades}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-700 mb-2">{edu.degree_detail}</p>
                      {(edu.start_date || edu.end_date) && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="w-3 h-3" />
                          <span>
                            {edu.start_date && new Date(edu.start_date).toLocaleDateString()}
                            {edu.start_date && edu.end_date && ' - '}
                            {edu.end_date && new Date(edu.end_date).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                      {edu.description && (
                        <p className="text-sm text-gray-600 mt-2">{edu.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Skills */}
          {candidate.topSkills.length > 0 && (
            <Card className="border-0 shadow-lg">
              <CardHeader className="border-b bg-gradient-to-r from-gray-50 to-purple-50">
                <CardTitle className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-purple-600" />
                  Skills
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
          )}

          {/* Attachments */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="border-b bg-gradient-to-r from-gray-50 to-orange-50">
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-orange-600" />
                Attachments
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="text-center py-8 text-gray-500">
                <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No attachments available</p>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-200">
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
