import { ScheduledInterview } from '@/components/hiring/InterviewCard';

export const mockScheduledInterviews: ScheduledInterview[] = [
  {
    id: '1',
    candidateName: 'Sarah Johnson',
    position: 'Senior Frontend Developer',
    interviewDate: new Date('2025-11-20'),
    interviewTime: '10:00 AM',
    interviewers: ['John Smith', 'Emily Davis'],
    interviewStage: 'first',
    interviewType: 'technical',
    status: 'pending',
    candidateEmail: 'sarah.johnson@email.com',
    candidatePhone: '+1 (555) 123-4567'
  },
  {
    id: '2',
    candidateName: 'Michael Chen',
    position: 'Product Manager',
    interviewDate: new Date('2025-11-21'),
    interviewTime: '2:00 PM',
    interviewers: ['Robert Wilson', 'Lisa Anderson', 'David Brown'],
    interviewStage: 'second',
    interviewType: 'behavioral',
    status: 'pending',
    candidateEmail: 'michael.chen@email.com',
    candidatePhone: '+1 (555) 234-5678'
  },
  {
    id: '3',
    candidateName: 'Jessica Martinez',
    position: 'Data Analyst',
    interviewDate: new Date('2025-11-18'),
    interviewTime: '11:30 AM',
    interviewers: ['Amanda White'],
    interviewStage: 'phone',
    interviewType: 'technical',
    status: 'completed',
    candidateEmail: 'jessica.martinez@email.com',
    candidatePhone: '+1 (555) 345-6789'
  },
  {
    id: '4',
    candidateName: 'David Kim',
    position: 'UX Designer',
    interviewDate: new Date('2025-11-19'),
    interviewTime: '3:30 PM',
    interviewers: ['Karen Taylor', 'Mark Johnson'],
    interviewStage: 'final',
    interviewType: 'panel',
    status: 'in-progress',
    candidateEmail: 'david.kim@email.com',
    candidatePhone: '+1 (555) 456-7890'
  },
  {
    id: '5',
    candidateName: 'Emily Rodriguez',
    position: 'Backend Engineer',
    interviewDate: new Date('2025-11-22'),
    interviewTime: '9:00 AM',
    interviewers: ['Thomas Anderson', 'Sarah Miller'],
    interviewStage: 'first',
    interviewType: 'technical',
    status: 'pending',
    candidateEmail: 'emily.rodriguez@email.com',
    candidatePhone: '+1 (555) 567-8901'
  },
  {
    id: '6',
    candidateName: 'James Wilson',
    position: 'Marketing Specialist',
    interviewDate: new Date('2025-11-23'),
    interviewTime: '1:00 PM',
    interviewers: ['Jennifer Lee'],
    interviewStage: 'second',
    interviewType: 'behavioral',
    status: 'pending',
    candidateEmail: 'james.wilson@email.com',
    candidatePhone: '+1 (555) 678-9012'
  }
];
