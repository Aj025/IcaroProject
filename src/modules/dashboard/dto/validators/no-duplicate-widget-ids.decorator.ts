import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
  registerDecorator,
  ValidationOptions,
} from 'class-validator';
import type { WidgetInstance } from '../../constants/default-layout.js';

@ValidatorConstraint({ name: 'NoDuplicateWidgetIds', async: false })
export class NoDuplicateWidgetIds implements ValidatorConstraintInterface {
  validate(widgets: unknown): boolean {
    if (!Array.isArray(widgets)) return true;
    const seen = new Set<string>();
    for (const w of widgets as WidgetInstance[]) {
      if (w && typeof w.id === 'string') {
        if (seen.has(w.id)) return false;
        seen.add(w.id);
      }
    }
    return true;
  }

  defaultMessage(args: ValidationArguments): string {
    const widgets = (args.object as { widgets?: WidgetInstance[] }).widgets ?? [];
    const seen = new Set<string>();
    const duplicates: string[] = [];
    for (const w of widgets) {
      if (w && typeof w.id === 'string') {
        if (seen.has(w.id) && !duplicates.includes(w.id)) {
          duplicates.push(w.id);
        } else {
          seen.add(w.id);
        }
      }
    }
    return JSON.stringify({
      message: 'Duplicate widget IDs are not allowed',
      duplicates,
    });
  }
}

export function NoDuplicateWidgetIdsDecorator(
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [],
      validator: NoDuplicateWidgetIds,
    });
  };
}
