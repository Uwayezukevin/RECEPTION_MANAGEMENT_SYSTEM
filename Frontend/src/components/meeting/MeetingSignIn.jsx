import React, { useRef, useState } from 'react';

const SignaturePad = ({ onSave, onClear, width = 500, height = 200, readOnly = false }) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  const startDrawing = (e) => {
    if (readOnly) return;
    setIsDrawing(true);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    let clientX, clientY;
    if (e.touches) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;
    
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const draw = (e) => {
    if (!isDrawing || readOnly) return;
    e.preventDefault();
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    let clientX, clientY;
    if (e.touches) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;
    
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    if (!readOnly && !isCanvasEmpty()) {
      setHasSignature(true);
    }
  };

  const isCanvasEmpty = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const pixelBuffer = ctx.getImageData(0, 0, canvas.width, canvas.height);
    return !pixelBuffer.data.some(channel => channel !== 0);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
    if (onClear) onClear();
  };

  const saveSignature = () => {
    if (isCanvasEmpty()) {
      alert('Please draw your signature first');
      return null;
    }
    const signatureData = canvasRef.current.toDataURL('image/png');
    if (onSave) onSave(signatureData);
    return signatureData;
  };

  // Initialize canvas with white background
  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    }
  }, []);

  return (
    <div className="signature-container">
      <div className="signature-pad-wrapper" style={{
        border: '2px solid #e2e8f0',
        borderRadius: '12px',
        padding: '12px',
        background: '#fff',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          style={{
            width: '100%',
            height: 'auto',
            border: '1px solid #cbd5e1',
            borderRadius: '8px',
            cursor: readOnly ? 'default' : 'crosshair',
            touchAction: 'none',
            background: 'white'
          }}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
      </div>
      
      {!readOnly && (
        <div className="signature-buttons" style={{
          marginTop: '12px',
          display: 'flex',
          gap: '10px',
          justifyContent: 'center'
        }}>
          <button
            type="button"
            onClick={clearCanvas}
            style={{
              padding: '8px 20px',
              background: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            Clear
          </button>
          <button
            type="button"
            onClick={saveSignature}
            style={{
              padding: '8px 20px',
              background: '#22c55e',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            Save Signature
          </button>
        </div>
      )}
      
      {hasSignature && !readOnly && (
        <p style={{
          color: '#22c55e',
          marginTop: '10px',
          fontSize: '12px',
          textAlign: 'center'
        }}>
          ✓ Signature saved
        </p>
      )}
      
      <p style={{
        fontSize: '11px',
        color: '#64748b',
        marginTop: '10px',
        textAlign: 'center'
      }}>
        Draw your signature using mouse or finger
      </p>
    </div>
  );
};

export default SignaturePad;