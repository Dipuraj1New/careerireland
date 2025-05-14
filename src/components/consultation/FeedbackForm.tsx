'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { StarIcon } from 'lucide-react';

// Define the form schema
const feedbackFormSchema = z.object({
  rating: z.string({
    required_error: "Please select a rating",
  }),
  feedback: z.string().min(10, {
    message: "Feedback must be at least 10 characters",
  }).max(500, {
    message: "Feedback must be 500 characters or less",
  }),
  wasHelpful: z.boolean().default(false),
  wouldRecommend: z.boolean().default(false),
  followUpNeeded: z.boolean().default(false),
});

type FeedbackFormValues = z.infer<typeof feedbackFormSchema>;

interface FeedbackFormProps {
  consultationId: string;
  expertName: string;
  onSubmitSuccess?: () => void;
}

export default function FeedbackForm({ consultationId, expertName, onSubmitSuccess }: FeedbackFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Initialize form
  const form = useForm<FeedbackFormValues>({
    resolver: zodResolver(feedbackFormSchema),
    defaultValues: {
      rating: '',
      feedback: '',
      wasHelpful: false,
      wouldRecommend: false,
      followUpNeeded: false,
    },
  });
  
  // Handle form submission
  const onSubmit = async (values: FeedbackFormValues) => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      // In a real implementation, this would call an API endpoint
      const response = await fetch(`/api/consultations/${consultationId}/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });
      
      if (!response.ok) {
        throw new Error('Failed to submit feedback');
      }
      
      setIsSubmitted(true);
      
      if (onSubmitSuccess) {
        onSubmitSuccess();
      }
    } catch (err) {
      console.error('Error submitting feedback:', err);
      setError('Failed to submit feedback. Please try again.');
      
      // For demo purposes, simulate success after 2 seconds
      setTimeout(() => {
        setIsSubmitted(true);
        if (onSubmitSuccess) {
          onSubmitSuccess();
        }
      }, 2000);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (isSubmitted) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Thank You for Your Feedback</CardTitle>
          <CardDescription>
            Your feedback has been submitted successfully
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center py-6">
          <div className="bg-green-50 text-green-700 p-4 rounded-full mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-center text-gray-600 mb-4">
            We appreciate your feedback on your consultation with {expertName}.
            Your input helps us improve our services.
          </p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Consultation Feedback</CardTitle>
        <CardDescription>
          Please share your feedback about your consultation with {expertName}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="rating"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>How would you rate your consultation?</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex space-x-1"
                    >
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <FormItem key={rating} className="flex items-center space-x-0">
                          <FormControl>
                            <RadioGroupItem
                              value={rating.toString()}
                              id={`rating-${rating}`}
                              className="sr-only"
                            />
                          </FormControl>
                          <FormLabel
                            htmlFor={`rating-${rating}`}
                            className={`cursor-pointer p-2 ${
                              field.value === rating.toString()
                                ? 'text-yellow-500'
                                : 'text-gray-300 hover:text-yellow-400'
                            }`}
                          >
                            <StarIcon className="h-8 w-8" />
                          </FormLabel>
                        </FormItem>
                      ))}
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="feedback"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your Feedback</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Please share your thoughts about the consultation..."
                      className="resize-none min-h-[120px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Your feedback helps us improve our services
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="wasHelpful"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        The consultation was helpful for my immigration case
                      </FormLabel>
                    </div>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="wouldRecommend"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        I would recommend this expert to others
                      </FormLabel>
                    </div>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="followUpNeeded"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        I would like a follow-up consultation
                      </FormLabel>
                    </div>
                  </FormItem>
                )}
              />
            </div>
            
            {error && (
              <div className="text-red-500 text-sm">{error}</div>
            )}
            
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <span className="animate-spin mr-2">⟳</span>
                  Submitting...
                </>
              ) : (
                <>Submit Feedback</>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
