import { QuestionLogic } from '../types/survey';

export function evaluateCondition(logic: QuestionLogic, formValues: Record<string, any>): boolean {
  // Evaluate all conditions based on the logic
  const results = logic.conditions.map((condition) => {
    const value = formValues[condition.questionId];
    
    switch (condition.operator) {
      case '=':
        return value === condition.value;
      
      case '!=':
        return value !== condition.value;
      
      case '>':
        return Number(value) > Number(condition.value);
      
      case '<':
        return Number(value) < Number(condition.value);
      
      case 'contains':
        if (Array.isArray(value)) {
          return value.includes(condition.value);
        }
        return String(value).toLowerCase().includes(String(condition.value).toLowerCase());
      
      case 'in':
        if (Array.isArray(condition.value)) {
          return condition.value.includes(value);
        }
        return false;
      
      default:
        return false;
    }
  });

  // For now, we'll use AND logic for all conditions
  // This means all conditions must be true for the question to be shown
  const shouldShow = results.every((result) => result);

  // Apply the action based on the result
  switch (logic.action) {
    case 'show':
      return shouldShow;
    case 'hide':
      return !shouldShow;
    case 'skip':
      // For skip action, we hide the question if conditions are met
      return !shouldShow;
    default:
      return true;
  }
}

export function getVisibleQuestions(
  questions: Array<{ id?: string; logic?: QuestionLogic }>,
  formValues: Record<string, any>
): Set<string> {
  const visible = new Set<string>();

  questions.forEach((question) => {
    if (!question.id) return;

    if (!question.logic || question.logic.conditions.length === 0) {
      // No conditions, always visible
      visible.add(question.id);
    } else {
      // Evaluate conditions
      if (evaluateCondition(question.logic, formValues)) {
        visible.add(question.id);
      }
    }
  });

  return visible;
}

export function validateConditionalLogic(
  questions: Array<{ id?: string; logic?: QuestionLogic }>
): string[] {
  const errors: string[] = [];
  const questionIds = new Set(questions.map((q) => q.id).filter(Boolean));

  questions.forEach((question, index) => {
    if (!question.logic || !question.logic.conditions) return;

    question.logic.conditions.forEach((condition, condIndex) => {
      // Check if referenced question exists
      if (!questionIds.has(condition.questionId)) {
        errors.push(
          `Question ${index + 1}: Condition ${condIndex + 1} references non-existent question`
        );
      }

      // Check if the question references itself
      if (condition.questionId === question.id) {
        errors.push(
          `Question ${index + 1}: Cannot create condition that references itself`
        );
      }
    });
  });

  return errors;
}

export function sortQuestionsByDependencies(
  questions: Array<{ id?: string; logic?: QuestionLogic; order: number }>
): typeof questions {
  // Create a dependency graph
  const dependencies = new Map<string, Set<string>>();
  const questionMap = new Map<string, typeof questions[0]>();

  questions.forEach((question) => {
    if (!question.id) return;
    
    questionMap.set(question.id, question);
    dependencies.set(question.id, new Set());

    if (question.logic && question.logic.conditions) {
      question.logic.conditions.forEach((condition) => {
        dependencies.get(question.id)!.add(condition.questionId);
      });
    }
  });

  // Topological sort to ensure questions appear after their dependencies
  const sorted: typeof questions = [];
  const visited = new Set<string>();
  const visiting = new Set<string>();

  function visit(id: string) {
    if (visited.has(id)) return;
    if (visiting.has(id)) {
      // Circular dependency detected, skip
      return;
    }

    visiting.add(id);

    const deps = dependencies.get(id);
    if (deps) {
      deps.forEach((depId) => {
        if (questionMap.has(depId)) {
          visit(depId);
        }
      });
    }

    visiting.delete(id);
    visited.add(id);
    
    const question = questionMap.get(id);
    if (question) {
      sorted.push(question);
    }
  }

  // Visit all questions
  questions.forEach((question) => {
    if (question.id) {
      visit(question.id);
    }
  });

  // Sort by original order for questions at the same dependency level
  return sorted.sort((a, b) => a.order - b.order);
}