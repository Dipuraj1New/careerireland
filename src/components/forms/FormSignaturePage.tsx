import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { FormSubmission, FormSignature, SignatureType } from '@/types/form';
import SignatureCapture from './SignatureCapture';
import SignatureDisplay from './SignatureDisplay';
import SignatureVerification from './SignatureVerification';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, AlertCircle, CheckCircle, FileText, PenTool } from 'lucide-react';

interface FormSignaturePageProps {
  submissionId: string;
}

const FormSignaturePage: React.FC<FormSignaturePageProps> = ({ submissionId }) => {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submission, setSubmission] = useState<FormSubmission | null>(null);
  const [signatures, setSignatures] = useState<FormSignature[]>([]);
  const [signingInProgress, setSigningInProgress] = useState(false);
  const [signatureSuccess, setSignatureSuccess] = useState(false);
  const [verifyingSignature, setVerifyingSignature] = useState<FormSignature | null>(null);

  useEffect(() => {
    const fetchSubmission = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/forms/submissions/${submissionId}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch form submission');
        }
        
        const data = await response.json();
        setSubmission(data.submission);
        setSignatures(data.submission.signatures || []);
      } catch (error) {
        console.error('Error fetching form submission:', error);
        setError(error.message || 'An error occurred while fetching the form submission');
      } finally {
        setLoading(false);
      }
    };

    if (status !== 'loading' && session) {
      fetchSubmission();
    }
  }, [submissionId, session, status]);

  const handleSignatureCapture = async (signatureData: string, signatureType: SignatureType) => {
    try {
      setSigningInProgress(true);
      
      const response = await fetch(`/api/forms/submissions/${submissionId}/sign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          signatureData,
          signatureType,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to sign form');
      }
      
      const data = await response.json();
      
      // Add the new signature to the list
      setSignatures([...signatures, data.signature]);
      setSignatureSuccess(true);
      
      // Refresh the submission data
      const submissionResponse = await fetch(`/api/forms/submissions/${submissionId}`);
      const submissionData = await submissionResponse.json();
      setSubmission(submissionData.submission);
    } catch (error) {
      console.error('Error signing form:', error);
      setError(error.message || 'An error occurred while signing the form');
    } finally {
      setSigningInProgress(false);
    }
  };

  const handleVerifySignature = (signature: FormSignature) => {
    setVerifyingSignature(signature);
  };

  const handleCloseVerification = () => {
    setVerifyingSignature(null);
  };

  const handleViewForm = () => {
    router.push(`/forms/submissions/${submissionId}`);
  };

  const handleContinue = () => {
    router.push(`/forms/submissions/${submissionId}`);
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading...</span>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    router.push(`/auth/login?callbackUrl=/forms/submissions/${submissionId}/sign`);
    return null;
  }

  if (error) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={() => router.back()}>Go Back</Button>
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Not Found</AlertTitle>
          <AlertDescription>The requested form submission could not be found.</AlertDescription>
        </Alert>
        <Button onClick={() => router.back()}>Go Back</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Sign Form Submission</CardTitle>
          <CardDescription>
            Add your digital signature to this form submission
          </CardDescription>
        </CardHeader>
        <CardContent>
          {signatureSuccess ? (
            <Alert className="mb-4 bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-800">Success</AlertTitle>
              <AlertDescription className="text-green-700">
                Your signature has been successfully added to the form.
              </AlertDescription>
            </Alert>
          ) : null}
          
          <div className="mb-4">
            <h3 className="text-lg font-medium">Form Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
              <div>
                <p className="text-sm text-gray-500">Form Name</p>
                <p className="font-medium">{submission.fileName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <p className="font-medium capitalize">{submission.status}</p>
              </div>
            </div>
          </div>
          
          <Tabs defaultValue={signatures.length > 0 ? "existing" : "new"}>
            <TabsList className="mb-4">
              <TabsTrigger value="existing" disabled={signatures.length === 0}>
                <FileText className="h-4 w-4 mr-2" />
                Existing Signatures
              </TabsTrigger>
              <TabsTrigger value="new">
                <PenTool className="h-4 w-4 mr-2" />
                Add Signature
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="existing">
              {signatures.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {signatures.map((signature) => (
                    <div key={signature.id} className="border rounded-lg p-4">
                      <SignatureDisplay signature={signature} showDetails />
                      <div className="mt-4">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleVerifySignature(signature)}
                        >
                          Verify Signature
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No signatures have been added to this form yet.
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="new">
              <SignatureCapture
                onSignatureCapture={handleSignatureCapture}
                onCancel={() => router.back()}
                disabled={signingInProgress}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => router.back()}>
            Back
          </Button>
          <Button onClick={handleViewForm}>
            View Form
          </Button>
        </CardFooter>
      </Card>
      
      {verifyingSignature && (
        <SignatureVerification
          signature={verifyingSignature}
          formId={submission.id}
          submissionId={submissionId}
          onClose={handleCloseVerification}
        />
      )}
    </div>
  );
};

export default FormSignaturePage;
