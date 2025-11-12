import React, { useMemo, useState } from 'react';
import DashboardLayout from '@/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search, Mail, Phone, Calendar, CheckCircle, User } from 'lucide-react';

type Candidate = {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role: string;
  startDate?: string;
  status: 'selected' | 'onboarded' | 'pending';
  note?: string;
};

const DUMMY_CANDIDATES: Candidate[] = [
  { id: 1, name: 'Aisha Khan', email: 'aisha.khan@example.com', phone: '+92 300 111 2222', role: 'Frontend Engineer', startDate: '2025-12-01', status: 'selected', note: 'Strong React + TypeScript background' },
  { id: 2, name: 'Omar Farooq', email: 'omar.farooq@example.com', phone: '+92 300 333 4444', role: 'Backend Engineer', startDate: '2025-12-08', status: 'selected', note: 'Experienced in Python & Django' },
  { id: 3, name: 'Sara Ahmed', email: 'sara.ahmed@example.com', phone: '+92 300 555 6666', role: 'Product Designer', startDate: '2025-11-24', status: 'onboarded', note: 'Design systems and Figma lead' },
  { id: 4, name: 'Bilal Hussain', email: 'bilal.hussain@example.com', phone: '+92 300 777 8888', role: 'DevOps Engineer', startDate: '2026-01-05', status: 'selected', note: 'Kubernetes & CI/CD specialist' },
  { id: 5, name: 'Maya Raza', email: 'maya.raza@example.com', phone: '+92 300 999 0000', role: 'QA Engineer', startDate: '2025-12-15', status: 'pending', note: 'Automation with Playwright' },
  { id: 6, name: 'Hamza Ali', email: 'hamza.ali@example.com', phone: '+92 301 111 2222', role: 'Data Analyst', startDate: '2025-12-20', status: 'selected', note: 'SQL, Looker and basic ML' }
];

const StatusPill: React.FC<{ status: Candidate['status'] }> = ({ status }) => {
  if (status === 'onboarded') return <Badge className="bg-green-100 text-green-800">Onboarded</Badge>;
  if (status === 'selected') return <Badge className="bg-blue-100 text-blue-800">Selected</Badge>;
  return <Badge className="bg-gray-100 text-gray-700">Pending</Badge>;
};

const Onboarding: React.FC = () => {
  const [query, setQuery] = useState('');
  const [selectedOnly, setSelectedOnly] = useState(true);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return DUMMY_CANDIDATES.filter(c => {
      if (selectedOnly && c.status !== 'selected' && c.status !== 'onboarded') return false;
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        (c.phone || '').toLowerCase().includes(q) ||
        c.role.toLowerCase().includes(q)
      );
    });
  }, [query, selectedOnly]);

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-10 space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">Onboarding — Selected Candidates</h1>
          <p className="text-sm text-gray-600 mt-1">A snapshot of candidates marked for onboarding. This is a demo list with sample data.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search by name, email, role..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10 pr-4 w-80"
            />
          </div>
          <Button variant="ghost" onClick={() => { setSelectedOnly(s => !s); }}>
            {selectedOnly ? 'Showing Selected' : 'Showing All'}
          </Button>
        </div>
      </div>

      <Card className="shadow-lg border-0">
        <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">New Joiners</CardTitle>
            <div className="text-sm text-gray-600">{filtered.length} candidate{filtered.length !== 1 ? 's' : ''} shown</div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map(c => (
              <div key={c.id} className="flex items-center gap-4 p-4 rounded-lg border hover:shadow transition">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-semibold text-lg">
                  {c.name.split(' ').map(n => n[0]).slice(0,2).join('').toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-medium text-gray-900">{c.name}</h3>
                        <div className="hidden sm:block text-sm text-gray-500">• {c.role}</div>
                      </div>
                      <div className="text-sm text-gray-500 mt-1 flex items-center gap-3">
                        <div className="flex items-center gap-1"><Mail className="w-3.5 h-3.5 text-gray-400" /> {c.email}</div>
                        <div className="hidden md:flex items-center gap-1"><Phone className="w-3.5 h-3.5 text-gray-400" /> {c.phone}</div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <div className="flex items-center gap-2">
                        <StatusPill status={c.status} />
                      </div>
                      <div className="text-xs text-gray-500 flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                        <span>{c.startDate ? new Date(c.startDate).toLocaleDateString() : 'TBD'}</span>
                      </div>
                    </div>
                  </div>
                  {c.note && <p className="text-sm text-gray-600 mt-2">{c.note}</p>}
                </div>
              </div>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <User className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium mb-2">No candidates found</p>
              <p className="text-sm">Try clearing the search or showing all candidates.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button className="bg-gradient-to-r from-green-600 to-emerald-500 text-white" onClick={() => alert('This is a demo page — onboarding flows are not wired yet')}> 
          <CheckCircle className="w-4 h-4 mr-2" />
          Bulk Mark Onboarded
        </Button>
      </div>
      </div>
    </DashboardLayout>
  );
};

export default Onboarding;
