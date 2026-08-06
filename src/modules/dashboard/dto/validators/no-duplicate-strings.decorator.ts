import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
  registerDecorator,
  ValidationOptions,
} from 'class-validator';

@ValidatorConstraint({ name: 'NoDuplicateStrings', async: false })
export class NoDuplicateStrings implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    if (!Array.isArray(value)) return true;
    const seen = new Set<string>();
    for (const item of value) {
      if (typeof item === 'string') {
        if (seen.has(item)) return false;
        seen.add(item);
      }
    }
    return true;
  }

  defaultMessage(args: ValidationArguments): string {
    const value = (args.object as Record<string, unknown>)[args.property] as
      string[] | undefined;
    const seen = new Set<string>();
    const duplicates: string[] = [];
    if (Array.isArray(value)) {
      for (const item of value) {
        if (typeof item === 'string') {
          if (seen.has(item) && !duplicates.includes(item)) {
            duplicates.push(item);
          } else {
            seen.add(item);
          }
        }
      }
    }
    return JSON.stringify({
      message: 'Duplicate values are not allowed',
      duplicates,
    });
  }
}

export function NoDuplicateStringsDecorator(
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [],
      validator: NoDuplicateStrings,
    });
  };
}
