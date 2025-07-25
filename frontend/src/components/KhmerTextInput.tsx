import React, { useState, useEffect } from 'react';
import { 
  TextField, 
  InputAdornment, 
  IconButton, 
  Tooltip, 
  Typography,
  FormHelperText
} from '@mui/material';
import { 
  Keyboard as KeyboardIcon,
  Error as ErrorIcon,
  Check as CheckIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { validateKhmerText } from '../utils/localization';
import { 
  KhmerTextInputProps, 
  validateKhmerTextInput, 
  suggestKhmerKeyboard 
} from '../utils/khmerInputValidation';

const KhmerTextInput: React.FC<KhmerTextInputProps> = ({
  value,
  onChange,
  options = {},
  placeholder,
  label,
  helperText,
  error = false,
  required = false,
  disabled = false,
  fullWidth = true,
  multiline = false,
  rows = 1,
  maxRows,
  className,
  style,
  id,
  name,
  autoFocus = false,
  autoComplete,
  inputProps = {},
}) => {
  const { t } = useTranslation();
  const [validationResult, setValidationResult] = useState({ 
    isValid: true, 
    errorMessage: undefined as string | undefined,
    context: undefined as Record<string, any> | undefined
  });
  const [showKeyboardHint, setShowKeyboardHint] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  // Validate on value change
  useEffect(() => {
    if (value) {
      const result = validateKhmerTextInput(value, {
        required,
        ...options
      });
      setValidationResult(result);
      
      // Show keyboard hint if text is not Khmer and Khmer is required
      if (options.requireKhmerScript && !validateKhmerText(value) && value.trim() !== '') {
        setShowKeyboardHint(true);
      } else {
        setShowKeyboardHint(false);
      }
    } else {
      // Reset validation for empty value unless required
      setValidationResult({ 
        isValid: !required, 
        errorMessage: required ? 'errors.validation.required' : undefined,
        context: undefined
      });
      setShowKeyboardHint(false);
    }
  }, [value, required, options]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  const showKeyboardHelp = () => {
    alert(suggestKhmerKeyboard());
  };

  // Determine if we should show an error
  const showError = error || !validationResult.isValid;
  
  // Determine helper text to display
  const displayHelperText = showError && validationResult.errorMessage 
    ? t(validationResult.errorMessage, validationResult.context || {})
    : helperText;

  return (
    <>
      <TextField
        value={value}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={placeholder}
        label={label}
        error={showError}
        required={required}
        disabled={disabled}
        fullWidth={fullWidth}
        multiline={multiline}
        rows={rows}
        maxRows={maxRows}
        className={className}
        style={style}
        id={id}
        name={name}
        autoFocus={autoFocus}
        autoComplete={autoComplete}
        inputProps={{
          lang: 'km',
          dir: 'ltr',
          ...inputProps
        }}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              {showKeyboardHint && (
                <Tooltip title={t('inputs.enableKhmerKeyboard')}>
                  <IconButton
                    edge="end"
                    onClick={showKeyboardHelp}
                    size="small"
                    color="warning"
                  >
                    <KeyboardIcon />
                  </IconButton>
                </Tooltip>
              )}
              {isFocused && value && options.requireKhmerScript && (
                <Tooltip title={validateKhmerText(value) ? t('inputs.validKhmerText') : t('inputs.invalidKhmerText')}>
                  <IconButton
                    edge="end"
                    size="small"
                    color={validateKhmerText(value) ? "success" : "error"}
                    disabled
                  >
                    {validateKhmerText(value) ? <CheckIcon /> : <ErrorIcon />}
                  </IconButton>
                </Tooltip>
              )}
            </InputAdornment>
          )
        }}
        helperText={displayHelperText}
      />
      {showKeyboardHint && (
        <FormHelperText error>
          <Typography variant="caption" color="error">
            {t('inputs.khmerKeyboardRequired')}
          </Typography>
        </FormHelperText>
      )}
    </>
  );
};

export default KhmerTextInput;