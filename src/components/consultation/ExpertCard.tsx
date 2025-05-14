'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StarIcon, ClockIcon, CalendarIcon } from 'lucide-react';
import { User } from '@/types/user';
import { ExpertService } from '@/types/consultation';

interface ExpertCardProps {
  expert: User & {
    specializations?: string[];
    rating?: number;
    reviewCount?: number;
    bio?: string;
    services?: ExpertService[];
  };
}

export default function ExpertCard({ expert }: ExpertCardProps) {
  // Get the lowest priced service for display
  const lowestPriceService = expert.services?.reduce((lowest, service) => {
    if (!lowest || service.price < lowest.price) {
      return service;
    }
    return lowest;
  }, null as ExpertService | null);

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            <div className="relative h-16 w-16 rounded-full overflow-hidden">
              <Image
                src={`https://ui-avatars.com/api/?name=${expert.firstName}+${expert.lastName}&background=6366f1&color=fff`}
                alt={`${expert.firstName} ${expert.lastName}`}
                fill
                className="object-cover"
              />
            </div>
            <div>
              <CardTitle className="text-lg">
                {expert.firstName} {expert.lastName}
              </CardTitle>
              <div className="flex items-center mt-1">
                <StarIcon className="h-4 w-4 text-yellow-500 mr-1" />
                <span className="text-sm font-medium">
                  {expert.rating || 4.5} ({expert.reviewCount || 0} reviews)
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="flex flex-wrap gap-1 mb-3">
          {expert.specializations?.map((specialization, index) => (
            <Badge key={index} variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">
              {specialization}
            </Badge>
          ))}
        </div>
        <CardDescription className="line-clamp-2 h-10">
          {expert.bio || 'Immigration expert specializing in visa applications and legal consultations.'}
        </CardDescription>
        {lowestPriceService && (
          <div className="flex items-center mt-3 text-sm text-gray-600">
            <ClockIcon className="h-4 w-4 mr-1" />
            <span>{lowestPriceService.duration} min consultation</span>
            <span className="mx-2">•</span>
            <span className="font-medium text-indigo-700">
              From €{lowestPriceService.price}
            </span>
          </div>
        )}
      </CardContent>
      <CardFooter className="pt-2">
        <Link href={`/consultations/${expert.id}`} className="w-full">
          <Button className="w-full bg-indigo-600 hover:bg-indigo-700">
            View Profile
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
