import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { Plus, X, Trash2, Upload, FileText, Calendar as CalendarIcon } from 'lucide-react';
import { applicationService } from '@/services/jobPortalservice';
import RequiredSkillsField from '@/components/job-post/RequiredSkillsField';
import { RequiredSkill } from '@/services/JobService';
import type { StylesConfig } from 'react-select';
import { DateTimePicker } from '@/components/ui/datetime-picker';
import { format } from 'date-fns';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';

interface Experience {
    years_of_experience: number | '';
    previous_job_titles: string;
    company_name: string;
}

interface Education {
    education_level: string;
    institution_name: string;
    degree_detail: string;
    grades: string;
    start_date: string;
    end_date: string;
    description: string;
}

const JobApplicationForm: React.FC = () => {
    const { jobId: routeJobId } = useParams<{ jobId: string }>();

    // Helper to parse date string into a local Date object to avoid UTC off-by-one issues
    const parseDateStringToLocal = (dateStr: string) => {
        if (!dateStr) return undefined;
        // Split YYYY-MM-DD and create local date
        const [year, month, day] = dateStr.split('-').map(Number);
        if (year && month && day) {
            return new Date(year, month - 1, day);
        }
        return new Date(dateStr);
    };


    const [formData, setFormData] = useState({
        candidate_fname: '',
        candidate_lname: '',
        email: '',
        phone: '',
        status: 'pending',
        gender: '',
        address: '',
        dob: '',
        resume_file: null as File | null,
        skills: [] as RequiredSkill[],
        experiences: [
            { years_of_experience: '', previous_job_titles: '', company_name: '' } as Experience,
        ],
        educations: [
            {
                education_level: '',
                institution_name: '',
                degree_detail: '',
                grades: '',
                start_date: '',
                end_date: '',
                description: '',
            } as Education,
        ],
    });

    const [jobSchema, setJobSchema] = useState<Record<string, boolean> | null>(null);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const show = (key: string) => {
        if (!jobSchema) return true;
        return Boolean((jobSchema as any)[key]);
    };

    useEffect(() => {
        const fetchSchema = async () => {
            try {
                if (!routeJobId) return;
                const baseApi = import.meta.env.VITE_API_URL
                    ? String(import.meta.env.VITE_API_URL).replace(/\/$/, '')
                    : 'http://127.0.0.1:8000/api';
                const token = localStorage.getItem('access_token');
                const res = await fetch(`${baseApi}/jobs/${routeJobId}/`, {
                    headers: {
                        'Content-Type': 'application/json',
                        ...(token ? { Authorization: `Bearer ${token}` } : {}),
                    },
                });
                if (!res.ok) return;
                const data = await res.json();
                let schema = data.job_schema || data.jobSchema || data.application_form || null;
                if (!schema && data.job_schema === undefined && data.jobSchema === undefined) {
                    schema = {
                        dob: data.dob ?? false,
                        name: data.name ?? false,
                        email: data.email ?? false,
                        phone: data.phone ?? false,
                        gender: data.gender ?? false,
                        skills: data.skills ?? false,
                        address: data.address ?? false,
                        education: data.education ?? false,
                        experience: data.experience ?? false,
                        resume_url: data.resume_url ?? false,
                        cover_letter_url: data.cover_letter_url ?? false,
                    };
                }
                if (typeof schema === 'string') {
                    try {
                        schema = JSON.parse(schema);
                    } catch (err) {
                        schema = null;
                    }
                }
                setJobSchema(schema || null);
            } catch (err) {
                console.error('Failed to fetch job schema', err);
            }
        };
        fetchSchema();
    }, [routeJobId]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] ?? null;
        setFormData(prev => ({ ...prev, resume_file: file }));
        if (errors.resume_file) setErrors(prev => ({ ...prev, resume_file: '' }));
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        const file = e.dataTransfer.files?.[0] ?? null;
        if (file) setFormData(prev => ({ ...prev, resume_file: file }));
    };

    const handleSkillsChange = (skills: RequiredSkill[]) => {
        setFormData(prev => ({ ...prev, skills }));
        if (errors.skills) setErrors(prev => ({ ...prev, skills: '' }));
    };

    const addExperience = () =>
        setFormData(prev => ({ ...prev, experiences: [...prev.experiences, { years_of_experience: '', previous_job_titles: '', company_name: '' }] }));
    const removeExperience = (i: number) =>
        setFormData(prev => ({ ...prev, experiences: prev.experiences.filter((_, idx) => idx !== i) }));
    const updateExperience = (i: number, field: keyof Experience, value: any) =>
        setFormData(prev => ({ ...prev, experiences: prev.experiences.map((exp, idx) => (idx === i ? { ...exp, [field]: value } : exp)) }));

    const addEducation = () =>
        setFormData(prev => ({ ...prev, educations: [...prev.educations, { education_level: '', institution_name: '', degree_detail: '', grades: '', start_date: '', end_date: '', description: '' }] }));
    const removeEducation = (i: number) =>
        setFormData(prev => ({ ...prev, educations: prev.educations.filter((_, idx) => idx !== i) }));
    const getEducationDuration = (educationLevel: string): number => {
        switch (educationLevel) {
            case 'High School':
                return 2;
            case 'Associate Degree':
                return 2;
            case "Bachelor's Degree":
                return 4;
            case "Master's Degree":
                return 2;
            case 'Doctorate':
                return 4;
            default:
                return 0;
        }
    };

    const updateEducation = (i: number, field: keyof Education, value: any) => {
        setFormData(prev => {
            const updatedEducations = prev.educations.map((ed, idx) => (idx === i ? { ...ed, [field]: value } : ed));

            // Clear date-related errors when dates are updated
            if (field === 'start_date' || field === 'end_date' || field === 'education_level') {
                setErrors(prevErrors => {
                    const newErrors = { ...prevErrors };
                    delete newErrors[`education_${i}_dates`];
                    return newErrors;
                });
            }

            return { ...prev, educations: updatedEducations };
        });
    };

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        if (show('name')) {
            if (!formData.candidate_fname.trim()) newErrors.candidate_fname = 'First name is required';
            if (!formData.candidate_lname.trim()) newErrors.candidate_lname = 'Last name is required';
        }

        if (show('email') && !formData.email.trim()) newErrors.email = 'Email is required';

        if (show('phone')) {
            if (!formData.phone.trim()) {
                newErrors.phone = 'Phone is required';
            } else {
                // Phone validation: must be 10-15 digits, can include + and spaces
                const phoneRegex = /^\+?[\d\s-]{10,15}$/;
                if (!phoneRegex.test(formData.phone)) {
                    newErrors.phone = 'Phone must be 10-15 digits (can include + and spaces)';
                }
            }
        }

        if (show('gender') && !formData.gender) newErrors.gender = 'Gender is required';
        if (show('address') && !formData.address.trim()) newErrors.address = 'Address is required';

        if (show('dob')) {
            if (!formData.dob) {
                newErrors.dob = 'Date of birth is required';
            } else {
                // Check if user is at least 18 years old
                const today = new Date();
                const birthDate = new Date(formData.dob);
                let age = today.getFullYear() - birthDate.getFullYear();
                const monthDiff = today.getMonth() - birthDate.getMonth();
                if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                    age--;
                }
                if (age < 18) {
                    newErrors.dob = 'You must be at least 18 years old';
                }
            }
        }

        if (show('resume_url') && !formData.resume_file) newErrors.resume_file = 'Resume is required';

        if (formData.email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(formData.email)) newErrors.email = 'Invalid email';
        }

        if (show('skills')) {
            const validSkills = formData.skills.filter(s => (s as any)?.name?.toString?.().trim?.());
            if (validSkills.length === 0) newErrors.skills = 'At least one skill is required';
        }

        if (show('experience')) {
            formData.experiences.forEach((exp, index) => {
                if (typeof exp.years_of_experience === 'number' && exp.years_of_experience < 0) {
                    newErrors[`experience_${index}_years`] = 'Years cannot be negative';
                }
                if (exp.previous_job_titles && /\d/.test(exp.previous_job_titles)) {
                    newErrors[`experience_${index}_title`] = 'Job title should not contain numbers';
                }
                if (exp.company_name && /\d/.test(exp.company_name)) {
                    newErrors[`experience_${index}_company`] = 'Company name should not contain numbers';
                }
            });
            const validExp = formData.experiences.filter(e => typeof e.years_of_experience === 'number' && e.years_of_experience >= 0 && e.previous_job_titles.trim() && e.company_name.trim());
            if (validExp.length === 0) newErrors.experiences = 'At least one valid experience is required';
        }

        if (show('education')) {
            formData.educations.forEach((edu, index) => {
                if (edu.institution_name && /\d/.test(edu.institution_name)) {
                    newErrors[`education_${index}_institution`] = 'Institution name should not contain numbers';
                }
                if (edu.degree_detail && /\d/.test(edu.degree_detail)) {
                    newErrors[`education_${index}_degree`] = 'Degree detail should not contain numbers';
                }
                if (edu.grades) {
                    // CGPA validation: must be a number with optional decimal, between 0 and 4 or 0 and 10
                    const cgpaRegex = /^(\d{1,2}(\.\d{1,2})?)$/;
                    if (!cgpaRegex.test(edu.grades)) {
                        newErrors[`education_${index}_grades`] = 'Grades must be a valid CGPA (e.g., 3.89)';
                    } else {
                        const cgpa = parseFloat(edu.grades);
                        if (cgpa < 0 || cgpa > 10) {
                            newErrors[`education_${index}_grades`] = 'CGPA must be between 0 and 10';
                        }
                    }
                }

                // Validate education duration based on education level
                if (edu.education_level && edu.start_date && edu.end_date) {
                    const startDate = new Date(edu.start_date);
                    const endDate = new Date(edu.end_date);
                    const yearsDiff = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
                    const minYears = getEducationDuration(edu.education_level);

                    if (endDate <= startDate) {
                        newErrors[`education_${index}_dates`] = 'End date must be after start date';
                    } else if (minYears > 0 && yearsDiff < minYears) {
                        newErrors[`education_${index}_dates`] = `${edu.education_level} requires minimum ${minYears} years (current: ${yearsDiff.toFixed(1)} years)`;
                    }
                }
            });
            const validEdu = formData.educations.filter(e => e.education_level.trim() && e.institution_name.trim() && e.degree_detail.trim());
            if (validEdu.length === 0) newErrors.educations = 'At least one valid education is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) {
            toast({ title: 'Validation Error', description: 'Please check the form', variant: 'destructive' });
            return;
        }

        setIsSubmitting(true);
        try {
            const normalizedSkills = formData.skills.map(s => (s as any).id ? { id: (s as any).id, name: (s as any).name } : { name: (s as any).name });
            const payload = {
                job: routeJobId ? parseInt(routeJobId) : 0,
                candidate_fname: formData.candidate_fname,
                candidate_lname: formData.candidate_lname,
                email: formData.email,
                phone: formData.phone,
                status: formData.status,
                gender: formData.gender,
                address: formData.address,
                dob: formData.dob ? String(formData.dob).split('T')[0] : '',
                skills: normalizedSkills,
                experiences: formData.experiences,
                educations: formData.educations,
            };

            const fd = new FormData();
            fd.append('job', String(payload.job));
            fd.append('candidate_fname', payload.candidate_fname);
            fd.append('candidate_lname', payload.candidate_lname);
            fd.append('email', payload.email);
            fd.append('phone', payload.phone);
            fd.append('status', payload.status);
            fd.append('gender', payload.gender);
            fd.append('address', payload.address);
            fd.append('dob', payload.dob);
            fd.append('skills', JSON.stringify(payload.skills));
            fd.append('experiences', JSON.stringify(payload.experiences));
            fd.append('educations', JSON.stringify(payload.educations));
            if (formData.resume_file) fd.append('resume', formData.resume_file);

            // Submit to /api/applications/ with job ID as FormData field
            const response = await applicationService.submitApplication(fd);
            if (response.success) {
                toast({ title: 'Success', description: response.message || 'Application submitted' });
                setFormData({
                    candidate_fname: '',
                    candidate_lname: '',
                    email: '',
                    phone: '',
                    status: 'pending',
                    gender: '',
                    address: '',
                    dob: '',
                    resume_file: null,
                    skills: [],
                    experiences: [{ years_of_experience: '', previous_job_titles: '', company_name: '' }],
                    educations: [{ education_level: '', institution_name: '', degree_detail: '', grades: '', start_date: '', end_date: '', description: '' }],
                });
            } else {
                toast({ title: 'Error', description: response.message || 'Failed to submit', variant: 'destructive' });
                if (response.errorData && typeof response.errorData === 'object') {
                    const newErrs: Record<string, string> = {};
                    for (const k of Object.keys(response.errorData)) {
                        const val = response.errorData[k];
                        newErrs[k] = Array.isArray(val) ? val.join(' ') : String(val);
                    }
                    setErrors(prev => ({ ...prev, ...newErrs }));
                }
            }
        } catch (err: any) {
            console.error(err);
            toast({ title: 'Error', description: err?.message || 'Failed to submit', variant: 'destructive' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const selectStyles: StylesConfig<any, boolean> = {} as any;

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Job Application</h1>
                    <p className="mt-2 text-gray-600">Please fill out the form below to apply for the position</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Personal Information */}
                    <div className="bg-gray-50 p-6 rounded-lg">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">Personal Information</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {show('name') && (
                                <>
                                    <div>
                                        <Label htmlFor="candidate_fname" className="block text-sm font-medium text-gray-700">First Name *</Label>
                                        <Input id="candidate_fname" name="candidate_fname" value={formData.candidate_fname} onChange={handleChange} className={`mt-1 block w-full`} placeholder="Enter your first name" />
                                        {errors.candidate_fname && <p className="mt-1 text-sm text-red-600">{errors.candidate_fname}</p>}
                                    </div>

                                    <div>
                                        <Label htmlFor="candidate_lname" className="block text-sm font-medium text-gray-700">Last Name *</Label>
                                        <Input id="candidate_lname" name="candidate_lname" value={formData.candidate_lname} onChange={handleChange} className={`mt-1 block w-full`} placeholder="Enter your last name" />
                                        {errors.candidate_lname && <p className="mt-1 text-sm text-red-600">{errors.candidate_lname}</p>}
                                    </div>
                                </>
                            )}

                            {show('email') && (
                                <div>
                                    <Label htmlFor="email" className="block text-sm font-medium text-gray-700">Email Address *</Label>
                                    <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} className={`mt-1 block w-full`} placeholder="Enter your email address" />
                                    {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                                </div>
                            )}

                            {show('phone') && (
                                <div>
                                    <Label htmlFor="phone" className="block text-sm font-medium text-gray-700">Phone Number *</Label>
                                    <Input id="phone" name="phone" type="tel" value={formData.phone} onChange={handleChange} className={`mt-1 block w-full`} placeholder="Enter your phone number" />
                                    {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
                                </div>
                            )}

                            {show('gender') && (
                                <div>
                                    <Label htmlFor="gender" className="block text-sm font-medium text-gray-700">Gender *</Label>
                                    <Select value={formData.gender} onValueChange={(value) => {
                                        setFormData(prev => ({ ...prev, gender: value }));
                                        if (errors.gender) setErrors(prev => ({ ...prev, gender: '' }));
                                    }}>
                                        <SelectTrigger className={`mt-1 ${errors.gender ? 'border-red-500' : ''}`}>
                                            <SelectValue placeholder="Select gender" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="male">Male</SelectItem>
                                            <SelectItem value="female">Female</SelectItem>
                                            <SelectItem value="other">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {errors.gender && <p className="mt-1 text-sm text-red-600">{errors.gender}</p>}
                                </div>
                            )}

                            {show('dob') && (
                                <div>
                                    <Label htmlFor="dob" className="block text-sm font-medium text-gray-700">Date of Birth *</Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant={"outline"}
                                                className={cn(
                                                    "w-full justify-start text-left font-normal mt-1",
                                                    !formData.dob && "text-muted-foreground",
                                                    errors.dob && "border-red-500"
                                                )}
                                            >
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {formData.dob ? format(parseDateStringToLocal(formData.dob)!, "PPP") : <span>Pick a date</span>}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar
                                                mode="single"
                                                selected={parseDateStringToLocal(formData.dob)}
                                                onSelect={(date) => {
                                                    if (date) {
                                                        const formatted = format(date, 'yyyy-MM-dd');
                                                        setFormData(prev => ({ ...prev, dob: formatted }));
                                                        if (errors.dob) setErrors(prev => ({ ...prev, dob: '' }));
                                                    }
                                                }}
                                                disabled={(date) => {
                                                    // Disable future dates and dates less than 18 years ago
                                                    const today = new Date();
                                                    const eighteenYearsAgo = new Date();
                                                    eighteenYearsAgo.setFullYear(today.getFullYear() - 18);
                                                    return date > eighteenYearsAgo || date > today;
                                                }}
                                                defaultMonth={(() => {
                                                    const eighteenYearsAgo = new Date();
                                                    eighteenYearsAgo.setFullYear(eighteenYearsAgo.getFullYear() - 18);
                                                    return eighteenYearsAgo;
                                                })()}
                                                captionLayout="dropdown-buttons"
                                                fromYear={1950}
                                                toYear={new Date().getFullYear() - 18}
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
                                    {errors.dob && <p className="mt-1 text-sm text-red-600">{errors.dob}</p>}
                                </div>
                            )}
                        </div>

                        {show('address') && (
                            <div className="mt-4">
                                <Label htmlFor="address" className="block text-sm font-medium text-gray-700">Address *</Label>
                                <Textarea id="address" name="address" value={formData.address} onChange={handleChange} className={`mt-1 block w-full`} rows={3} placeholder="Enter your full address" />
                                {errors.address && <p className="mt-1 text-sm text-red-600">{errors.address}</p>}
                            </div>
                        )}
                    </div>

                    {show('skills') && (
                        <div className="bg-gray-50 p-6 rounded-lg">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h2 className="text-xl font-semibold text-gray-900">Skills</h2>
                                    <p className="text-sm text-gray-600 mt-1">Add your technical and professional skills</p>
                                </div>
                            </div>

                            <RequiredSkillsField value={formData.skills} onChange={handleSkillsChange} validationError={errors.skills} selectStyles={selectStyles} />
                        </div>
                    )}

                    {show('experience') && (
                        <div className="bg-gray-50 p-6 rounded-lg">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h2 className="text-xl font-semibold text-gray-900">Work Experience</h2>
                                    <p className="text-sm text-gray-600 mt-1">List your relevant work experience</p>
                                </div>
                                <Button type="button" onClick={addExperience} variant="outline" size="sm" className="flex items-center gap-2">
                                    <Plus size={16} /> Add Experience
                                </Button>
                            </div>

                            {formData.experiences.map((exp, index) => (
                                <div key={index} className="border border-gray-200 p-4 rounded-lg mb-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="font-medium text-gray-900">Experience {index + 1}</h3>
                                        {formData.experiences.length > 1 && (
                                            <Button type="button" onClick={() => removeExperience(index)} variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                                                <Trash2 size={16} />
                                            </Button>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <Label className="block text-sm font-medium text-gray-700">Years of Experience *</Label>
                                            <Input
                                                type="number"
                                                step="0.5"
                                                min="0"
                                                value={exp.years_of_experience === '' ? '' : exp.years_of_experience}
                                                onChange={e => {
                                                    const value = e.target.value === '' ? '' : parseFloat(e.target.value);
                                                    updateExperience(index, 'years_of_experience', value);
                                                    if (errors[`experience_${index}_years`]) {
                                                        setErrors(prev => {
                                                            const newErrors = { ...prev };
                                                            delete newErrors[`experience_${index}_years`];
                                                            return newErrors;
                                                        });
                                                    }
                                                }}
                                                onKeyDown={(e) => {
                                                    if (['-', 'e', 'E'].includes(e.key)) {
                                                        e.preventDefault();
                                                    }
                                                }}
                                                className={`mt-1 ${errors[`experience_${index}_years`] ? 'border-red-500' : ''}`}
                                                placeholder="e.g., 3.5"
                                            />
                                            {errors[`experience_${index}_years`] && <p className="mt-1 text-sm text-red-600">{errors[`experience_${index}_years`]}</p>}
                                        </div>
                                        <div>
                                            <Label className="block text-sm font-medium text-gray-700">Job Title *</Label>
                                            <Input
                                                value={exp.previous_job_titles}
                                                onChange={e => {
                                                    updateExperience(index, 'previous_job_titles', e.target.value);
                                                    if (errors[`experience_${index}_title`]) {
                                                        setErrors(prev => {
                                                            const newErrors = { ...prev };
                                                            delete newErrors[`experience_${index}_title`];
                                                            return newErrors;
                                                        });
                                                    }
                                                }}
                                                onKeyDown={(e) => {
                                                    // Prevent numbers from being typed
                                                    if (/\d/.test(e.key) && !e.ctrlKey && !e.metaKey) {
                                                        e.preventDefault();
                                                    }
                                                }}
                                                className={`mt-1 ${errors[`experience_${index}_title`] ? 'border-red-500' : ''}`}
                                                placeholder="e.g., Software Engineer"
                                            />
                                            {errors[`experience_${index}_title`] && <p className="mt-1 text-sm text-red-600">{errors[`experience_${index}_title`]}</p>}
                                        </div>
                                        <div>
                                            <Label className="block text-sm font-medium text-gray-700">Company Name *</Label>
                                            <Input
                                                value={exp.company_name}
                                                onChange={e => {
                                                    updateExperience(index, 'company_name', e.target.value);
                                                    if (errors[`experience_${index}_company`]) {
                                                        setErrors(prev => {
                                                            const newErrors = { ...prev };
                                                            delete newErrors[`experience_${index}_company`];
                                                            return newErrors;
                                                        });
                                                    }
                                                }}
                                                onKeyDown={(e) => {
                                                    // Prevent numbers from being typed
                                                    if (/\d/.test(e.key) && !e.ctrlKey && !e.metaKey) {
                                                        e.preventDefault();
                                                    }
                                                }}
                                                className={`mt-1 ${errors[`experience_${index}_company`] ? 'border-red-500' : ''}`}
                                                placeholder="e.g., TechCorp"
                                            />
                                            {errors[`experience_${index}_company`] && <p className="mt-1 text-sm text-red-600">{errors[`experience_${index}_company`]}</p>}
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {errors.experiences && <p className="mt-1 text-sm text-red-600">{errors.experiences}</p>}
                        </div>
                    )}

                    {show('education') && (
                        <div className="bg-gray-50 p-6 rounded-lg">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h2 className="text-xl font-semibold text-gray-900">Education</h2>
                                    <p className="text-sm text-gray-600 mt-1">List your educational background</p>
                                </div>
                                <Button type="button" onClick={addEducation} variant="outline" size="sm" className="flex items-center gap-2">
                                    <Plus size={16} /> Add Education
                                </Button>
                            </div>

                            {formData.educations.map((edu, index) => (
                                <div key={index} className="border border-gray-200 p-4 rounded-lg mb-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="font-medium text-gray-900">Education {index + 1}</h3>
                                        {formData.educations.length > 1 && (
                                            <Button type="button" onClick={() => removeEducation(index)} variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                                                <Trash2 size={16} />
                                            </Button>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <Label className="block text-sm font-medium text-gray-700">Education Level *</Label>
                                            <Select
                                                value={edu.education_level}
                                                onValueChange={(value) => updateEducation(index, 'education_level', value)}
                                            >
                                                <SelectTrigger className="mt-1">
                                                    <SelectValue placeholder="Select Education Level" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="High School">High School</SelectItem>
                                                    <SelectItem value="Associate Degree">Associate Degree</SelectItem>
                                                    <SelectItem value="Bachelor's Degree">Bachelor's Degree</SelectItem>
                                                    <SelectItem value="Master's Degree">Master's Degree</SelectItem>
                                                    <SelectItem value="Doctorate">Doctorate</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div>
                                            <Label className="block text-sm font-medium text-gray-700">Institution Name *</Label>
                                            <Input
                                                value={edu.institution_name}
                                                onChange={e => {
                                                    updateEducation(index, 'institution_name', e.target.value);
                                                    if (errors[`education_${index}_institution`]) {
                                                        setErrors(prev => {
                                                            const newErrors = { ...prev };
                                                            delete newErrors[`education_${index}_institution`];
                                                            return newErrors;
                                                        });
                                                    }
                                                }}
                                                onKeyDown={(e) => {
                                                    // Prevent numbers from being typed
                                                    if (/\d/.test(e.key) && !e.ctrlKey && !e.metaKey) {
                                                        e.preventDefault();
                                                    }
                                                }}
                                                className={`mt-1 ${errors[`education_${index}_institution`] ? 'border-red-500' : ''}`}
                                                placeholder="e.g., XYZ University"
                                            />
                                            {errors[`education_${index}_institution`] && <p className="mt-1 text-sm text-red-600">{errors[`education_${index}_institution`]}</p>}
                                        </div>
                                        <div>
                                            <Label className="block text-sm font-medium text-gray-700">Degree Detail *</Label>
                                            <Input
                                                value={edu.degree_detail}
                                                onChange={e => {
                                                    updateEducation(index, 'degree_detail', e.target.value);
                                                    if (errors[`education_${index}_degree`]) {
                                                        setErrors(prev => {
                                                            const newErrors = { ...prev };
                                                            delete newErrors[`education_${index}_degree`];
                                                            return newErrors;
                                                        });
                                                    }
                                                }}
                                                onKeyDown={(e) => {
                                                    // Prevent numbers from being typed
                                                    if (/\d/.test(e.key) && !e.ctrlKey && !e.metaKey) {
                                                        e.preventDefault();
                                                    }
                                                }}
                                                className={`mt-1 ${errors[`education_${index}_degree`] ? 'border-red-500' : ''}`}
                                                placeholder="e.g., BS Computer Science"
                                            />
                                            {errors[`education_${index}_degree`] && <p className="mt-1 text-sm text-red-600">{errors[`education_${index}_degree`]}</p>}
                                        </div>
                                        <div>
                                            <Label className="block text-sm font-medium text-gray-700">CGPA / Grades</Label>
                                            <Input
                                                value={edu.grades}
                                                onChange={e => {
                                                    // Only allow numbers and decimal point
                                                    const value = e.target.value.replace(/[^\d.]/g, '');
                                                    updateEducation(index, 'grades', value);
                                                    if (errors[`education_${index}_grades`]) {
                                                        setErrors(prev => {
                                                            const newErrors = { ...prev };
                                                            delete newErrors[`education_${index}_grades`];
                                                            return newErrors;
                                                        });
                                                    }
                                                }}
                                                className={`mt-1 ${errors[`education_${index}_grades`] ? 'border-red-500' : ''}`}
                                                placeholder="e.g., 3.89"
                                            />
                                            {errors[`education_${index}_grades`] && <p className="mt-1 text-sm text-red-600">{errors[`education_${index}_grades`]}</p>}
                                        </div>
                                        <div>
                                            <Label className="block text-sm font-medium text-gray-700">Start Date</Label>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        variant={"outline"}
                                                        className={cn(
                                                            "w-full justify-start text-left font-normal mt-1",
                                                            !edu.start_date && "text-muted-foreground"
                                                        )}
                                                    >
                                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                                        {edu.start_date ? format(parseDateStringToLocal(edu.start_date)!, "PPP") : <span>Pick a date</span>}
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0" align="start">
                                                    <Calendar
                                                        mode="single"
                                                        selected={edu.start_date ? parseDateStringToLocal(edu.start_date) : undefined}
                                                        onSelect={(date) => {
                                                            if (date) {
                                                                updateEducation(index, 'start_date', format(date, 'yyyy-MM-dd'));
                                                            }
                                                        }}
                                                        disabled={(date) => false}
                                                        initialFocus
                                                        captionLayout="dropdown-buttons"
                                                        fromYear={1950}
                                                        toYear={new Date().getFullYear() + 5}
                                                    />
                                                </PopoverContent>
                                            </Popover>
                                        </div>
                                        <div>
                                            <Label className="block text-sm font-medium text-gray-700">End Date</Label>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        variant={"outline"}
                                                        className={cn(
                                                            "w-full justify-start text-left font-normal mt-1",
                                                            !edu.end_date && "text-muted-foreground"
                                                        )}
                                                    >
                                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                                        {edu.end_date ? format(parseDateStringToLocal(edu.end_date)!, "PPP") : <span>Pick a date</span>}
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0" align="start">
                                                    <Calendar
                                                        mode="single"
                                                        selected={edu.end_date ? parseDateStringToLocal(edu.end_date) : undefined}
                                                        onSelect={(date) => {
                                                            if (date) {
                                                                updateEducation(index, 'end_date', format(date, 'yyyy-MM-dd'));
                                                            }
                                                        }}
                                                        disabled={(date) => {
                                                            if (edu.start_date) {
                                                                const startDate = parseDateStringToLocal(edu.start_date);
                                                                if (startDate) {
                                                                    const start = new Date(startDate);
                                                                    start.setHours(0, 0, 0, 0);
                                                                    return date < start;
                                                                }
                                                            }
                                                            return false;
                                                        }}
                                                        initialFocus
                                                        captionLayout="dropdown-buttons"
                                                        fromYear={1950}
                                                        toYear={new Date().getFullYear() + 5}
                                                    />
                                                </PopoverContent>
                                            </Popover>
                                        </div>
                                    </div>

                                    <div className="mt-4">
                                        <Label className="block text-sm font-medium text-gray-700">Description</Label>
                                        <Textarea value={edu.description} onChange={e => updateEducation(index, 'description', e.target.value)} className="mt-1" rows={3} placeholder="Describe your education" />
                                    </div>

                                    {errors[`education_${index}_dates`] && <p className="mt-2 text-sm text-red-600">{errors[`education_${index}_dates`]}</p>}
                                </div>
                            ))}

                            {errors.educations && <p className="mt-1 text-sm text-red-600">{errors.educations}</p>}
                        </div>
                    )}

                    {show('resume_url') && (
                        <div className="bg-gray-50 p-6 rounded-lg">
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">Resume Upload</h2>

                            <div className="space-y-4">
                                <div>
                                    <Label htmlFor="resume_file" className="block text-sm font-medium text-gray-700">Resume File *</Label>
                                    <div className="mt-1">
                                        <div className={`border-2 border-dashed rounded-lg p-6 text-center ${errors.resume_file ? 'border-red-500' : 'border-gray-300'} ${formData.resume_file ? 'border-green-500 bg-green-50' : ''}`} onDrop={handleDrop} onDragOver={e => e.preventDefault()}>
                                            {formData.resume_file ? (
                                                <div className="flex items-center justify-center space-x-2">
                                                    <FileText className="h-8 w-8 text-green-600" />
                                                    <div className="text-left">
                                                        <p className="text-sm font-medium text-green-900">{formData.resume_file.name}</p>
                                                        <p className="text-xs text-green-600">{(formData.resume_file.size / 1024 / 1024).toFixed(2)} MB</p>
                                                    </div>
                                                    <Button type="button" onClick={() => setFormData(prev => ({ ...prev, resume_file: null }))} variant="outline" size="sm" className="ml-2 text-red-600 hover:text-red-700"><X size={16} /></Button>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center">
                                                    <Upload className="h-8 w-8 text-gray-400 mb-2" />
                                                    <p className="text-sm text-gray-600">Click to upload or drag and drop</p>
                                                    <p className="text-xs text-gray-500 mt-1">PDF or DOC files only, max 5MB</p>
                                                </div>
                                            )}

                                            <input id="resume_file" name="resume_file" type="file" accept=".pdf,.doc,.docx" onChange={handleFileChange} className="hidden" />
                                            <Button type="button" onClick={() => document.getElementById('resume_file')?.click()} variant="outline" className="mt-3">Choose File</Button>
                                        </div>
                                    </div>
                                    {errors.resume_file && <p className="mt-1 text-sm text-red-600">{errors.resume_file}</p>}
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="pt-4">
                        <Button type="submit" disabled={isSubmitting} className="w-full bg-[#5C5470] text-white py-3 px-6 rounded-md">
                            {isSubmitting ? 'Submitting...' : 'Submit Application'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default JobApplicationForm;
