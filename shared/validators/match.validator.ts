import { ValidationArguments, ValidationOptions, registerDecorator } from 'class-validator';

export function Match(property: string, validationOptions?: ValidationOptions) {
  return (object: object, propertyName: string) => {
    registerDecorator({
      name: 'Match',
      target: object.constructor,
      propertyName,
      constraints: [property],
      options: validationOptions,
      validator: {
        validate(value: unknown, args: ValidationArguments) {
          const [relatedPropertyName] = args.constraints;
          return (args.object as Record<string, unknown>)[relatedPropertyName] === value;
        },
      },
    });
  };
}
