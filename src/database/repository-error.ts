import {
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';

type DatabaseError = {
  code?: unknown;
};

export function mapRepositoryError(
  error: unknown,
  conflictMessage: string,
): never {
  if (isDatabaseError(error) && error.code === '23505') {
    throw new ConflictException(conflictMessage);
  }

  throw new InternalServerErrorException('Database operation failed');
}

function isDatabaseError(error: unknown): error is DatabaseError {
  return typeof error === 'object' && error !== null && 'code' in error;
}
