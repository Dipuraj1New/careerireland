import React from 'react';
import { FormSignature, SignatureType } from '@/types/form';
import { formatDate } from '@/lib/utils';

interface SignatureDisplayProps {
  signature: FormSignature;
  showDetails?: boolean;
  className?: string;
}

const SignatureDisplay: React.FC<SignatureDisplayProps> = ({
  signature,
  showDetails = false,
  className = '',
}) => {
  return (
    <div className={`border rounded-lg p-4 ${className}`}>
      <div className="flex flex-col">
        <div className="mb-2">
          <h3 className="text-sm font-medium text-gray-700">Signature</h3>
          <div className="mt-1 border rounded-md p-2 bg-white">
            <img 
              src={signature.signatureData} 
              alt="Signature" 
              className="max-h-20 mx-auto"
            />
          </div>
        </div>
        
        {showDetails && (
          <div className="mt-2 text-xs text-gray-500">
            <p>
              <span className="font-medium">Type:</span>{' '}
              {signature.signatureType === SignatureType.DRAWN
                ? 'Drawn Signature'
                : signature.signatureType === SignatureType.TYPED
                ? 'Typed Signature'
                : 'Digital Signature'}
            </p>
            <p>
              <span className="font-medium">Date:</span>{' '}
              {formatDate(signature.createdAt)}
            </p>
            {signature.ipAddress && (
              <p>
                <span className="font-medium">IP Address:</span>{' '}
                {signature.ipAddress}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SignatureDisplay;
