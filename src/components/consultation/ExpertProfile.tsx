'use client';

import React from 'react';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StarIcon, BriefcaseIcon, GraduationCapIcon, ClockIcon, CalendarIcon } from 'lucide-react';
import { User } from '@/types/user';
import { ExpertService } from '@/types/consultation';

interface ExpertProfileProps {
  expert: User & {
    specializations?: string[];
    rating?: number;
    reviewCount?: number;
    bio?: string;
    experience?: string[];
    education?: string[];
    languages?: string[];
    services?: ExpertService[];
  };
}

export default function ExpertProfile({ expert }: ExpertProfileProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <div className="relative h-32 w-32 rounded-full overflow-hidden">
              <Image
                src={`https://ui-avatars.com/api/?name=${expert.firstName}+${expert.lastName}&background=6366f1&color=fff&size=256`}
                alt={`${expert.firstName} ${expert.lastName}`}
                fill
                className="object-cover"
              />
            </div>
            <div className="space-y-2">
              <CardTitle className="text-2xl">
                {expert.firstName} {expert.lastName}
              </CardTitle>
              <div className="flex items-center">
                <StarIcon className="h-5 w-5 text-yellow-500 mr-1" />
                <span className="font-medium">
                  {expert.rating || 4.5} ({expert.reviewCount || 0} reviews)
                </span>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {expert.specializations?.map((specialization, index) => (
                  <Badge key={index} variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">
                    {specialization}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="about">
            <TabsList className="mb-4">
              <TabsTrigger value="about">About</TabsTrigger>
              <TabsTrigger value="services">Services</TabsTrigger>
              <TabsTrigger value="reviews">Reviews</TabsTrigger>
            </TabsList>
            
            <TabsContent value="about" className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-2">Bio</h3>
                <p className="text-gray-700">
                  {expert.bio || 'Immigration expert specializing in visa applications and legal consultations.'}
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-2">Experience</h3>
                <ul className="space-y-3">
                  {expert.experience?.map((item, index) => (
                    <li key={index} className="flex items-start">
                      <BriefcaseIcon className="h-5 w-5 text-indigo-600 mr-2 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  )) || (
                    <li className="flex items-start">
                      <BriefcaseIcon className="h-5 w-5 text-indigo-600 mr-2 mt-0.5" />
                      <span>5+ years of experience in immigration consulting</span>
                    </li>
                  )}
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-2">Education</h3>
                <ul className="space-y-3">
                  {expert.education?.map((item, index) => (
                    <li key={index} className="flex items-start">
                      <GraduationCapIcon className="h-5 w-5 text-indigo-600 mr-2 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  )) || (
                    <li className="flex items-start">
                      <GraduationCapIcon className="h-5 w-5 text-indigo-600 mr-2 mt-0.5" />
                      <span>Master's Degree in Immigration Law</span>
                    </li>
                  )}
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-2">Languages</h3>
                <div className="flex flex-wrap gap-2">
                  {expert.languages?.map((language, index) => (
                    <Badge key={index} variant="outline">
                      {language}
                    </Badge>
                  )) || (
                    <>
                      <Badge variant="outline">English</Badge>
                      <Badge variant="outline">Irish</Badge>
                    </>
                  )}
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="services" className="space-y-4">
              {expert.services?.map((service, index) => (
                <Card key={index} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">{service.name}</CardTitle>
                    <CardDescription>{service.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-gray-600">
                        <ClockIcon className="h-4 w-4 mr-1" />
                        <span>{service.duration} minutes</span>
                      </div>
                      <div className="font-medium text-lg text-indigo-700">
                        €{service.price}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )) || (
                <p className="text-gray-500">No services available at the moment.</p>
              )}
            </TabsContent>
            
            <TabsContent value="reviews" className="space-y-4">
              <p className="text-gray-500">No reviews available yet.</p>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
