import {
  IsBoolean,
  IsEnum,
  IsObject,
  IsString,
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';
import { StrategyKey } from '../strategy-config.constants';

function IsPlainObject(validationOptions?: ValidationOptions) {
  return function (target: object, propertyName: string) {
    registerDecorator({
      name: 'isPlainObject',
      target: target.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown) {
          return (
            typeof value === 'object' && value !== null && !Array.isArray(value)
          );
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be an object`;
        },
      },
    });
  };
}

export class StrategyConfigParamsDto {
  @IsString()
  watchlistId!: string;

  @IsEnum(StrategyKey)
  strategyKey!: StrategyKey;
}

export class StrategyConfigsParamsDto {
  @IsString()
  watchlistId!: string;
}

export class UpsertStrategyConfigDto {
  @IsBoolean()
  enabled!: boolean;

  @IsObject()
  @IsPlainObject()
  paramsJson!: Record<string, unknown>;
}
