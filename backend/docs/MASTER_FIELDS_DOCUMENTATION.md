# Master Fields Documentation

## Overview

The `master_fields` table provides a comprehensive library of reusable form fields that can be used to build dynamic surveys and forms. It includes various question types, validation rules, and metadata for creating rich, interactive forms.

## Table Structure

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| field_code | VARCHAR(100) | Unique identifier code |
| field_name | VARCHAR(255) | Display name of the field |
| field_type | VARCHAR(50) | Type of input field |
| category | VARCHAR(100) | Field category for grouping |
| label | TEXT | Default label text |
| label_km | TEXT | Khmer translation of label |
| description | TEXT | Field description |
| description_km | TEXT | Khmer translation of description |
| placeholder | TEXT | Placeholder text |
| placeholder_km | TEXT | Khmer translation of placeholder |
| default_value | TEXT | Default value for the field |
| options | JSONB | Options for select/radio/checkbox fields |
| validation_rules | JSONB | Validation rules |
| display_conditions | JSONB | Conditional display logic |
| metadata | JSONB | Additional field configuration |
| is_system_field | BOOLEAN | Whether field is system-managed |
| is_required | BOOLEAN | Whether field is required |
| allow_multiple | BOOLEAN | Whether multiple values allowed |
| tags | TEXT[] | Tags for filtering |
| sort_order | INT | Display order |
| is_active | BOOLEAN | Whether field is active |

## Field Types

### Basic Input Types
- `text` - Single line text input
- `textarea` - Multi-line text input
- `number` - Numeric input
- `date` - Date picker
- `time` - Time picker
- `datetime` - Date and time picker
- `email` - Email input with validation
- `phone` - Phone number with formatting
- `url` - URL input with validation
- `password` - Password input
- `hidden` - Hidden field

### Selection Types
- `select` - Dropdown list (single selection)
- `multiselect` - Multiple selection dropdown
- `radio` - Radio buttons
- `checkbox` - Checkbox group
- `toggle` - On/off switch

### Location Types
- `location` - Map-based location picker
- `gps` - GPS coordinates capture
- `address` - Address fields

### Media Types
- `image` - Image upload/capture
- `audio` - Audio recording
- `video` - Video recording
- `file` - General file upload

### Special Types
- `rating` - Star rating
- `scale` - Likert scale
- `slider` - Value slider
- `matrix` - Matrix/grid questions
- `signature` - Digital signature
- `sketch` - Drawing pad
- `barcode` - Barcode scanner
- `qrcode` - QR code scanner
- `color` - Color picker

## Field Categories

- `basic` - Basic input fields
- `contact` - Contact information fields
- `demographic` - Demographic data fields
- `education` - Education-related fields
- `health` - Health data fields
- `financial` - Financial information
- `location` - Location/address fields
- `media` - Media upload fields
- `assessment` - Assessment/evaluation fields
- `feedback` - Feedback collection
- `identification` - ID/document fields
- `preference` - User preferences
- `administrative` - System/admin fields
- `custom` - Custom fields

## Validation Rules

Validation rules are stored as JSON arrays with the following structure:

```json
{
  "type": "validation_type",
  "value": "validation_value",
  "message": "Error message",
  "message_km": "Khmer error message"
}
```

Common validation types:
- `required` - Field is required
- `minLength` - Minimum text length
- `maxLength` - Maximum text length
- `min` - Minimum numeric value
- `max` - Maximum numeric value
- `pattern` - Regex pattern
- `email` - Email format
- `phone` - Phone format
- `url` - URL format
- `numeric` - Numeric only
- `fileType` - Allowed file types
- `maxFileSize` - Maximum file size (MB)

## Metadata Structure

The metadata field contains additional configuration specific to each field type:

### Text Fields
```json
{
  "icon": "text-fields",
  "autocomplete": "off",
  "mask": "pattern",
  "maxLength": 255
}
```

### Number Fields
```json
{
  "icon": "numbers",
  "min": 0,
  "max": 100,
  "step": 1,
  "prefix": "$",
  "suffix": "%"
}
```

### Select/Radio/Checkbox Options
```json
{
  "label": "Option Label",
  "label_km": "Khmer Label",
  "value": "option_value",
  "order": 1,
  "color": "#FF0000",
  "icon": "icon-name",
  "description": "Option description"
}
```

### Location Fields
```json
{
  "mapConfig": {
    "defaultLat": 11.5564,
    "defaultLng": 104.9282,
    "defaultZoom": 12,
    "enableSearch": true,
    "enableGeolocation": true
  }
}
```

### Media Fields
```json
{
  "accept": ["image/jpeg", "image/png"],
  "capture": "camera",
  "maxFileSize": 10,
  "multiple": false,
  "maxDuration": 300
}
```

## Usage Example

To use master fields in your survey forms:

1. Query the `master_fields` table for active fields in your desired category
2. Filter by tags or field types as needed
3. Use the field configuration to dynamically generate form inputs
4. Apply validation rules and display conditions
5. Handle multilingual labels using `label` and `label_km` fields

## Seeded Data

The system comes with 50+ pre-configured master fields covering common use cases:
- Basic form inputs (text, number, date, etc.)
- Contact information (email, phone, address)
- Demographic data (age, gender, education)
- Location fields (GPS, map selection)
- Media uploads (photo, video, audio)
- Assessment tools (ratings, scales, matrices)
- Identification (ID numbers, QR codes)
- Special inputs (signature, sketch, color picker)

Each field is fully configured with:
- Bilingual labels (English and Khmer)
- Appropriate validation rules
- Helpful placeholders and descriptions
- Relevant metadata for enhanced functionality
- Proper categorization and sorting

## API Integration

When building survey forms through the API at `/admin/surveys/new`:

1. Fetch available master fields:
   ```
   GET /api/master-fields?category=basic&is_active=true
   ```

2. Users can select fields from the master library
3. Selected fields are added to the survey with their full configuration
4. Field properties can be customized per survey if needed
5. Validation and display logic is automatically applied

This system allows for rapid form development while maintaining consistency and reusability across the platform.