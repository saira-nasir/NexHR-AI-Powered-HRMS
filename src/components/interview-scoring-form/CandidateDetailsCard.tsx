import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Briefcase, 
  GraduationCap, 
  Calendar,
  Award,
  FileText,
  Link as LinkIcon
} from 'lucide-react';

interface CandidateDetailsCardProps {
  candidateName: string;
  positionAppliedFor: string;
  candidateEmail?: string;
  candidatePhone?: string;
  location?: string;
  experience?: string;
  education?: string[];
  skills?: string[];
  resumeUrl?: string;
  appliedDate?: Date;
  matchScore?: number;
}

export const CandidateDetailsCard: React.FC<CandidateDetailsCardProps> = ({
  candidateName,
  positionAppliedFor,
  candidateEmail = 'candidate@email.com',
  candidatePhone = '+1 (555) 000-0000',
  location = 'Not specified',
  experience = '3+ years',
  education = ['Bachelor\'s Degree in Computer Science', 'Master\'s in Software Engineering'],
  skills = ['JavaScript', 'React', 'TypeScript', 'Node.js', 'Python', 'SQL', 'Git', 'AWS'],
  resumeUrl,
  appliedDate = new Date(),
  matchScore = 85,
}) => {
  return (
    <Card className="border-2 border-indigo-100">
      <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
              {candidateName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
            </div>
            <div>
              <CardTitle className="text-2xl font-bold text-gray-900 mb-1">
                {candidateName}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-indigo-600" />
                <span className="text-lg text-gray-700 font-medium">{positionAppliedFor}</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge className="bg-green-100 text-green-700 border-green-200 text-sm px-3 py-1">
              {matchScore}% Match
            </Badge>
            <span className="text-xs text-gray-500">
              Applied: {appliedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <User className="h-5 w-5 text-indigo-600" />
              Contact Information
            </h3>
            <div className="space-y-3 pl-7">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-700">{candidateEmail}</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-700">{candidatePhone}</span>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-700">{location}</span>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-700">Experience: {experience}</span>
              </div>
            </div>
          </div>

          {/* Resume & Documents */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <FileText className="h-5 w-5 text-indigo-600" />
              Documents
            </h3>
            <div className="pl-7">
              {resumeUrl ? (
                <a
                  href={resumeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg transition-colors border border-indigo-200"
                >
                  <LinkIcon className="h-4 w-4" />
                  <span className="text-sm font-medium">View Resume</span>
                </a>
              ) : (
                <p className="text-sm text-gray-500">No resume uploaded</p>
              )}
            </div>
          </div>
        </div>

        {/* Education */}
        <div className="mt-6 pt-6 border-t">
          <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-indigo-600" />
            Education
          </h3>
          <div className="pl-7 space-y-2">
            {education.map((edu, index) => (
              <div key={index} className="flex items-start gap-2">
                <div className="w-2 h-2 rounded-full bg-indigo-600 mt-2 flex-shrink-0" />
                <span className="text-sm text-gray-700">{edu}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Skills */}
        <div className="mt-6 pt-6 border-t">
          <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Award className="h-5 w-5 text-indigo-600" />
            Skills & Technologies
          </h3>
          <div className="pl-7">
            <div className="flex flex-wrap gap-2">
              {skills.map((skill, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="bg-indigo-50 text-indigo-700 border-indigo-200 px-3 py-1"
                >
                  {skill}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
