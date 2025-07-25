import { 
  registerDecorator, 
  ValidationOptions, 
  ValidatorConstraint, 
  ValidatorConstraintInterface,
  ValidationArguments 
} from 'class-validator';

// Strong password validator
@ValidatorConstraint({ async: false })
export class IsStrongPasswordConstraint implements ValidatorConstraintInterface {
  validate(password: string, args: ValidationArguments) {
    if (!password) return false;
    
    // At least 8 characters
    if (password.length < 8) return false;
    
    // At least one uppercase letter
    if (!/[A-Z]/.test(password)) return false;
    
    // At least one lowercase letter
    if (!/[a-z]/.test(password)) return false;
    
    // At least one number
    if (!/\d/.test(password)) return false;
    
    // At least one special character
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) return false;
    
    // No common patterns
    const commonPatterns = [
      /123456/,
      /password/i,
      /qwerty/i,
      /admin/i,
      /letmein/i,
    ];
    
    for (const pattern of commonPatterns) {
      if (pattern.test(password)) return false;
    }
    
    return true;
  }

  defaultMessage(args: ValidationArguments) {
    return 'Password must be at least 8 characters long and contain uppercase, lowercase, number, and special character';
  }
}

export function IsStrongPassword(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsStrongPasswordConstraint,
    });
  };
}

// Safe HTML validator (prevent XSS)
@ValidatorConstraint({ async: false })
export class IsSafeHtmlConstraint implements ValidatorConstraintInterface {
  validate(text: string, args: ValidationArguments) {
    if (!text) return true;
    
    // Check for potentially dangerous HTML tags and attributes
    const dangerousPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
      /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
      /<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi,
      /<form\b[^<]*(?:(?!<\/form>)<[^<]*)*<\/form>/gi,
      /javascript:/gi,
      /vbscript:/gi,
      /on\w+\s*=/gi, // Event handlers like onclick, onload, etc.
      /<meta\b[^>]*>/gi,
      /<link\b[^>]*>/gi,
    ];
    
    for (const pattern of dangerousPatterns) {
      if (pattern.test(text)) return false;
    }
    
    return true;
  }

  defaultMessage(args: ValidationArguments) {
    return 'Text contains potentially unsafe HTML content';
  }
}

export function IsSafeHtml(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsSafeHtmlConstraint,
    });
  };
}

// SQL injection prevention validator
@ValidatorConstraint({ async: false })
export class IsSafeSqlConstraint implements ValidatorConstraintInterface {
  validate(text: string, args: ValidationArguments) {
    if (!text) return true;
    
    // Check for SQL injection patterns
    const sqlPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/gi,
      /(\b(UNION|OR|AND)\b.*\b(SELECT|INSERT|UPDATE|DELETE)\b)/gi,
      /(--|\/\*|\*\/)/g,
      /(\b(SCRIPT|JAVASCRIPT|VBSCRIPT)\b)/gi,
      /(\b(CHAR|NCHAR|VARCHAR|NVARCHAR)\b\s*\(\s*\d+\s*\))/gi,
    ];
    
    for (const pattern of sqlPatterns) {
      if (pattern.test(text)) return false;
    }
    
    return true;
  }

  defaultMessage(args: ValidationArguments) {
    return 'Text contains potentially unsafe SQL content';
  }
}

export function IsSafeSql(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsSafeSqlConstraint,
    });
  };
}

// File upload security validator
@ValidatorConstraint({ async: false })
export class IsSecureFileConstraint implements ValidatorConstraintInterface {
  validate(filename: string, args: ValidationArguments) {
    if (!filename) return false;
    
    // Check file extension
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.pdf', '.doc', '.docx', '.xls', '.xlsx'];
    const extension = filename.toLowerCase().substring(filename.lastIndexOf('.'));
    
    if (!allowedExtensions.includes(extension)) return false;
    
    // Check for dangerous filenames
    const dangerousPatterns = [
      /\.\./g, // Directory traversal
      /[<>:"|?*]/g, // Invalid filename characters
      /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i, // Windows reserved names
      /^\./g, // Hidden files
    ];
    
    for (const pattern of dangerousPatterns) {
      if (pattern.test(filename)) return false;
    }
    
    return true;
  }

  defaultMessage(args: ValidationArguments) {
    return 'Filename is not secure or contains invalid characters';
  }
}

export function IsSecureFile(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsSecureFileConstraint,
    });
  };
}