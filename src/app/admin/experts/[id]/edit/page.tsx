'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ChevronLeftIcon, PlusIcon, XIcon } from 'lucide-react';
import { UserRole } from '@/types/user';

// Define the form schema
const expertFormSchema = z.object({
  firstName: z.string().min(2, {
    message: "First name must be at least 2 characters",
  }),
  lastName: z.string().min(2, {
    message: "Last name must be at least 2 characters",
  }),
  email: z.string().email({
    message: "Please enter a valid email address",
  }),
  bio: z.string().max(500, {
    message: "Bio must be 500 characters or less",
  }).optional(),
  status: z.enum(['active', 'pending', 'inactive']),
  isVerified: z.boolean().default(false),
});

type ExpertFormValues = z.infer<typeof expertFormSchema>;

// Mock expert data
const mockExpert = {
  id: '1',
  email: 'john.doe@example.com',
  firstName: 'John',
  lastName: 'Doe',
  role: UserRole.EXPERT,
  createdAt: new Date('2023-01-15'),
  updatedAt: new Date('2023-06-20'),
  specializations: ['Work Permits', 'Skilled Worker Visas', 'Family Reunification'],
  rating: 4.8,
  reviewCount: 124,
  bio: 'Immigration lawyer with 10+ years of experience specializing in work permits and skilled worker visas.',
  isVerified: true,
  status: 'active' as const,
  lastActive: new Date('2023-07-01'),
  experience: [
    'Senior Immigration Consultant at Dublin Legal Partners (2018-Present)',
    'Immigration Specialist at Global Mobility Solutions (2013-2018)',
    'Legal Advisor at Irish Immigration Services (2010-2013)',
  ],
  education: [
    'Master of Laws (LLM) in Immigration Law, University College Dublin',
    'Bachelor of Laws (LLB), Trinity College Dublin',
    'Certified Immigration Law Specialist',
  ],
  languages: ['English', 'Irish', 'Spanish'],
};

// Available specializations
const availableSpecializations = [
  'Work Permits',
  'Skilled Worker Visas',
  'Family Reunification',
  'Student Visas',
  'Citizenship Applications',
  'Permanent Residency',
  'Business Visas',
  'Investor Programs',
  'Corporate Immigration',
  'Family Visas',
  'Spousal Visas',
  'Dependent Visas',
  'Asylum',
  'Refugee Status',
  'Humanitarian Visas',
];

export default function EditExpertPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const isNewExpert = params.id === 'new';
  const [expert, setExpert] = useState<typeof mockExpert | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [specializations, setSpecializations] = useState<string[]>([]);
  const [newSpecialization, setNewSpecialization] = useState('');
  const [experience, setExperience] = useState<string[]>([]);
  const [newExperience, setNewExperience] = useState('');
  const [education, setEducation] = useState<string[]>([]);
  const [newEducation, setNewEducation] = useState('');
  const [languages, setLanguages] = useState<string[]>([]);
  const [newLanguage, setNewLanguage] = useState('');
  
  // Initialize form
  const form = useForm<ExpertFormValues>({
    resolver: zodResolver(expertFormSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      bio: '',
      status: 'pending',
      isVerified: false,
    },
  });
  
  // Fetch expert data
  useEffect(() => {
    const fetchExpert = async () => {
      setIsLoading(true);
      
      try {
        if (isNewExpert) {
          setIsLoading(false);
          return;
        }
        
        // In a real implementation, this would call an API endpoint
        // For now, we'll use mock data
        
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // For demo purposes, we'll show the mock expert
        setExpert(mockExpert);
        
        // Set form values
        form.reset({
          firstName: mockExpert.firstName,
          lastName: mockExpert.lastName,
          email: mockExpert.email,
          bio: mockExpert.bio,
          status: mockExpert.status,
          isVerified: mockExpert.isVerified,
        });
        
        // Set other state values
        setSpecializations(mockExpert.specializations || []);
        setExperience(mockExpert.experience || []);
        setEducation(mockExpert.education || []);
        setLanguages(mockExpert.languages || []);
      } catch (error) {
        console.error('Error fetching expert:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchExpert();
  }, [isNewExpert, form]);
  
  // Handle form submission
  const onSubmit = async (values: ExpertFormValues) => {
    setIsSaving(true);
    
    try {
      // In a real implementation, this would call an API endpoint
      // For now, we'll just simulate a successful save
      
      // Combine form values with other state values
      const expertData = {
        ...values,
        specializations,
        experience,
        education,
        languages,
        role: UserRole.EXPERT,
      };
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Redirect to expert management page
      router.push('/admin/experts');
    } catch (error) {
      console.error('Error saving expert:', error);
    } finally {
      setIsSaving(false);
    }
  };
  
  // Handle adding a specialization
  const handleAddSpecialization = () => {
    if (newSpecialization && !specializations.includes(newSpecialization)) {
      setSpecializations([...specializations, newSpecialization]);
      setNewSpecialization('');
    }
  };
  
  // Handle removing a specialization
  const handleRemoveSpecialization = (specialization: string) => {
    setSpecializations(specializations.filter(s => s !== specialization));
  };
  
  // Handle adding an experience item
  const handleAddExperience = () => {
    if (newExperience && !experience.includes(newExperience)) {
      setExperience([...experience, newExperience]);
      setNewExperience('');
    }
  };
  
  // Handle removing an experience item
  const handleRemoveExperience = (item: string) => {
    setExperience(experience.filter(e => e !== item));
  };
  
  // Handle adding an education item
  const handleAddEducation = () => {
    if (newEducation && !education.includes(newEducation)) {
      setEducation([...education, newEducation]);
      setNewEducation('');
    }
  };
  
  // Handle removing an education item
  const handleRemoveEducation = (item: string) => {
    setEducation(education.filter(e => e !== item));
  };
  
  // Handle adding a language
  const handleAddLanguage = () => {
    if (newLanguage && !languages.includes(newLanguage)) {
      setLanguages([...languages, newLanguage]);
      setNewLanguage('');
    }
  };
  
  // Handle removing a language
  const handleRemoveLanguage = (language: string) => {
    setLanguages(languages.filter(l => l !== language));
  };
  
  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6">
        <Button variant="outline" asChild className="mb-4">
          <Link href="/admin/experts">
            <ChevronLeftIcon className="h-4 w-4 mr-1" />
            Back to Experts
          </Link>
        </Button>
        
        <h1 className="text-2xl font-bold">{isNewExpert ? 'Add New Expert' : 'Edit Expert'}</h1>
        <p className="text-gray-500">{isNewExpert ? 'Create a new expert profile' : 'Update expert information'}</p>
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <Tabs defaultValue="basic" className="mb-8">
            <TabsList className="mb-4">
              <TabsTrigger value="basic">Basic Information</TabsTrigger>
              <TabsTrigger value="specializations">Specializations</TabsTrigger>
              <TabsTrigger value="background">Background</TabsTrigger>
            </TabsList>
            
            <TabsContent value="basic">
              <Card>
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                  <CardDescription>
                    Enter the expert's basic information
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name</FormLabel>
                          <FormControl>
                            <Input placeholder="John" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Doe" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input placeholder="john.doe@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="bio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bio</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Expert bio and description"
                            className="resize-none min-h-[120px]"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Brief description of the expert's background and expertise
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Status</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="active">Active</SelectItem>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="inactive">Inactive</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="isVerified"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl>
                            <input
                              type="checkbox"
                              checked={field.value}
                              onChange={field.onChange}
                              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>
                              Verified Expert
                            </FormLabel>
                            <FormDescription>
                              Mark this expert as verified
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="specializations">
              <Card>
                <CardHeader>
                  <CardTitle>Specializations</CardTitle>
                  <CardDescription>
                    Add the expert's areas of specialization
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex flex-wrap gap-2 mb-4">
                    {specializations.map((specialization, index) => (
                      <Badge key={index} variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 flex items-center">
                        {specialization}
                        <button
                          type="button"
                          onClick={() => handleRemoveSpecialization(specialization)}
                          className="ml-1 text-indigo-500 hover:text-indigo-700"
                        >
                          <XIcon className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                    {specializations.length === 0 && (
                      <p className="text-gray-500 text-sm">No specializations added yet</p>
                    )}
                  </div>
                  
                  <div className="flex space-x-2">
                    <Select value={newSpecialization} onValueChange={setNewSpecialization}>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Select a specialization" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableSpecializations
                          .filter(spec => !specializations.includes(spec))
                          .map(spec => (
                            <SelectItem key={spec} value={spec}>
                              {spec}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    
                    <Button type="button" onClick={handleAddSpecialization} disabled={!newSpecialization}>
                      <PlusIcon className="h-4 w-4 mr-1" />
                      Add
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="background">
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Experience</CardTitle>
                  <CardDescription>
                    Add the expert's professional experience
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4 mb-4">
                    {experience.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                        <span>{item}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveExperience(item)}
                          className="text-gray-500 hover:text-red-500"
                        >
                          <XIcon className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                    {experience.length === 0 && (
                      <p className="text-gray-500 text-sm">No experience added yet</p>
                    )}
                  </div>
                  
                  <div className="flex space-x-2">
                    <Input
                      placeholder="Add professional experience"
                      value={newExperience}
                      onChange={(e) => setNewExperience(e.target.value)}
                      className="flex-1"
                    />
                    
                    <Button type="button" onClick={handleAddExperience} disabled={!newExperience}>
                      <PlusIcon className="h-4 w-4 mr-1" />
                      Add
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Education</CardTitle>
                  <CardDescription>
                    Add the expert's educational background
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4 mb-4">
                    {education.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                        <span>{item}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveEducation(item)}
                          className="text-gray-500 hover:text-red-500"
                        >
                          <XIcon className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                    {education.length === 0 && (
                      <p className="text-gray-500 text-sm">No education added yet</p>
                    )}
                  </div>
                  
                  <div className="flex space-x-2">
                    <Input
                      placeholder="Add education"
                      value={newEducation}
                      onChange={(e) => setNewEducation(e.target.value)}
                      className="flex-1"
                    />
                    
                    <Button type="button" onClick={handleAddEducation} disabled={!newEducation}>
                      <PlusIcon className="h-4 w-4 mr-1" />
                      Add
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Languages</CardTitle>
                  <CardDescription>
                    Add languages the expert is proficient in
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex flex-wrap gap-2 mb-4">
                    {languages.map((language, index) => (
                      <Badge key={index} variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 flex items-center">
                        {language}
                        <button
                          type="button"
                          onClick={() => handleRemoveLanguage(language)}
                          className="ml-1 text-indigo-500 hover:text-indigo-700"
                        >
                          <XIcon className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                    {languages.length === 0 && (
                      <p className="text-gray-500 text-sm">No languages added yet</p>
                    )}
                  </div>
                  
                  <div className="flex space-x-2">
                    <Input
                      placeholder="Add language"
                      value={newLanguage}
                      onChange={(e) => setNewLanguage(e.target.value)}
                      className="flex-1"
                    />
                    
                    <Button type="button" onClick={handleAddLanguage} disabled={!newLanguage}>
                      <PlusIcon className="h-4 w-4 mr-1" />
                      Add
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
          
          <div className="flex justify-end space-x-4">
            <Button variant="outline" type="button" asChild>
              <Link href="/admin/experts">
                Cancel
              </Link>
            </Button>
            
            <Button type="submit" disabled={isSaving}>
              {isSaving ? (
                <>
                  <span className="animate-spin mr-2">⟳</span>
                  Saving...
                </>
              ) : (
                <>Save Expert</>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
