export interface Candidate {
  id: string;
  name: string;
  appliedFor: string;
  appliedAt: string;
  stage: 'applied' | 'screened' | 'assessment' | 'interview' | 'offer' | 'hired' | 'rejected';
  score: number;
  experienceYears: number;
  topSkills: string[];
  resumeUrl: string;
  recruiter: string;
  notes: string;
  email: string;
  phone: string;
  education: string;
  location: string;
  attachments: string[];
  interviewHistory: InterviewRecord[];
}

export interface InterviewRecord {
  id: string;
  date: string;
  type: 'phone' | 'technical' | 'final';
  interviewer: string;
  notes: string;
  outcome: 'passed' | 'failed' | 'pending';
}

export interface ScreeningResult {
  candidateId: string;
  score: number;
  reasons: string[];
}

export interface AuditEntry {
  id: string;
  action: string;
  candidateId: string;
  user: string;
  timestamp: string;
  details: string;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  type: 'interview' | 'rejection' | 'offer';
}

// Mock candidates data
export const mockCandidates: Candidate[] = [
  {
    id: 'c1',
    name: 'Alice Walker',
    appliedFor: 'Frontend Engineer',
    appliedAt: '2024-12-01T09:00:00Z',
    stage: 'screened',
    score: 85,
    experienceYears: 4,
    topSkills: ['React', 'TypeScript', 'Node.js'],
    resumeUrl: 'https://example.com/resume1.pdf',
    recruiter: 'Sarah Johnson',
    notes: 'Strong technical background, good communication skills',
    email: 'alice.walker@email.com',
    phone: '+1-555-0123',
    education: 'BS Computer Science, Stanford University',
    location: 'San Francisco, CA',
    attachments: ['resume.pdf', 'cover-letter.pdf'],
    interviewHistory: [
      {
        id: 'i1',
        date: '2024-12-05T14:00:00Z',
        type: 'phone',
        interviewer: 'Sarah Johnson',
        notes: 'Good initial conversation, interested in the role',
        outcome: 'passed'
      }
    ]
  },
  {
    id: 'c2',
    name: 'Bob Chen',
    appliedFor: 'Backend Engineer',
    appliedAt: '2024-12-02T10:30:00Z',
    stage: 'assessment',
    score: 72,
    experienceYears: 6,
    topSkills: ['Python', 'Django', 'PostgreSQL'],
    resumeUrl: 'https://example.com/resume2.pdf',
    recruiter: 'Mike Davis',
    notes: 'Experienced backend developer, needs to complete coding assessment',
    email: 'bob.chen@email.com',
    phone: '+1-555-0124',
    education: 'MS Software Engineering, MIT',
    location: 'New York, NY',
    attachments: ['resume.pdf', 'portfolio.pdf'],
    interviewHistory: [
      {
        id: 'i2',
        date: '2024-12-06T15:00:00Z',
        type: 'phone',
        interviewer: 'Mike Davis',
        notes: 'Technical discussion went well, scheduled for assessment',
        outcome: 'passed'
      }
    ]
  },
  {
    id: 'c3',
    name: 'Carol Martinez',
    appliedFor: 'UX Designer',
    appliedAt: '2024-12-03T11:15:00Z',
    stage: 'interview',
    score: 91,
    experienceYears: 3,
    topSkills: ['Figma', 'Sketch', 'User Research'],
    resumeUrl: 'https://example.com/resume3.pdf',
    recruiter: 'Lisa Wang',
    notes: 'Excellent portfolio, strong user-centered design approach',
    email: 'carol.martinez@email.com',
    phone: '+1-555-0125',
    education: 'BFA Design, Parsons School',
    location: 'Austin, TX',
    attachments: ['resume.pdf', 'portfolio.pdf', 'case-studies.pdf'],
    interviewHistory: [
      {
        id: 'i3',
        date: '2024-12-07T13:00:00Z',
        type: 'phone',
        interviewer: 'Lisa Wang',
        notes: 'Great conversation about design process and portfolio',
        outcome: 'passed'
      },
      {
        id: 'i4',
        date: '2024-12-10T14:00:00Z',
        type: 'technical',
        interviewer: 'Design Team',
        notes: 'Excellent technical skills and design thinking',
        outcome: 'passed'
      }
    ]
  },
  {
    id: 'c4',
    name: 'David Kim',
    appliedFor: 'Frontend Engineer',
    appliedAt: '2024-12-04T08:45:00Z',
    stage: 'applied',
    score: 45,
    experienceYears: 1,
    topSkills: ['JavaScript', 'HTML', 'CSS'],
    resumeUrl: 'https://example.com/resume4.pdf',
    recruiter: 'Sarah Johnson',
    notes: 'Junior developer, needs more experience',
    email: 'david.kim@email.com',
    phone: '+1-555-0126',
    education: 'BS Computer Science, UC Berkeley',
    location: 'Seattle, WA',
    attachments: ['resume.pdf'],
    interviewHistory: []
  },
  {
    id: 'c5',
    name: 'Emma Thompson',
    appliedFor: 'Product Manager',
    appliedAt: '2024-12-05T12:00:00Z',
    stage: 'offer',
    score: 88,
    experienceYears: 5,
    topSkills: ['Product Strategy', 'Data Analysis', 'Agile'],
    resumeUrl: 'https://example.com/resume5.pdf',
    recruiter: 'Alex Rodriguez',
    notes: 'Strong product sense, excellent track record',
    email: 'emma.thompson@email.com',
    phone: '+1-555-0127',
    education: 'MBA, Harvard Business School',
    location: 'Boston, MA',
    attachments: ['resume.pdf', 'case-studies.pdf'],
    interviewHistory: [
      {
        id: 'i5',
        date: '2024-12-08T10:00:00Z',
        type: 'phone',
        interviewer: 'Alex Rodriguez',
        notes: 'Great initial conversation about product vision',
        outcome: 'passed'
      },
      {
        id: 'i6',
        date: '2024-12-11T14:00:00Z',
        type: 'technical',
        interviewer: 'Product Team',
        notes: 'Excellent product thinking and technical understanding',
        outcome: 'passed'
      },
      {
        id: 'i7',
        date: '2024-12-12T15:00:00Z',
        type: 'final',
        interviewer: 'CTO',
        notes: 'Final interview with leadership team',
        outcome: 'passed'
      }
    ]
  },
  {
    id: 'c6',
    name: 'Frank Wilson',
    appliedFor: 'DevOps Engineer',
    appliedAt: '2024-12-06T09:30:00Z',
    stage: 'rejected',
    score: 38,
    experienceYears: 2,
    topSkills: ['Docker', 'Kubernetes', 'AWS'],
    resumeUrl: 'https://example.com/resume6.pdf',
    recruiter: 'Mike Davis',
    notes: 'Skills don\'t match requirements, rejected after screening',
    email: 'frank.wilson@email.com',
    phone: '+1-555-0128',
    education: 'BS Information Technology, Georgia Tech',
    location: 'Atlanta, GA',
    attachments: ['resume.pdf'],
    interviewHistory: []
  }
];

// Mock screening results
export const mockScreeningResults: ScreeningResult[] = [
  {
    candidateId: 'c1',
    score: 85,
    reasons: ['Skill match: React, TypeScript', '4 years experience', 'Strong education background']
  },
  {
    candidateId: 'c2',
    score: 72,
    reasons: ['Skill match: Python, Django', '6 years experience', 'Relevant education']
  },
  {
    candidateId: 'c3',
    score: 91,
    reasons: ['Skill match: Figma, User Research', '3 years experience', 'Excellent portfolio']
  },
  {
    candidateId: 'c4',
    score: 45,
    reasons: ['Basic skills only', '1 year experience', 'Junior level']
  },
  {
    candidateId: 'c5',
    score: 88,
    reasons: ['Skill match: Product Strategy, Data Analysis', '5 years experience', 'Top-tier education']
  },
  {
    candidateId: 'c6',
    score: 38,
    reasons: ['Limited relevant experience', '2 years experience', 'Skills mismatch']
  }
];

// Mock audit log
export const mockAuditLog: AuditEntry[] = [
  {
    id: 'a1',
    action: 'screening_run',
    candidateId: 'c1',
    user: 'Sarah Johnson',
    timestamp: '2024-12-07T10:00:00Z',
    details: 'Ran AI screening for Frontend Engineer position'
  },
  {
    id: 'a2',
    action: 'stage_advance',
    candidateId: 'c1',
    user: 'Sarah Johnson',
    timestamp: '2024-12-07T11:00:00Z',
    details: 'Advanced from applied to screened stage'
  },
  {
    id: 'a3',
    action: 'manual_override',
    candidateId: 'c3',
    user: 'Lisa Wang',
    timestamp: '2024-12-08T14:00:00Z',
    details: 'Boosted score due to exceptional portfolio'
  },
  {
    id: 'a4',
    action: 'interview_scheduled',
    candidateId: 'c2',
    user: 'Mike Davis',
    timestamp: '2024-12-09T09:00:00Z',
    details: 'Scheduled technical interview for Dec 12'
  }
];

// Mock email templates
export const mockEmailTemplates: EmailTemplate[] = [
  {
    id: 't1',
    name: 'Interview Invitation',
    subject: 'Interview Invitation - {Company Name}',
    body: 'Dear {Candidate Name},\n\nThank you for your interest in the {Position} role at {Company Name}. We would like to invite you for an interview.\n\nDate: {Interview Date}\nTime: {Interview Time}\nLocation: {Interview Location}\n\nPlease confirm your availability.\n\nBest regards,\n{Recruiter Name}',
    type: 'interview'
  },
  {
    id: 't2',
    name: 'Rejection Letter',
    subject: 'Application Update - {Company Name}',
    body: 'Dear {Candidate Name},\n\nThank you for your interest in the {Position} role at {Company Name}. After careful consideration, we have decided to move forward with other candidates.\n\nWe appreciate your time and wish you the best in your future endeavors.\n\nBest regards,\n{Recruiter Name}',
    type: 'rejection'
  },
  {
    id: 't3',
    name: 'Job Offer',
    subject: 'Job Offer - {Company Name}',
    body: 'Dear {Candidate Name},\n\nWe are pleased to offer you the position of {Position} at {Company Name}.\n\nSalary: {Salary}\nStart Date: {Start Date}\nBenefits: {Benefits}\n\nPlease review the attached offer letter and respond within 5 business days.\n\nWe look forward to having you join our team!\n\nBest regards,\n{Recruiter Name}',
    type: 'offer'
  }
];

// Mock API functions
export const mockApi = {
  getCandidates: async (): Promise<Candidate[]> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    return mockCandidates;
  },

  runScreening: async (jobId: string, weights: any, threshold: number): Promise<{ screeningId: string; results: ScreeningResult[] }> => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return {
      screeningId: 's1',
      results: mockScreeningResults
    };
  },

  advanceCandidate: async (candidateId: string): Promise<Candidate> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    const candidate = mockCandidates.find(c => c.id === candidateId);
    if (!candidate) throw new Error('Candidate not found');
    
    // Update stage
    const stages = ['applied', 'screened', 'assessment', 'interview', 'offer', 'hired'];
    const currentIndex = stages.indexOf(candidate.stage);
    if (currentIndex < stages.length - 1) {
      candidate.stage = stages[currentIndex + 1] as any;
    }
    
    return candidate;
  },

  overrideCandidate: async (candidateId: string, action: 'boost' | 'reject', reason: string): Promise<{ success: boolean }> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Add to audit log
    mockAuditLog.unshift({
      id: `a${Date.now()}`,
      action: 'manual_override',
      candidateId,
      user: 'Current User',
      timestamp: new Date().toISOString(),
      details: `${action}: ${reason}`
    });
    
    return { success: true };
  },

  getAuditLog: async (): Promise<AuditEntry[]> => {
    await new Promise(resolve => setTimeout(resolve, 200));
    return mockAuditLog;
  },

  getEmailTemplates: async (): Promise<EmailTemplate[]> => {
    await new Promise(resolve => setTimeout(resolve, 200));
    return mockEmailTemplates;
  },

  updateEmailTemplate: async (templateId: string, updates: Partial<EmailTemplate>): Promise<EmailTemplate> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    const template = mockEmailTemplates.find(t => t.id === templateId);
    if (!template) throw new Error('Template not found');
    
    Object.assign(template, updates);
    return template;
  },

  sendEmail: async (templateId: string, candidateId: string): Promise<{ success: boolean }> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Add to audit log
    mockAuditLog.unshift({
      id: `a${Date.now()}`,
      action: 'email_sent',
      candidateId,
      user: 'Current User',
      timestamp: new Date().toISOString(),
      details: `Sent email using template ${templateId}`
    });
    
    return { success: true };
  }
};
