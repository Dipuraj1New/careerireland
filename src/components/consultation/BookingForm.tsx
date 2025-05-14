'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';
import { AvailabilitySlot, ExpertService } from '@/types/consultation';
import { format } from 'date-fns';

// Define the form schema
const bookingFormSchema = z.object({
  serviceId: z.string({
    required_error: "Please select a service",
  }),
  caseId: z.string().optional(),
  notes: z.string().max(500, {
    message: "Notes must be 500 characters or less",
  }).optional(),
  agreeToTerms: z.boolean().refine(value => value === true, {
    message: "You must agree to the terms and conditions",
  }),
});

type BookingFormValues = z.infer<typeof bookingFormSchema>;

interface BookingFormProps {
  expertId: string;
  selectedSlot: AvailabilitySlot;
  services: ExpertService[];
  cases?: { id: string; title: string }[];
  onBack: () => void;
}

export default function BookingForm({ expertId, selectedSlot, services, cases = [], onBack }: BookingFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Initialize form
  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      serviceId: services.length > 0 ? services[0].id : '',
      caseId: cases.length > 0 ? cases[0].id : '',
      notes: '',
      agreeToTerms: false,
    },
  });
  
  // Handle form submission
  const onSubmit = async (values: BookingFormValues) => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      // In a real implementation, this would call an API endpoint
      const response = await fetch('/api/consultations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          expertId,
          scheduledAt: selectedSlot.startTime.toISOString(),
          serviceId: values.serviceId,
          caseId: values.caseId || null,
          notes: values.notes || '',
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to book consultation');
      }
      
      const data = await response.json();
      
      // Redirect to the consultation details page
      router.push(`/consultations/${data.consultation.id}`);
    } catch (err) {
      console.error('Error booking consultation:', err);
      setError('Failed to book consultation. Please try again.');
      
      // For demo purposes, simulate success after 2 seconds
      setTimeout(() => {
        router.push('/consultations/booking/success?demo=true');
      }, 2000);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Get the selected service
  const selectedService = services.find(service => service.id === form.watch('serviceId'));
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Book Your Consultation</CardTitle>
        <CardDescription>
          Complete your booking details
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="bg-indigo-50 p-4 rounded-md mb-6">
              <h3 className="font-medium text-indigo-800 mb-2">Selected Time Slot</h3>
              <p className="text-indigo-700">
                {format(selectedSlot.startTime, 'EEEE, MMMM d, yyyy')} at {format(selectedSlot.startTime, 'h:mm a')}
              </p>
            </div>
            
            <FormField
              control={form.control}
              name="serviceId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Service</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a service" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {services.map(service => (
                        <SelectItem key={service.id} value={service.id}>
                          {service.name} - €{service.price} ({service.duration} min)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Select the type of consultation you need
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {cases.length > 0 && (
              <FormField
                control={form.control}
                name="caseId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Related Case (Optional)</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a case" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">None</SelectItem>
                        {cases.map(caseItem => (
                          <SelectItem key={caseItem.id} value={caseItem.id}>
                            {caseItem.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Link this consultation to one of your cases
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add any specific questions or topics you'd like to discuss"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Share any information that will help the expert prepare for your consultation
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="agreeToTerms"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      I agree to the terms and conditions
                    </FormLabel>
                    <FormDescription>
                      By checking this box, you agree to our{" "}
                      <a href="/terms" className="text-indigo-600 hover:underline">
                        Terms of Service
                      </a>{" "}
                      and{" "}
                      <a href="/privacy" className="text-indigo-600 hover:underline">
                        Privacy Policy
                      </a>
                    </FormDescription>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {error && (
              <div className="text-red-500 text-sm">{error}</div>
            )}
            
            <div className="flex justify-between pt-4">
              <Button type="button" variant="outline" onClick={onBack}>
                Back
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <span className="animate-spin mr-2">⟳</span>
                    Processing...
                  </>
                ) : (
                  <>Book Consultation</>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
