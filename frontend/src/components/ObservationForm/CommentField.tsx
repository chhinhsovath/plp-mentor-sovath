import React, { useState } from 'react';
import { 
  TextField, 
  Box, 
  Typography, 
  IconButton, 
  useTheme, 
  useMediaQuery,
  InputAdornment,
  Tooltip
} from '@mui/material';
import { 
  MicNone as MicIcon, 
  Clear as ClearIcon,
  AddPhotoAlternate as ImageIcon,
  Check as CheckIcon
} from '@mui/icons-material';
import { isTouchDevice, deviceFeatures } from '../../utils/deviceDetection';

interface CommentFieldProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  multiline?: boolean;
  rows?: number;
  maxLength?: number;
  size?: 'small' | 'medium';
  error?: boolean;
  helperText?: string;
}

const CommentField: React.FC<CommentFieldProps> = ({
  value,
  onChange,
  label,
  placeholder,
  multiline = true,
  rows = 3,
  maxLength = 500,
  size = 'medium',
  error = false,
  helperText,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTouch = isTouchDevice();
  const [isFocused, setIsFocused] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  
  // Adjust rows for mobile devices
  const effectiveRows = isMobile ? Math.max(2, rows - 1) : rows;
  // Use medium size on mobile for better touch targets
  const effectiveSize = isMobile ? 'medium' : size;
  
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    if (maxLength && newValue.length <= maxLength) {
      onChange(newValue);
    }
  };
  
  const handleClear = () => {
    onChange('');
  };
  
  const handleFocus = () => {
    setIsFocused(true);
  };
  
  const handleBlur = () => {
    setIsFocused(false);
  };
  
  // Speech recognition for mobile devices
  const handleSpeechRecognition = () => {
    // Check if speech recognition is available
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Speech recognition is not supported in this browser.');
      return;
    }
    
    setIsRecording(true);
    
    // Use the SpeechRecognition API
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.lang = 'km-KH'; // Set to Khmer language
    recognition.continuous = false;
    recognition.interimResults = false;
    
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      onChange(value + ' ' + transcript);
      setIsRecording(false);
    };
    
    recognition.onerror = () => {
      setIsRecording(false);
    };
    
    recognition.onend = () => {
      setIsRecording(false);
    };
    
    recognition.start();
  };
  
  // Calculate character count color based on remaining characters
  const getCharCountColor = () => {
    if (!maxLength) return 'text.secondary';
    
    const remainingChars = maxLength - value.length;
    if (remainingChars <= 10) return 'error.main';
    if (remainingChars <= 50) return 'warning.main';
    return 'text.secondary';
  };
  
  return (
    <Box>
      <TextField
        fullWidth
        size={effectiveSize}
        label={label}
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        multiline={multiline}
        rows={effectiveRows}
        error={error}
        helperText={helperText}
        variant="outlined"
        onFocus={handleFocus}
        onBlur={handleBlur}
        InputProps={{
          sx: {
            fontSize: effectiveSize === 'small' ? '0.875rem' : '1rem',
            // Increase padding for touch devices
            ...(isMobile && {
              padding: '8px 14px',
            }),
          },
          // Add end adornment for mobile devices
          endAdornment: isMobile && (
            <InputAdornment position="end">
              {value && (
                <IconButton 
                  edge="end" 
                  onClick={handleClear}
                  size="small"
                  sx={{ mr: 0.5 }}
                >
                  <ClearIcon fontSize="small" />
                </IconButton>
              )}
            </InputAdornment>
          ),
        }}
        sx={{
          '& .MuiInputBase-input': {
            lineHeight: 1.5,
          },
          // Increase touch target size on mobile
          ...(isMobile && {
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
            },
            '& .MuiInputLabel-root': {
              fontSize: '1rem',
            },
          }),
        }}
      />
      
      {/* Mobile-specific controls */}
      {isMobile && (
        <Box 
          sx={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'center',
            mt: 0.5,
            px: 1
          }}
        >
          <Typography 
            variant="caption" 
            color={getCharCountColor()}
            sx={{ fontWeight: value.length > (maxLength || 0) * 0.9 ? 500 : 400 }}
          >
            {maxLength ? `${value.length}/${maxLength}` : ''}
          </Typography>
          
          <Box>
            {/* Speech recognition button for mobile */}
            {deviceFeatures.hasCamera() && (
              <Tooltip title="Add image">
                <IconButton 
                  size="small" 
                  color="primary"
                  sx={{ mr: 1 }}
                >
                  <ImageIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            
            {/* Speech recognition button for mobile */}
            <Tooltip title={isRecording ? "Recording..." : "Voice input"}>
              <IconButton 
                size="small" 
                color={isRecording ? "secondary" : "primary"}
                onClick={handleSpeechRecognition}
                disabled={isRecording}
              >
                {isRecording ? <CheckIcon fontSize="small" /> : <MicIcon fontSize="small" />}
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default CommentField;