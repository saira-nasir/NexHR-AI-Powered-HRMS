import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { Plus, X, Trash2, Upload, FileText } from 'lucide-react';
import { applicationService } from '@/services/jobPortalservice';
import RequiredSkillsField from '@/components/job-post/RequiredSkillsField';
import { RequiredSkill } from '@/services/JobService';
import type { StylesConfig } from 'react-select';

interface Skill {
  name: string;
}

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

const JobApplicationForm = () => {
    // Remove unused jobId parameter
    const [formData, setFormData] = useState({
        job_id: '', // Add job ID field
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
        experiences: [{
            years_of_experience: '',
            previous_job_titles: '',
            company_name: ''
        }] as Experience[],
        educations: [{
            education_level: '',
            institution_name: '',
            degree_detail: '',
            grades: '',
            start_date: '',
            end_date: '',
            description: ''
        }] as Education[]
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        // Required fields validation
        if (!formData.job_id.trim()) newErrors.job_id = 'Job ID is required';
        if (!formData.candidate_fname.trim()) newErrors.candidate_fname = 'First name is required';
        if (!formData.candidate_lname.trim()) newErrors.candidate_lname = 'Last name is required';
        if (!formData.email.trim()) newErrors.email = 'Email is required';
        if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
        if (!formData.gender) newErrors.gender = 'Gender is required';
        if (!formData.address.trim()) newErrors.address = 'Address is required';
        if (!formData.dob) newErrors.dob = 'Date of birth is required';
        if (!formData.resume_file) newErrors.resume_file = 'Resume file is required';

        // Job ID validation
        const jobIdNum = parseInt(formData.job_id);
        if (isNaN(jobIdNum) || jobIdNum <= 0) {
            newErrors.job_id = 'Please enter a valid job ID (positive number)';
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (formData.email && !emailRegex.test(formData.email)) {
            newErrors.email = 'Please enter a valid email address';
        }

        // Phone validation
        const phoneRegex = /^\+?[\d\s-]{10,}$/;
        if (formData.phone && !phoneRegex.test(formData.phone)) {
            newErrors.phone = 'Please enter a valid phone number';
        }

        // DOB validation
        const dob = new Date(formData.dob);
        const today = new Date();
        if (dob > today) {
            newErrors.dob = 'Date of birth cannot be in the future';
        }
        // Age check: must be at least 18 years old
        if (formData.dob) {
            const ageDiffMs = today.getTime() - dob.getTime();
            const ageDate = new Date(ageDiffMs); // miliseconds from epoch
            const age = Math.abs(ageDate.getUTCFullYear() - 1970);
            if (age < 18) {
                newErrors.dob = 'You must be at least 18 years old to apply';
            }
        }

        // File validation
        if (formData.resume_file) {
            const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
            if (!allowedTypes.includes(formData.resume_file.type)) {
                newErrors.resume_file = 'Please upload a PDF or DOC file';
            }
            if (formData.resume_file.size > 5 * 1024 * 1024) { // 5MB limit
                newErrors.resume_file = 'File size must be less than 5MB';
            }
        }

        // Skills validation
        const validSkills = formData.skills.filter(skill => skill.name.trim());
        if (validSkills.length === 0) {
            newErrors.skills = 'At least one skill is required';
        }

        // Experiences validation
        const validExperiences = formData.experiences.filter(exp => 
            typeof exp.years_of_experience === 'number' && exp.years_of_experience > 0 && exp.previous_job_titles.trim() && exp.company_name.trim()
        );
        if (validExperiences.length === 0) {
            newErrors.experiences = 'At least one experience is required with valid details';
        }

        // Educations validation
        const validEducations = formData.educations.filter(edu => 
            edu.education_level.trim() && edu.institution_name.trim() && edu.degree_detail.trim()
        );
        if (validEducations.length === 0) {
            newErrors.educations = 'At least one education is required with valid details';
        }

        // Education date validation - start must be before end
        formData.educations.forEach((edu, index) => {
            if (edu.start_date && edu.end_date) {
                const startDate = new Date(edu.start_date);
                const endDate = new Date(edu.end_date);
                if (startDate >= endDate) {
                    newErrors[`education_${index}_dates`] = `Education ${index + 1}: Start date must be earlier than end date`;
                }
            }
        });

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!validateForm()) {
            toast({
                title: "Validation Error",
                description: "Please check the form for errors",
                variant: "destructive",
            });
            return;
        }

        setIsSubmitting(true);
        try {
            const normalizedSkills = formData.skills
                .filter(s => s && (s.name?.toString().trim?.() || s.id))
                .map(s => {
                    // If backend-provided id exists, send object with id & name
                    if ((s as RequiredSkill).id) return { id: (s as RequiredSkill).id, name: (s as RequiredSkill).name };
                    // If name provided, send name (backend accepts object {name} or plain string)
                    if ((s as RequiredSkill).name) return { name: (s as RequiredSkill).name };
                    return String(s);
                });

            const payload = {
                job: parseInt(formData.job_id || '0'), // Use form's job_id field
                candidate_fname: formData.candidate_fname,
                candidate_lname: formData.candidate_lname,
                email: formData.email,
                phone: formData.phone,
                status: formData.status,
                gender: formData.gender,
                address: formData.address,
                // Normalize date of birth to YYYY-MM-DD (ensure no time component)
                dob: formData.dob ? String(formData.dob).split('T')[0] : '',
                skills: normalizedSkills,
                experiences: formData.experiences.filter(exp => 
                    typeof exp.years_of_experience === 'number' && exp.years_of_experience > 0 && exp.previous_job_titles.trim() && exp.company_name.trim()
                ),
                // Ensure education dates are formatted to YYYY-MM-DD or omitted when empty
                educations: formData.educations
                    .filter(edu => edu.education_level.trim() && edu.institution_name.trim() && edu.degree_detail.trim())
                    .map(edu => ({
                        ...edu,
                        start_date: edu.start_date ? String(edu.start_date).split('T')[0] : null,
                        end_date: edu.end_date ? String(edu.end_date).split('T')[0] : null
                    }))
            };

            // Create FormData with correct structure for backend
            const formDataToSend = new FormData();
            
            // Add all the form fields directly to FormData
            formDataToSend.append('job', payload.job.toString());
            formDataToSend.append('candidate_fname', payload.candidate_fname);
            formDataToSend.append('candidate_lname', payload.candidate_lname);
            formDataToSend.append('email', payload.email);
            formDataToSend.append('phone', payload.phone);
            formDataToSend.append('status', payload.status);
            formDataToSend.append('gender', payload.gender);
            formDataToSend.append('address', payload.address);
            formDataToSend.append('dob', payload.dob);
            
            // Add complex objects as JSON strings
            formDataToSend.append('skills', JSON.stringify(payload.skills));
            formDataToSend.append('experiences', JSON.stringify(payload.experiences));
            formDataToSend.append('educations', JSON.stringify(payload.educations));
            
            // Add the resume file - backend expects "resume" field name
            if (formData.resume_file) {
                formDataToSend.append('resume', formData.resume_file);
            }

            // Debug: Log what's being sent
            console.log('Payload being sent:', payload);
            console.log('FormData entries:');
            for (let [key, value] of formDataToSend.entries()) {
                console.log(key, value);
            }

            const response = await applicationService.submitApplication(formDataToSend);
            
            if (response.success) {
                toast({
                    title: "Success",
                    description: response.message || "Application submitted successfully",
                });
                
                // Reset form
                setFormData({
                    job_id: '', // Add job_id to reset
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
                    experiences: [{
                        years_of_experience: '',
                        previous_job_titles: '',
                        company_name: ''
                    }],
                    educations: [{
                        education_level: '',
                        institution_name: '',
                        degree_detail: '',
                        grades: '',
                        start_date: '',
                        end_date: '',
                        description: ''
                    }]
                });
            } else {
                // If backend provided structured validation errors, map them to the form
                if (response.errorData && typeof response.errorData === 'object') {
                    const newErrors: Record<string, string> = {};

                    // Common pattern: { field_name: ["error msg"], other_field: [{...}] }
                    const errData = response.errorData;
                    if (Array.isArray(errData)) {
                        // Sometimes errors are returned as a list
                        newErrors['non_field_errors'] = errData.join(', ');
                    } else {
                        for (const key of Object.keys(errData)) {
                            const val = errData[key];
                            if (Array.isArray(val)) {
                                newErrors[key] = val.map(v => (typeof v === 'string' ? v : JSON.stringify(v))).join(' ');
                            } else if (typeof val === 'object') {
                                // For nested errors like educations: [{end_date: ['error']}]
                                if (Array.isArray(val) && val.length > 0) {
                                    newErrors[key] = JSON.stringify(val);
                                } else {
                                    newErrors[key] = JSON.stringify(val);
                                }
                            } else {
                                newErrors[key] = String(val);
                            }
                        }
                    }

                    setErrors(prev => ({ ...prev, ...newErrors }));

                    toast({
                        title: "Submission failed",
                        description: response.message || 'Validation failed. See form for details.',
                        variant: "destructive",
                    });
                } else {
                    toast({
                        title: "Error",
                        description: response.message || "Failed to submit application",
                        variant: "destructive",
                    });
                }
            }
        } catch (error) {
            // Catch any unexpected errors and show a readable message instead of crashing UI
            console.error('Unhandled error while submitting application:', error);
            const message = (error as any)?.message || 'Failed to submit application';
            toast({
                title: "Error",
                description: String(message),
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setFormData(prev => ({
                ...prev,
                resume_file: file
            }));
            if (errors.resume_file) {
                setErrors(prev => ({
                    ...prev,
                    resume_file: ''
                }));
            }
        }
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file) {
            setFormData(prev => ({
                ...prev,
                resume_file: file
            }));
            if (errors.resume_file) {
                setErrors(prev => ({
                    ...prev,
                    resume_file: ''
                }));
            }
        }
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
    };

    // Skills handlers - reuse the RequiredSkillsField component (supports search + create)
    const selectStyles: StylesConfig<any, boolean> = {} as any;
    const handleSkillsChange = (skills: RequiredSkill[]) => {
        setFormData(prev => ({ ...prev, skills }));
        if (errors.skills) {
            setErrors(prev => ({ ...prev, skills: '' }));
        }
    };

    // Experiences handlers
    const addExperience = () => {
        setFormData(prev => ({
            ...prev,
            experiences: [...prev.experiences, {
                years_of_experience: '',
                previous_job_titles: '',
                company_name: ''
            }]
        }));
    };

    const removeExperience = (index: number) => {
        if (formData.experiences.length > 1) {
            setFormData(prev => ({
                ...prev,
                experiences: prev.experiences.filter((_, i) => i !== index)
            }));
        }
    };

    const updateExperience = (index: number, field: keyof Experience, value: string | number | '') => {
        setFormData(prev => ({
            ...prev,
            experiences: prev.experiences.map((exp, i) => 
                i === index ? { ...exp, [field]: value } : exp
            )
        }));
    };

    // Educations handlers
    const addEducation = () => {
        setFormData(prev => ({
            ...prev,
            educations: [...prev.educations, {
                education_level: '',
                institution_name: '',
                degree_detail: '',
                grades: '',
                start_date: '',
                end_date: '',
                description: ''
            }]
        }));
    };

    const removeEducation = (index: number) => {
        if (formData.educations.length > 1) {
            setFormData(prev => ({
                ...prev,
                educations: prev.educations.filter((_, i) => i !== index)
            }));
        }
    };

    const updateEducation = (index: number, field: keyof Education, value: string) => {
        setFormData(prev => ({
            ...prev,
            educations: prev.educations.map((edu, i) => 
                i === index ? { ...edu, [field]: value } : edu
            )
        }));
    };

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Job Application</h1>
                    <p className="mt-2 text-gray-600">Please fill out the form below to apply for the position</p>
                    <p className="mt-1 text-sm text-gray-500">Your application will be submitted with "Pending" status</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Personal Information */}
                    <div className="bg-gray-50 p-6 rounded-lg">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">Personal Information</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="job_id" className="block text-sm font-medium text-gray-700">Job ID *</Label>
                                <Input
                                    id="job_id"
                                    name="job_id"
                                    type="number"
                                    min="1"
                                    value={formData.job_id}
                                    onChange={handleChange}
                                    className={`mt-1 block w-full rounded-md shadow-sm ${errors.job_id ? "border-red-500" : "border-gray-300"}`}
                                    placeholder="Enter the job ID you want to apply for"
                                />
                                <p className="mt-1 text-xs text-gray-500">You can find the Job ID in the job listing or from your HR department</p>
                                {errors.job_id && <p className="mt-1 text-sm text-red-600">{errors.job_id}</p>}
                            </div>
                            
                            <div>
                                <Label htmlFor="candidate_fname" className="block text-sm font-medium text-gray-700">First Name *</Label>
                                <Input
                                    id="candidate_fname"
                                    name="candidate_fname"
                                    value={formData.candidate_fname}
                                    onChange={handleChange}
                                    className={`mt-1 block w-full rounded-md shadow-sm ${errors.candidate_fname ? "border-red-500" : "border-gray-300"}`}
                                    placeholder="Enter your first name"
                                />
                                {errors.candidate_fname && <p className="mt-1 text-sm text-red-600">{errors.candidate_fname}</p>}
                            </div>

                            <div>
                                <Label htmlFor="candidate_lname" className="block text-sm font-medium text-gray-700">Last Name *</Label>
                                <Input
                                    id="candidate_lname"
                                    name="candidate_lname"
                                    value={formData.candidate_lname}
                                    onChange={handleChange}
                                    className={`mt-1 block w-full rounded-md shadow-sm ${errors.candidate_lname ? "border-red-500" : "border-gray-300"}`}
                                    placeholder="Enter your last name"
                                />
                                {errors.candidate_lname && <p className="mt-1 text-sm text-red-600">{errors.candidate_lname}</p>}
                            </div>

                            <div>
                                <Label htmlFor="email" className="block text-sm font-medium text-gray-700">Email Address *</Label>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className={`mt-1 block w-full rounded-md shadow-sm ${errors.email ? "border-red-500" : "border-gray-300"}`}
                                    placeholder="Enter your email address"
                                />
                                {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                            </div>

                            <div>
                                <Label htmlFor="phone" className="block text-sm font-medium text-gray-700">Phone Number *</Label>
                                <Input
                                    id="phone"
                                    name="phone"
                                    type="tel"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    className={`mt-1 block w-full rounded-md shadow-sm ${errors.phone ? "border-red-500" : "border-gray-300"}`}
                                    placeholder="Enter your phone number"
                                />
                                {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
                            </div>

                            <div>
                                <Label htmlFor="gender" className="block text-sm font-medium text-gray-700">Gender *</Label>
                                <select
                                    id="gender"
                                    name="gender"
                                    value={formData.gender}
                                    onChange={handleChange}
                                    className={`mt-1 block w-full rounded-md shadow-sm h-[42px] px-3 py-2 ${errors.gender ? "border-red-500" : "border-gray-300"}`}
                                    style={{ backgroundColor: '#FFFFFF', color: '#2A2438' }}
                                >
                                    <option value="">Select gender</option>
                                    <option value="male">Male</option>
                                    <option value="female">Female</option>
                                    <option value="other">Other</option>
                                </select>
                                {errors.gender && <p className="mt-1 text-sm text-red-600">{errors.gender}</p>}
                            </div>

                            <div>
                                <Label htmlFor="dob" className="block text-sm font-medium text-gray-700">Date of Birth *</Label>
                                <Input
                                    id="dob"
                                    name="dob"
                                    type="date"
                                    value={formData.dob}
                                    onChange={handleChange}
                                    className={`mt-1 block w-full rounded-md shadow-sm ${errors.dob ? "border-red-500" : "border-gray-300"}`}
                                />
                                {errors.dob && <p className="mt-1 text-sm text-red-600">{errors.dob}</p>}
                            </div>
                        </div>

                        <div className="mt-4">
                            <Label htmlFor="address" className="block text-sm font-medium text-gray-700">Address *</Label>
                            <Textarea
                                id="address"
                                name="address"
                                value={formData.address}
                                onChange={handleChange}
                                className={`mt-1 block w-full rounded-md shadow-sm ${errors.address ? "border-red-500" : "border-gray-300"}`}
                                rows={3}
                                placeholder="Enter your full address"
                            />
                            {errors.address && <p className="mt-1 text-sm text-red-600">{errors.address}</p>}
                        </div>
                    </div>

                    {/* Skills Section */}
                    <div className="bg-gray-50 p-6 rounded-lg">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h2 className="text-xl font-semibold text-gray-900">Skills</h2>
                                <p className="text-sm text-gray-600 mt-1">Add your technical and professional skills</p>
                            </div>
                        </div>

                        <RequiredSkillsField
                            value={formData.skills}
                            onChange={handleSkillsChange}
                            validationError={errors.skills}
                            selectStyles={selectStyles}
                        />
                    </div>

                    {/* Experience Section */}
                    <div className="bg-gray-50 p-6 rounded-lg">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h2 className="text-xl font-semibold text-gray-900">Work Experience</h2>
                                <p className="text-sm text-gray-600 mt-1">List your relevant work experience</p>
                            </div>
                            <Button
                                type="button"
                                onClick={addExperience}
                                variant="outline"
                                size="sm"
                                className="flex items-center gap-2"
                            >
                                <Plus size={16} />
                                Add Experience
                            </Button>
                        </div>
                        
                        {formData.experiences.map((exp, index) => (
                            <div key={index} className="border border-gray-200 p-4 rounded-lg mb-4">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="font-medium text-gray-900">Experience {index + 1}</h3>
                                    {formData.experiences.length > 1 && (
                                        <Button
                                            type="button"
                                            onClick={() => removeExperience(index)}
                                            variant="outline"
                                            size="sm"
                                            className="text-red-600 hover:text-red-700"
                                        >
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
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                if (val === '') {
                                                    updateExperience(index, 'years_of_experience', '');
                                                } else {
                                                    const numVal = parseFloat(val);
                                                    if (!isNaN(numVal) && numVal >= 0) {
                                                        updateExperience(index, 'years_of_experience', numVal);
                                                    }
                                                }
                                            }}
                                            className="mt-1"
                                            placeholder="e.g., 3.5"
                                        />
                                    </div>
                                    <div>
                                        <Label className="block text-sm font-medium text-gray-700">Job Title *</Label>
                                        <Input
                                            value={exp.previous_job_titles}
                                            onChange={(e) => updateExperience(index, 'previous_job_titles', e.target.value)}
                                            className="mt-1"
                                            placeholder="e.g., Software Engineer"
                                        />
                                    </div>
                                    <div>
                                        <Label className="block text-sm font-medium text-gray-700">Company Name *</Label>
                                        <Input
                                            value={exp.company_name}
                                            onChange={(e) => updateExperience(index, 'company_name', e.target.value)}
                                            className="mt-1"
                                            placeholder="e.g., TechCorp"
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                        {errors.experiences && <p className="mt-1 text-sm text-red-600">{errors.experiences}</p>}
                    </div>

                    {/* Education Section */}
                    <div className="bg-gray-50 p-6 rounded-lg">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h2 className="text-xl font-semibold text-gray-900">Education</h2>
                                <p className="text-sm text-gray-600 mt-1">List your educational background</p>
                            </div>
                            <Button
                                type="button"
                                onClick={addEducation}
                                variant="outline"
                                size="sm"
                                className="flex items-center gap-2"
                            >
                                <Plus size={16} />
                                Add Education
                            </Button>
                        </div>
                        
                        {formData.educations.map((edu, index) => (
                            <div key={index} className="border border-gray-200 p-4 rounded-lg mb-4">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="font-medium text-gray-900">Education {index + 1}</h3>
                                    {formData.educations.length > 1 && (
                                        <Button
                                            type="button"
                                            onClick={() => removeEducation(index)}
                                            variant="outline"
                                            size="sm"
                                            className="text-red-600 hover:text-red-700"
                                        >
                                            <Trash2 size={16} />
                                        </Button>
                                    )}
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <Label className="block text-sm font-medium text-gray-700">Education Level *</Label>
                                        <Input
                                            value={edu.education_level}
                                            onChange={(e) => updateEducation(index, 'education_level', e.target.value)}
                                            className="mt-1"
                                            placeholder="e.g., Bachelor's, Master's, PhD"
                                        />
                                    </div>
                                    <div>
                                        <Label className="block text-sm font-medium text-gray-700">Institution Name *</Label>
                                        <Input
                                            value={edu.institution_name}
                                            onChange={(e) => updateEducation(index, 'institution_name', e.target.value)}
                                            className="mt-1"
                                            placeholder="e.g., XYZ University"
                                        />
                                    </div>
                                    <div>
                                        <Label className="block text-sm font-medium text-gray-700">Degree Detail *</Label>
                                        <Input
                                            value={edu.degree_detail}
                                            onChange={(e) => updateEducation(index, 'degree_detail', e.target.value)}
                                            className="mt-1"
                                            placeholder="e.g., BS Computer Science"
                                        />
                                    </div>
                                    <div>
                                        <Label className="block text-sm font-medium text-gray-700">Grades</Label>
                                        <Input
                                            value={edu.grades}
                                            onChange={(e) => updateEducation(index, 'grades', e.target.value)}
                                            className="mt-1"
                                            placeholder="e.g., 3.7 CGPA, First Class"
                                        />
                                    </div>
                                    <div>
                                        <Label className="block text-sm font-medium text-gray-700">Start Date</Label>
                                        <Input
                                            type="date"
                                            value={edu.start_date}
                                            onChange={(e) => updateEducation(index, 'start_date', e.target.value)}
                                            className="mt-1"
                                        />
                                    </div>
                                    <div>
                                        <Label className="block text-sm font-medium text-gray-700">End Date</Label>
                                        <Input
                                            type="date"
                                            value={edu.end_date}
                                            onChange={(e) => updateEducation(index, 'end_date', e.target.value)}
                                            className="mt-1"
                                        />
                                    </div>
                                </div>
                                
                                <div className="mt-4">
                                    <Label className="block text-sm font-medium text-gray-700">Description</Label>
                                    <Textarea
                                        value={edu.description}
                                        onChange={(e) => updateEducation(index, 'description', e.target.value)}
                                        className="mt-1"
                                        rows={3}
                                        placeholder="Describe your education experience, relevant coursework, achievements, etc."
                                    />
                                </div>
                                {errors[`education_${index}_dates`] && (
                                    <p className="mt-2 text-sm text-red-600">{errors[`education_${index}_dates`]}</p>
                                )}
                            </div>
                        ))}
                        {errors.educations && <p className="mt-1 text-sm text-red-600">{errors.educations}</p>}
                    </div>

                    {/* Resume Upload */}
                    <div className="bg-gray-50 p-6 rounded-lg">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">Resume Upload</h2>
                        
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="resume_file" className="block text-sm font-medium text-gray-700">Resume File *</Label>
                                <div className="mt-1">
                                    <div 
                                        className={`border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200 ${errors.resume_file ? "border-red-500" : "border-gray-300"} ${formData.resume_file ? "border-green-500 bg-green-50" : ""} hover:border-gray-400 cursor-pointer`}
                                        onDrop={handleDrop}
                                        onDragOver={handleDragOver}
                                    >
                                        {formData.resume_file ? (
                                            <div className="flex items-center justify-center space-x-2">
                                                <FileText className="h-8 w-8 text-green-600" />
                                                <div className="text-left">
                                                    <p className="text-sm font-medium text-green-900">{formData.resume_file.name}</p>
                                                    <p className="text-xs text-green-600">{(formData.resume_file.size / 1024 / 1024).toFixed(2)} MB</p>
                                                </div>
                                                <Button
                                                    type="button"
                                                    onClick={() => setFormData(prev => ({ ...prev, resume_file: null }))}
                                                    variant="outline"
                                                    size="sm"
                                                    className="ml-2 text-red-600 hover:text-red-700"
                                                >
                                                    <X size={16} />
                                                </Button>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center">
                                                <Upload className="h-8 w-8 text-gray-400 mb-2" />
                                                <p className="text-sm text-gray-600">Click to upload or drag and drop</p>
                                                <p className="text-xs text-gray-500 mt-1">PDF or DOC files only, max 5MB</p>
                                            </div>
                                        )}
                                        <Input
                                            id="resume_file"
                                            name="resume_file"
                                            type="file"
                                            accept=".pdf,.doc,.docx"
                                            onChange={handleFileChange}
                                            className="hidden"
                                        />
                                        <Button
                                            type="button"
                                            onClick={() => document.getElementById('resume_file')?.click()}
                                            variant="outline"
                                            className="mt-3"
                                        >
                                            Choose File
                                        </Button>
                                    </div>
                                </div>
                                {errors.resume_file && <p className="mt-1 text-sm text-red-600">{errors.resume_file}</p>}
                            </div>
                        </div>
                    </div>

                    <div className="pt-4">
                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full bg-[#5C5470] hover:bg-[#352F44] text-white py-3 px-6 rounded-md shadow-sm text-base font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#5C5470]"
                        >
                            {isSubmitting ? 'Submitting...' : 'Submit Application'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default JobApplicationForm;
