import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Stack,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Alert,
  Grid,
  Tooltip,
  useTheme,
} from '@mui/material';
import {
  Verified as VerifiedIcon,
  Warning as UnverifiedIcon,
  ZoomIn as ZoomIcon,
  Info as InfoIcon,
  Download as DownloadIcon,
  Share as ShareIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { Signature } from '../../types/observation';

interface SignatureDisplayProps {
  signatures: Signature[];
  showValidation?: boolean;
  compact?: boolean;
  onVerify?: (signatureId: string) => void;
}

interface SignatureValidation {
  isValid: boolean;
  verifiedBy?: string;
  verifiedAt?: Date;
  verificationMethod?: string;
  issues?: string[];
}

const SignatureDisplay: React.FC<SignatureDisplayProps> = ({
  signatures,
  showValidation = true,
  compact = false,
  onVerify,
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const [selectedSignature, setSelectedSignature] = useState<Signature | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  // Mock validation data - replace with actual validation
  const getValidationStatus = (signature: Signature): SignatureValidation => {
    // This would normally come from the backend
    return {
      isValid: Math.random() > 0.2, // 80% valid for demo
      verifiedBy: 'System',
      verifiedAt: new Date(),
      verificationMethod: 'digital_certificate',
      issues: Math.random() > 0.8 ? ['Signature timestamp mismatch'] : undefined,
    };
  };

  const handleSignatureClick = (signature: Signature) => {
    setSelectedSignature(signature);
    setShowDetails(true);
  };

  const handleDownload = (signature: Signature) => {
    if (signature.signatureData) {
      const link = document.createElement('a');
      link.href = signature.signatureData;
      link.download = `signature_${signature.signerName}_${signature.signedDate}.png`;
      link.click();
    }
  };

  const getRoleColor = (role: string): string => {
    switch (role) {
      case 'teacher':
        return theme.palette.primary.main;
      case 'observer':
        return theme.palette.info.main;
      case 'supervisor':
        return theme.palette.warning.main;
      default:
        return theme.palette.grey[600];
    }
  };

  const formatDate = (dateString: string): string => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy h:mm a');
    } catch {
      return dateString;
    }
  };

  if (compact) {
    return (
      <Paper elevation={2} sx={{ p: 2 }}>
        <Typography variant="subtitle2" gutterBottom>
          {t('signature.display.title')} ({signatures.length})
        </Typography>
        
        <Stack spacing={1}>
          {signatures.map((signature, index) => {
            const validation = showValidation ? getValidationStatus(signature) : null;
            
            return (
              <Box
                key={signature.id || index}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  p: 1,
                  borderRadius: 1,
                  backgroundColor: 'action.hover',
                  cursor: 'pointer',
                }}
                onClick={() => handleSignatureClick(signature)}
              >
                <Chip
                  label={t(`roles.${signature.role}`)}
                  size="small"
                  sx={{
                    backgroundColor: `${getRoleColor(signature.role)}20`,
                    color: getRoleColor(signature.role),
                  }}
                />
                
                <Typography variant="body2" flex={1}>
                  {signature.signerName}
                </Typography>
                
                {validation && (
                  <Tooltip title={validation.isValid ? t('signature.valid') : t('signature.invalid')}>
                    {validation.isValid ? (
                      <VerifiedIcon color="success" fontSize="small" />
                    ) : (
                      <UnverifiedIcon color="error" fontSize="small" />
                    )}
                  </Tooltip>
                )}
              </Box>
            );
          })}
        </Stack>
      </Paper>
    );
  }

  return (
    <>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          {t('signature.display.title')}
        </Typography>

        <Grid container spacing={2}>
          {signatures.map((signature, index) => {
            const validation = showValidation ? getValidationStatus(signature) : null;
            
            return (
              <Grid item xs={12} md={6} key={signature.id || index}>
                <Paper
                  elevation={2}
                  sx={{
                    p: 2,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    '&:hover': {
                      elevation: 4,
                      transform: 'translateY(-2px)',
                    },
                  }}
                  onClick={() => handleSignatureClick(signature)}
                >
                  <Stack spacing={2}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Chip
                          label={t(`roles.${signature.role}`)}
                          size="small"
                          sx={{
                            backgroundColor: `${getRoleColor(signature.role)}20`,
                            color: getRoleColor(signature.role),
                          }}
                        />
                        {validation && (
                          <Tooltip title={validation.isValid ? t('signature.valid') : t('signature.invalid')}>
                            {validation.isValid ? (
                              <VerifiedIcon color="success" />
                            ) : (
                              <UnverifiedIcon color="error" />
                            )}
                          </Tooltip>
                        )}
                      </Stack>
                      
                      <Stack direction="row" spacing={0.5}>
                        <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleDownload(signature); }}>
                          <DownloadIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small">
                          <ZoomIcon fontSize="small" />
                        </IconButton>
                      </Stack>
                    </Stack>

                    <Box>
                      <Typography variant="subtitle2">{signature.signerName}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatDate(signature.signedDate)}
                      </Typography>
                    </Box>

                    {signature.signatureData && (
                      <Box
                        sx={{
                          border: 1,
                          borderColor: 'divider',
                          borderRadius: 1,
                          p: 1,
                          backgroundColor: 'grey.50',
                          height: 80,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          overflow: 'hidden',
                        }}
                      >
                        <img
                          src={signature.signatureData}
                          alt={t('signature.alt')}
                          style={{
                            maxWidth: '100%',
                            maxHeight: '100%',
                            objectFit: 'contain',
                          }}
                        />
                      </Box>
                    )}

                    {validation && validation.issues && validation.issues.length > 0 && (
                      <Alert severity="warning" icon={<InfoIcon />}>
                        <Typography variant="caption">
                          {validation.issues[0]}
                        </Typography>
                      </Alert>
                    )}
                  </Stack>
                </Paper>
              </Grid>
            );
          })}
        </Grid>

        {signatures.length === 0 && (
          <Alert severity="info">
            {t('signature.display.noSignatures')}
          </Alert>
        )}
      </Paper>

      <Dialog
        open={showDetails}
        onClose={() => setShowDetails(false)}
        maxWidth="sm"
        fullWidth
      >
        {selectedSignature && (
          <>
            <DialogTitle>
              {t('signature.details.title')}
            </DialogTitle>
            <DialogContent>
              <Stack spacing={3} sx={{ mt: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">
                      {t('signature.details.signerName')}
                    </Typography>
                    <Typography variant="body1">
                      {selectedSignature.signerName}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">
                      {t('signature.details.role')}
                    </Typography>
                    <Typography variant="body1">
                      {t(`roles.${selectedSignature.role}`)}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">
                      {t('signature.details.signedDate')}
                    </Typography>
                    <Typography variant="body1">
                      {formatDate(selectedSignature.signedDate)}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">
                      {t('signature.details.ipAddress')}
                    </Typography>
                    <Typography variant="body1">
                      {selectedSignature.ipAddress || 'N/A'}
                    </Typography>
                  </Grid>
                </Grid>

                {selectedSignature.signatureData && (
                  <Box>
                    <Typography variant="caption" color="text.secondary" gutterBottom>
                      {t('signature.details.signatureImage')}
                    </Typography>
                    <Box
                      sx={{
                        border: 1,
                        borderColor: 'divider',
                        borderRadius: 1,
                        p: 2,
                        backgroundColor: 'grey.50',
                        textAlign: 'center',
                      }}
                    >
                      <img
                        src={selectedSignature.signatureData}
                        alt={t('signature.alt')}
                        style={{
                          maxWidth: '100%',
                          height: 'auto',
                        }}
                      />
                    </Box>
                  </Box>
                )}

                {showValidation && (
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      {t('signature.details.validation')}
                    </Typography>
                    {(() => {
                      const validation = getValidationStatus(selectedSignature);
                      return (
                        <Alert
                          severity={validation.isValid ? 'success' : 'error'}
                          icon={validation.isValid ? <VerifiedIcon /> : <UnverifiedIcon />}
                        >
                          <Typography variant="body2">
                            {validation.isValid
                              ? t('signature.validation.valid')
                              : t('signature.validation.invalid')}
                          </Typography>
                          {validation.verifiedBy && (
                            <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                              {t('signature.validation.verifiedBy', {
                                name: validation.verifiedBy,
                                date: format(validation.verifiedAt!, 'MMM d, yyyy'),
                              })}
                            </Typography>
                          )}
                          {validation.issues && validation.issues.map((issue, idx) => (
                            <Typography key={idx} variant="caption" display="block" sx={{ mt: 0.5 }}>
                              • {issue}
                            </Typography>
                          ))}
                        </Alert>
                      );
                    })()}
                  </Box>
                )}
              </Stack>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => handleDownload(selectedSignature)} startIcon={<DownloadIcon />}>
                {t('signature.actions.download')}
              </Button>
              {onVerify && showValidation && (
                <Button onClick={() => onVerify(selectedSignature.id!)} variant="contained">
                  {t('signature.actions.verify')}
                </Button>
              )}
              <Button onClick={() => setShowDetails(false)}>
                {t('common.close')}
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </>
  );
};

export default SignatureDisplay;