import React, { useState } from 'react';
import { FormSignature } from '@/types/form';
import { Button } from '@/components/ui/button';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { formatDate } from '@/lib/utils';
import { CheckCircle, AlertCircle, Info } from 'lucide-react';

interface SignatureVerificationProps {
  signature: FormSignature;
  formId: string;
  submissionId: string;
  onClose: () => void;
}

const SignatureVerification: React.FC<SignatureVerificationProps> = ({
  signature,
  formId,
  submissionId,
  onClose,
}) => {
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{
    verified: boolean;
    message: string;
    details?: any;
  } | null>(null);

  const handleVerify = async () => {
    try {
      setIsVerifying(true);
      
      // Call the verification API
      const response = await fetch(`/api/forms/submissions/${submissionId}/signatures/${signature.id}/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setVerificationResult({
          verified: data.verified,
          message: data.message,
          details: data.details,
        });
      } else {
        setVerificationResult({
          verified: false,
          message: data.error || 'Verification failed',
        });
      }
    } catch (error) {
      console.error('Error verifying signature:', error);
      setVerificationResult({
        verified: false,
        message: 'An error occurred during verification',
      });
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Signature Verification</DialogTitle>
          <DialogDescription>
            Verify the authenticity of this digital signature.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <div className="mb-4 border rounded-lg p-4">
            <h3 className="text-sm font-medium mb-2">Signature Information</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="text-gray-500">Form ID:</div>
              <div className="font-medium">{formId}</div>
              
              <div className="text-gray-500">Signature ID:</div>
              <div className="font-medium">{signature.id}</div>
              
              <div className="text-gray-500">Date:</div>
              <div className="font-medium">{formatDate(signature.createdAt)}</div>
              
              <div className="text-gray-500">IP Address:</div>
              <div className="font-medium">{signature.ipAddress || 'N/A'}</div>
            </div>
          </div>
          
          <div className="mb-4">
            <h3 className="text-sm font-medium mb-2">Signature Image</h3>
            <div className="border rounded-md p-2 bg-gray-50">
              <img 
                src={signature.signatureData} 
                alt="Signature" 
                className="max-h-20 mx-auto"
              />
            </div>
          </div>
          
          {verificationResult && (
            <div className={`mb-4 p-4 rounded-lg ${
              verificationResult.verified 
                ? 'bg-green-50 border border-green-200' 
                : 'bg-red-50 border border-red-200'
            }`}>
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  {verificationResult.verified ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  )}
                </div>
                <div className="ml-3">
                  <h3 className={`text-sm font-medium ${
                    verificationResult.verified ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {verificationResult.verified ? 'Verification Successful' : 'Verification Failed'}
                  </h3>
                  <div className="mt-2 text-sm">
                    <p className={verificationResult.verified ? 'text-green-700' : 'text-red-700'}>
                      {verificationResult.message}
                    </p>
                  </div>
                  {verificationResult.details && (
                    <div className="mt-2 text-xs text-gray-600">
                      <p className="font-medium">Details:</p>
                      <pre className="mt-1 whitespace-pre-wrap">
                        {JSON.stringify(verificationResult.details, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {!verificationResult && (
            <div className="mb-4 p-4 rounded-lg bg-blue-50 border border-blue-200">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <Info className="h-5 w-5 text-blue-500" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-blue-700">
                    Click the Verify button to check the authenticity of this signature.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
        
        <DialogFooter className="sm:justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
          >
            Close
          </Button>
          
          <Button
            type="button"
            onClick={handleVerify}
            disabled={isVerifying}
          >
            {isVerifying ? 'Verifying...' : 'Verify Signature'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SignatureVerification;
