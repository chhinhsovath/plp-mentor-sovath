

{
  "project": "Dynamic Survey Module”,
  "technologies": {
    "backend": "NestJS 10 + TypeORM",
    "frontend": "React 18 + TypeScript",
    "database": "PostgreSQL"
  },
  "features": {
    "surveyBuilder": {
      "dragAndDropOrdering": true,
      "questionTypes": [
        "text",
        "textarea",
        "number",
        "date",
        "time",
        "select",
        "radio",
        "checkbox",
        "file",
        "location",
        "audio",
        "video"
      ],
      "conditionalLogic": "simple if/else operators (=, !=)",
      "optionFields": "Allow 'Other' option for multiple-choice questions",
      "grouping": "Support grouping multiple questions on one page",
      "branching": "Repeatable groups to list multiple sets of sub‑questions",
      "validation": "Required fields and type-specific validation"
    },
    "surveyForm": {
      "dynamicRendering": "Render inputs based on question type",
      "conditionalLogic": "Hide or show questions based on previous answers",
      "fileUpload": "Support file/audio/video uploads",
      "geolocation": "Capture latitude and longitude via HTML5 Geolocation API",
      "branchEntries": "Allow adding multiple entries for repeatable groups",
      "responseSubmission": "Submit answers and files via multipart/form-data"
    },
    "backendAPI": {
      "endpoints": [
        "POST /surveys – create new survey with questions",
        "GET /surveys – list surveys",
        "GET /surveys/:slug – get survey with questions",
        "PUT /surveys/:id – update survey and questions",
        "DELETE /surveys/:id – delete survey",
        "POST /surveys/:id/responses – submit survey responses",
        "GET /surveys/:id/export – export responses as CSV/JSON"
      ],
      "entities": [
        "Survey { id, title, slug, description, questions }",
        "Question { id, surveyId, type, label, required, order, options, logic, parentQuestionId, groupId }",
        "Response { id, surveyId, userId?, uuid, submittedAt, answers }",
        "Answer { id, responseId, questionId, answer }"
      ],
      "fileStorage": "Use Multer with diskStorage to save uploaded files",
      "slugGeneration": "Generate unique slugs from survey titles",
      "dataExport": "Compose CSV with headers from question labels and answers"
    },
    "extensibility": {
      "mediaSupport": {
        "audio": "Accept audio uploads with configurable MIME types",
        "video": "Accept video uploads with configurable MIME types"
      },
      "geolocation": {
        "description": "Use navigator.geolocation.getCurrentPosition() to capture lat/long and store as JSON answer",
        "reference": "HTML5 Geolocation API usage:contentReference[oaicite:2]{index=2}"
      },
      "branching": {
        "description": "Implement repeatable groups by linking child questions via parentQuestionId",
        "behaviour": "User can add multiple instances of sub‑questions"
      },
      "grouping": {
        "description": "Display questions grouped by groupId in one section"
      },
      "export": {
        "formats": ["csv", "json"],
        "endpoint": "GET /surveys/:id/export"
      }
    }
  },
  "userInterface": {
    "admin": {
      "route": "/admin",
      "components": ["SurveyBuilder"],
      "functions": ["create/edit surveys", "drag‑and‑drop questions", "define logic and options"]
    },
    "public": {
      "routePattern": "/survey/:slug",
      "components": ["SurveyForm"],
      "functions": ["display survey title/description", "render questions", "submit responses", "show thank‑you message"]
    }
  },
  "notes": "Authentication/authorization should be added to protect admin routes.  Consider adding role-based guards in NestJS and a login flow in React."
}
