import React from 'react';
import { Metadata } from 'next';
import FormSignaturePage from '@/components/forms/FormSignaturePage';

export const metadata: Metadata = {
  title: 'Sign Form | Career Ireland Immigration',
  description: 'Sign your immigration form submission',
};

interface FormSignaturePageProps {
  params: {
    id: string;
  };
}

export default function SignFormPage({ params }: FormSignaturePageProps) {
  return <FormSignaturePage submissionId={params.id} />;
}
