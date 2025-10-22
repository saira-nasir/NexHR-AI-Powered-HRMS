import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Briefcase, Clock, Eye, Star } from 'lucide-react';

export interface JobItem {
  id: string;
  title: string;
  department?: string;
  location?: string;
  postedAt?: string;
  tags?: string[];
}

const getBgColor = (dept = '') => {
  const d = (dept || '').toLowerCase();
  switch (d) {
    case 'engineering':
      return 'bg-indigo-50';
    case 'marketing':
      return 'bg-blue-50';
    case 'finance':
      return 'bg-gray-50';
    case 'design':
      return 'bg-purple-50';
    case 'human resources':
      return 'bg-red-50';
    default:
      return 'bg-[#F2F1F7]';
  }
};

const getLogoBg = (dept = '') => {
  const d = (dept || '').toLowerCase();
  switch (d) {
    case 'engineering':
      return 'bg-indigo-600 text-white';
    case 'marketing':
      return 'bg-blue-600 text-white';
    case 'finance':
      return 'bg-gray-700 text-white';
    case 'design':
      return 'bg-purple-600 text-white';
    case 'human resources':
      return 'bg-red-600 text-white';
    default:
      return 'bg-[#2A2438] text-white';
  }
};

const JobListCard: React.FC<{ jobs: JobItem[] }> = ({ jobs }) => {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {jobs.map((job) => (
        <Card key={job.id} className={`overflow-hidden border-0 shadow-sm hover:shadow-lg transition-transform transform hover:-translate-y-1 ${getBgColor(job.department)}`}>
          <div className="p-4 flex flex-col h-full">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={`flex items-center justify-center w-12 h-12 rounded-lg font-bold ${getLogoBg(job.department)}`}>
                  <Briefcase className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[#2A2438]">{job.title}</h3>
                  <p className="text-sm text-[#5C5470]">{job.department} • {job.location}</p>
                </div>
              </div>
              <div className="text-xs text-[#5C5470]">{job.postedAt}</div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {(job.tags || []).slice(0, 4).map((t, i) => (
                <Badge key={i} className="bg-white text-[#5C5470] border border-[#DBD8E3]">{t}</Badge>
              ))}
            </div>

            <div className="flex-grow" />

            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#2A2438] text-white text-sm shadow"> 
                  <Eye className="w-4 h-4" />
                  View
                </button>
                <button className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white text-sm border border-[#DBD8E3]"> 
                  <Star className="w-4 h-4 text-yellow-500" />
                  Shortlist
                </button>
              </div>

              <div className="text-sm text-[#5C5470] flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>{job.postedAt}</span>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default JobListCard;
