import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  IconButton,
  Stack,
  Alert,
  useTheme,
  useMediaQuery,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Clear as ClearIcon,
  Done as DoneIcon,
  Undo as UndoIcon,
  Redo as RedoIcon,
  TouchApp as TouchIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

interface SignaturePanelProps {
  onSign: (signatureData: string) => void;
  onCancel?: () => void;
  signerName: string;
  signerRole: string;
  existingSignature?: string;
  readOnly?: boolean;
  showInstructions?: boolean;
}

interface Point {
  x: number;
  y: number;
}

const SignaturePanel: React.FC<SignaturePanelProps> = ({
  onSign,
  onCancel,
  signerName,
  signerRole,
  existingSignature,
  readOnly = false,
  showInstructions = true,
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isEmpty, setIsEmpty] = useState(true);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [signatureQuality, setSignatureQuality] = useState<'low' | 'medium' | 'high'>('low');
  const [lastPoint, setLastPoint] = useState<Point | null>(null);

  // Canvas dimensions
  const canvasWidth = isMobile ? window.innerWidth - 80 : 500;
  const canvasHeight = isMobile ? 200 : 150;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    // Configure drawing style
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;

    // Clear canvas with white background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Load existing signature if provided
    if (existingSignature && !readOnly) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
        setIsEmpty(false);
        updateHistory();
      };
      img.src = existingSignature;
    }
  }, [canvasWidth, canvasHeight, existingSignature, readOnly]);

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if ('touches' in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      };
    } else {
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      };
    }
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (readOnly) return;
    
    const point = getCoordinates(e);
    setIsDrawing(true);
    setLastPoint(point);
    
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(point.x, point.y);
    }
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || readOnly) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !lastPoint) return;

    const currentPoint = getCoordinates(e);
    
    // Draw smooth curve
    ctx.quadraticCurveTo(
      lastPoint.x,
      lastPoint.y,
      (lastPoint.x + currentPoint.x) / 2,
      (lastPoint.y + currentPoint.y) / 2
    );
    ctx.stroke();
    
    setLastPoint(currentPoint);
    setIsEmpty(false);
  };

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
      setLastPoint(null);
      updateHistory();
      checkSignatureQuality();
    }
  };

  const updateHistory = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dataUrl = canvas.toDataURL();
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(dataUrl);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const checkSignatureQuality = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;
    let blackPixels = 0;

    for (let i = 0; i < pixels.length; i += 4) {
      // Check if pixel is not white
      if (pixels[i] < 250 || pixels[i + 1] < 250 || pixels[i + 2] < 250) {
        blackPixels++;
      }
    }

    const percentage = (blackPixels / (pixels.length / 4)) * 100;
    
    if (percentage < 0.5) {
      setSignatureQuality('low');
    } else if (percentage < 2) {
      setSignatureQuality('medium');
    } else {
      setSignatureQuality('high');
    }
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setIsEmpty(true);
    setSignatureQuality('low');
    updateHistory();
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      loadFromHistory(history[newIndex]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      loadFromHistory(history[newIndex]);
    }
  };

  const loadFromHistory = (dataUrl: string) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      setIsEmpty(false);
      checkSignatureQuality();
    };
    img.src = dataUrl;
  };

  const handleSubmit = () => {
    if (!isEmpty) {
      if (signatureQuality === 'low') {
        setShowConfirmDialog(true);
      } else {
        submitSignature();
      }
    }
  };

  const submitSignature = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const signatureData = canvas.toDataURL();
      onSign(signatureData);
      setShowConfirmDialog(false);
    }
  };

  const getQualityMessage = () => {
    switch (signatureQuality) {
      case 'low':
        return t('signature.quality.low');
      case 'medium':
        return t('signature.quality.medium');
      case 'high':
        return t('signature.quality.high');
      default:
        return '';
    }
  };

  const getQualityColor = () => {
    switch (signatureQuality) {
      case 'low':
        return theme.palette.error.main;
      case 'medium':
        return theme.palette.warning.main;
      case 'high':
        return theme.palette.success.main;
      default:
        return theme.palette.text.secondary;
    }
  };

  if (readOnly && existingSignature) {
    return (
      <Paper elevation={2} sx={{ p: 2 }}>
        <Typography variant="subtitle2" gutterBottom>
          {t('signature.signedBy', { name: signerName, role: t(`roles.${signerRole}`) })}
        </Typography>
        <Box
          sx={{
            border: 1,
            borderColor: 'divider',
            borderRadius: 1,
            p: 1,
            backgroundColor: 'grey.50',
          }}
        >
          <img
            src={existingSignature}
            alt={t('signature.alt')}
            style={{
              maxWidth: '100%',
              height: 'auto',
              display: 'block',
            }}
          />
        </Box>
      </Paper>
    );
  }

  return (
    <>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Stack spacing={2}>
          <Box>
            <Typography variant="h6" gutterBottom>
              {t('signature.title')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('signature.signingAs', { name: signerName, role: t(`roles.${signerRole}`) })}
            </Typography>
          </Box>

          {showInstructions && (
            <Alert severity="info" icon={<TouchIcon />}>
              {isMobile
                ? t('signature.instructions.mobile')
                : t('signature.instructions.desktop')}
            </Alert>
          )}

          <Box
            sx={{
              border: 2,
              borderColor: isDrawing ? 'primary.main' : 'divider',
              borderRadius: 1,
              position: 'relative',
              backgroundColor: 'background.paper',
              transition: 'border-color 0.3s',
              overflow: 'hidden',
              touchAction: 'none',
            }}
          >
            <canvas
              ref={canvasRef}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
              style={{
                display: 'block',
                cursor: 'crosshair',
                touchAction: 'none',
              }}
            />
            
            {isEmpty && (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  pointerEvents: 'none',
                  userSelect: 'none',
                }}
              >
                {t('signature.placeholder')}
              </Typography>
            )}
          </Box>

          {!isEmpty && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="caption" color={getQualityColor()}>
                {getQualityMessage()}
              </Typography>
            </Box>
          )}

          <Stack direction="row" spacing={1} justifyContent="space-between">
            <Stack direction="row" spacing={1}>
              <Button
                variant="outlined"
                size="small"
                startIcon={<ClearIcon />}
                onClick={handleClear}
                disabled={isEmpty}
              >
                {t('signature.clear')}
              </Button>
              
              <IconButton
                size="small"
                onClick={handleUndo}
                disabled={historyIndex <= 0}
                title={t('common.undo')}
              >
                <UndoIcon />
              </IconButton>
              
              <IconButton
                size="small"
                onClick={handleRedo}
                disabled={historyIndex >= history.length - 1}
                title={t('common.redo')}
              >
                <RedoIcon />
              </IconButton>
            </Stack>

            <Stack direction="row" spacing={1}>
              {onCancel && (
                <Button
                  variant="outlined"
                  onClick={onCancel}
                >
                  {t('common.cancel')}
                </Button>
              )}
              
              <Button
                variant="contained"
                color="primary"
                startIcon={<DoneIcon />}
                onClick={handleSubmit}
                disabled={isEmpty}
              >
                {t('signature.sign')}
              </Button>
            </Stack>
          </Stack>
        </Stack>
      </Paper>

      <Dialog open={showConfirmDialog} onClose={() => setShowConfirmDialog(false)}>
        <DialogTitle>{t('signature.confirmDialog.title')}</DialogTitle>
        <DialogContent>
          <Typography>
            {t('signature.confirmDialog.lowQuality')}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowConfirmDialog(false)}>
            {t('signature.confirmDialog.redraw')}
          </Button>
          <Button onClick={submitSignature} variant="contained">
            {t('signature.confirmDialog.continue')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default SignaturePanel;