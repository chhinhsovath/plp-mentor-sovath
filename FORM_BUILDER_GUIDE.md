# Form Builder Guide

## Overview

The PLP Mentoring Platform now includes a comprehensive form builder that allows users to create observation forms with predefined activities and indicators from the Grade 1 Khmer observation tool.

## Features

### 1. Template-Based Form Creation
- Load predefined activities and indicators from observation templates
- Currently supports Grade 1 Khmer language observation form (G1-KH)
- Templates include:
  - 4 main activities (phases)
  - 28 total indicators
  - Both scale-based (1-3) and checkbox indicators

### 2. Form Builder Page (`/forms/new`)
- **Template Loading**: Click "Load Template" button to select from available templates
- **Activity Preview**: View all activities and indicators before applying
- **Automatic Mapping**: Indicators are automatically mapped to their respective activities
- **Bilingual Support**: All content supports both English and Khmer

### 3. Sample Form Creation (`/forms/sample`)
- Step-by-step demonstration of creating a Grade 1 Khmer observation form
- Shows the complete structure with all activities and indicators
- One-click form creation with proper configuration

## How to Use

### Creating a Form from Template

1. Navigate to `/forms` and click "Create Form"
2. Click "Load Template" button in the form builder
3. Select the desired template (e.g., G1-KH)
4. Review the activities and indicators in the preview
5. Click "Apply Template" to load all activities and indicators
6. Customize form name and other settings as needed
7. Click "Save" to create the form

### Available Templates

#### G1-KH (Grade 1 Khmer)
- **Activity 1**: ការណែនាំមេរៀន (Lesson Introduction) - 7 indicators
- **Activity 2**: សកម្មភាពសិក្សា (Learning Activities) - 7 indicators  
- **Activity 3**: សង្ខេបមេរៀន (Lesson Summary) - 1 indicator
- **Activity 4**: ការវាយតម្លៃ (Assessment) - 7 indicators

### Sample Form Features

The sample form creation page demonstrates:
- Template selection process
- Form structure preview with all activities
- Automatic form generation with proper metadata
- Navigation to view the created form

## Technical Implementation

### Data Structure

```typescript
// Activity structure
interface ObservationActivity {
  id: string;
  title: string;
  titleKm: string;
  indicators: ObservationIndicator[];
}

// Indicator structure
interface ObservationIndicator {
  id: string;
  number: string;
  text: string;
  textKm: string;
  rubricType: 'scale' | 'checkbox';
  maxScore?: number;
  scales?: Scale[];
}
```

### Key Files

- `/frontend/src/data/observationFormTemplates.ts` - Template definitions
- `/frontend/src/pages/FormBuilderPage.tsx` - Main form builder interface
- `/frontend/src/pages/SampleFormCreation.tsx` - Sample form demonstration

## Future Enhancements

1. Additional templates for:
   - Grade 2-6 Khmer forms
   - Mathematics observation forms
   - Science observation forms

2. Features to add:
   - Custom indicator creation
   - Activity reordering
   - Export/import form templates
   - Form versioning with change tracking

## API Endpoints

- `GET /api/v1/forms` - List all forms
- `POST /api/v1/forms` - Create new form
- `GET /api/v1/forms/:id` - Get form details
- `PUT /api/v1/forms/:id` - Update form
- `DELETE /api/v1/forms/:id` - Delete form
- `POST /api/v1/forms/:id/publish` - Publish form
- `POST /api/v1/forms/:id/duplicate` - Duplicate form

## Testing

To test the form builder:

1. Start the backend server:
   ```bash
   cd backend
   node simple-server.js
   ```

2. Start the frontend:
   ```bash
   cd frontend
   npm run dev
   ```

3. Navigate to `http://localhost:5173/forms`
4. Click "View Sample" to see the demonstration
5. Click "Create Form" to use the form builder

## Notes

- All forms created are stored with bilingual support
- Scale indicators include detailed descriptions for each score level
- Forms can be saved as drafts or published immediately
- The system maintains form versioning for tracking changes