import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarIcon, User, Plus } from 'lucide-react';
import { teamMembers, employees } from '@/data/mockData';

interface InterviewScheduleTabProps {
  onChange?: (data: any) => void;
}

const InterviewScheduleTab: React.FC<InterviewScheduleTabProps> = ({ onChange }) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  // Dummy dates: today and tomorrow
  const [selectedDates, setSelectedDates] = useState<Date[]>(() => {
    const today = new Date();
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    return [today, tomorrow];
  });
  const [candidateInput, setCandidateInput] = useState('');
  // Dummy candidates
  const [candidates, setCandidates] = useState<{ name: string; email?: string }[]>(() => [
    { name: 'Alice Johnson', email: 'alice.johnson@example.com' },
    { name: 'Bob Smith', email: 'bob.smith@example.com' },
  ]);
  const interviewerList = [...teamMembers, ...employees].slice(0, 8).map((m, idx) => ({ id: String(idx + 1), name: m.name || m.employeeName || m.label || 'Interviewer', role: m.role || m.position || 'Interviewer', avatar: m.avatar || '' }));
  // Pre-select a couple of interviewers from the list as dummy selection
  const [selectedInterviewers, setSelectedInterviewers] = useState<string[]>(() => interviewerList.slice(0, 2).map(i => i.id));

  const addSelectedDate = () => {
    if (!selectedDate) return;
    const exists = selectedDates.find((d) => d.toDateString() === selectedDate.toDateString());
    if (!exists) setSelectedDates((prev) => [...prev, selectedDate]);
    setSelectedDate(undefined);
  };

  const removeDate = (d: Date) => {
    setSelectedDates((prev) => prev.filter((p) => p.toDateString() !== d.toDateString()));
  };

  const addCandidate = () => {
    const val = candidateInput.trim();
    if (!val) return;
    // allow "Name <email>" or simple name
    const match = val.match(/(.+?)\s*<(.+?)>/);
    if (match) {
      setCandidates((prev) => [...prev, { name: match[1].trim(), email: match[2].trim() }]);
    } else {
      setCandidates((prev) => [...prev, { name: val }]);
    }
    setCandidateInput('');
  };

  const toggleInterviewer = (id: string) => {
    setSelectedInterviewers((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold border-b pb-2 mb-4 border-[#DBD8E3]">Schedule Interviews</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label className="block text-sm font-medium mb-1">Pick a date</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start h-11 bg-white text-left">
                <CalendarIcon className="mr-2" />
                {selectedDate ? selectedDate.toDateString() : 'Select date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <div className="p-2">
                <Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate} initialFocus />
                <div className="mt-2 flex gap-2">
                  <Button size="sm" onClick={addSelectedDate} className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">Add Date</Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <div className="mt-4 flex flex-wrap gap-2">
            {selectedDates.map((d) => (
              <div key={d.toISOString()} className="px-3 py-1 bg-gray-100 rounded-full text-sm flex items-center gap-2">
                <span>{d.toDateString()}</span>
                <button onClick={() => removeDate(d)} className="text-sm text-red-600">×</button>
              </div>
            ))}
          </div>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium mb-1">Select Interviewers</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {interviewerList.map((iv) => (
              <button key={iv.id} type="button" onClick={() => toggleInterviewer(iv.id)} className={`p-3 rounded-lg border text-left w-full flex items-center gap-3 ${selectedInterviewers.includes(iv.id) ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-gray-200 hover:shadow-sm'}`}>
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium">{iv.name.split(' ').map(n => n[0]).join('')}</div>
                <div className="flex-1">
                  <div className="font-medium text-sm text-gray-900">{iv.name}</div>
                  <div className="text-xs text-gray-500">{iv.role}</div>
                </div>
              </button>
            ))}
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium mb-1">Selected Interviewers</label>
            <div className="flex gap-3 flex-wrap">
              {selectedInterviewers.map((id) => {
                const iv = interviewerList.find(x => x.id === id)!;
                return (
                  <div key={id} className="p-3 rounded-lg border bg-white w-full sm:w-auto flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white">{iv.name.split(' ').map(n => n[0]).join('')}</div>
                    <div>
                      <div className="font-medium text-sm">{iv.name}</div>
                      <div className="text-xs text-gray-500">{iv.role}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Add Candidates to Schedule</label>
        <div className="flex gap-2">
          <input value={candidateInput} onChange={(e) => setCandidateInput(e.target.value)} className="flex-1 px-3 py-2 border rounded-md" placeholder="Name or Name <email@example.com>" />
          <Button onClick={addCandidate} className="px-4 py-2 bg-[#352F44] text-white"><Plus className="w-4 h-4 mr-2"/>Add</Button>
        </div>
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {candidates.map((c, idx) => (
            <div key={idx} className="p-3 rounded-lg border bg-white flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium">{c.name.split(' ').map(n=>n[0]).join('')}</div>
              <div className="flex-1">
                <div className="font-medium text-sm">{c.name}</div>
                {c.email && <div className="text-xs text-gray-500">{c.email}</div>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default InterviewScheduleTab;
