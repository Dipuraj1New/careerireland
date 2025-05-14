'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import PDFPreview from './PDFPreview';
import { Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

interface FormPreviewButtonProps {
  templateId: string;
  formData: Record<string, any>;
  disabled?: boolean;
  buttonText?: string;
  className?: string;
}

const FormPreviewButton: React.FC<FormPreviewButtonProps> = ({
  templateId,
  formData,
  disabled = false,
  buttonText = 'Preview Form',
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);

  const handlePreview = async () => {
    try {
      setIsOpen(true);
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/forms/preview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          templateId,
          formData,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate preview');
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to generate preview');
      }
      
      setPreviewUrl(data.previewUrl);
      setPreviewId(data.previewId);
    } catch (error: any) {
      console.error('Error generating preview:', error);
      setError(error.message || 'An error occurred while generating the preview');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setPreviewUrl(null);
    setPreviewId(null);
    setError(null);
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={handlePreview}
        disabled={disabled}
        className={className}
      >
        <Eye className="h-4 w-4 mr-2" />
        {buttonText}
      </Button>
      
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-4xl h-[80vh]">
          <DialogHeader>
            <DialogTitle>Form Preview</DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-hidden">
            {loading && (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2">Generating preview...</span>
              </div>
            )}
            
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            {previewUrl && !loading && !error && (
              <PDFPreview
                pdfUrl={previewUrl}
                fileName={`form-preview-${previewId}.pdf`}
                onClose={handleClose}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default FormPreviewButton;
