import React, { useRef, useState, useEffect } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { SignatureType } from '@/types/form';
import { Button } from '@/components/ui/button';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface SignatureCaptureProps {
  onSignatureCapture: (signatureData: string, signatureType: SignatureType) => void;
  onCancel: () => void;
  disabled?: boolean;
}

const SignatureCapture: React.FC<SignatureCaptureProps> = ({
  onSignatureCapture,
  onCancel,
  disabled = false,
}) => {
  const [signatureType, setSignatureType] = useState<SignatureType>(SignatureType.DRAWN);
  const [typedSignature, setTypedSignature] = useState<string>('');
  const [typedSignatureFont, setTypedSignatureFont] = useState<string>('Pacifico');
  const signatureCanvasRef = useRef<SignatureCanvas>(null);
  const [canvasWidth, setCanvasWidth] = useState<number>(500);
  const [canvasHeight, setCanvasHeight] = useState<number>(200);
  const containerRef = useRef<HTMLDivElement>(null);

  // Resize canvas based on container width
  useEffect(() => {
    const updateCanvasSize = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.clientWidth;
        setCanvasWidth(containerWidth);
        setCanvasHeight(Math.min(200, containerWidth * 0.4));
      }
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    
    return () => {
      window.removeEventListener('resize', updateCanvasSize);
    };
  }, []);

  const handleClear = () => {
    if (signatureType === SignatureType.DRAWN) {
      signatureCanvasRef.current?.clear();
    } else if (signatureType === SignatureType.TYPED) {
      setTypedSignature('');
    }
  };

  const handleSave = () => {
    let signatureData = '';
    
    if (signatureType === SignatureType.DRAWN) {
      if (signatureCanvasRef.current?.isEmpty()) {
        alert('Please provide a signature before saving.');
        return;
      }
      signatureData = signatureCanvasRef.current?.toDataURL('image/png') || '';
    } else if (signatureType === SignatureType.TYPED) {
      if (!typedSignature.trim()) {
        alert('Please type your signature before saving.');
        return;
      }
      
      // Create a canvas to render the typed signature
      const canvas = document.createElement('canvas');
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.font = `48px ${typedSignatureFont}`;
        ctx.fillStyle = 'black';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(typedSignature, canvas.width / 2, canvas.height / 2);
        signatureData = canvas.toDataURL('image/png');
      }
    }
    
    onSignatureCapture(signatureData, signatureType);
  };

  return (
    <div className="p-4 border rounded-lg bg-white" ref={containerRef}>
      <div className="mb-4">
        <Label htmlFor="signature-type">Signature Type</Label>
        <Select
          value={signatureType}
          onValueChange={(value) => setSignatureType(value as SignatureType)}
          disabled={disabled}
        >
          <SelectTrigger id="signature-type" className="w-full">
            <SelectValue placeholder="Select signature type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={SignatureType.DRAWN}>Draw Signature</SelectItem>
            <SelectItem value={SignatureType.TYPED}>Type Signature</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {signatureType === SignatureType.DRAWN ? (
        <div className="mb-4">
          <Label>Draw your signature below</Label>
          <div className="border rounded-md mt-1 bg-gray-50">
            <SignatureCanvas
              ref={signatureCanvasRef}
              penColor="black"
              canvasProps={{
                width: canvasWidth,
                height: canvasHeight,
                className: 'signature-canvas',
              }}
              backgroundColor="rgba(255, 255, 255, 0)"
              disabled={disabled}
            />
          </div>
        </div>
      ) : (
        <div className="mb-4">
          <Label htmlFor="typed-signature">Type your signature</Label>
          <div className="mt-1">
            <Input
              id="typed-signature"
              type="text"
              value={typedSignature}
              onChange={(e) => setTypedSignature(e.target.value)}
              placeholder="Type your full name"
              className="mb-2"
              disabled={disabled}
            />
            <Select
              value={typedSignatureFont}
              onValueChange={setTypedSignatureFont}
              disabled={disabled}
            >
              <SelectTrigger id="font-select" className="w-full">
                <SelectValue placeholder="Select font" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Pacifico">Pacifico</SelectItem>
                <SelectItem value="Dancing Script">Dancing Script</SelectItem>
                <SelectItem value="Great Vibes">Great Vibes</SelectItem>
                <SelectItem value="Satisfy">Satisfy</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div 
            className="border rounded-md p-4 mt-2 flex items-center justify-center bg-gray-50"
            style={{ 
              height: canvasHeight, 
              fontFamily: typedSignatureFont, 
              fontSize: '32px' 
            }}
          >
            {typedSignature || 'Your signature will appear here'}
          </div>
        </div>
      )}

      <div className="flex justify-end space-x-2 mt-4">
        <Button
          type="button"
          variant="outline"
          onClick={handleClear}
          disabled={disabled}
        >
          Clear
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={disabled}
        >
          Cancel
        </Button>
        <Button
          type="button"
          onClick={handleSave}
          disabled={disabled}
        >
          Save Signature
        </Button>
      </div>
    </div>
  );
};

export default SignatureCapture;
