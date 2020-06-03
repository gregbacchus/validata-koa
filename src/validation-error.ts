import { Issue } from 'validata';

export class ValidationError extends Error {
  constructor(public readonly issues: Issue[]) {
    super('Validation failed');

    this.name = typeof ValidationError;
    // Set the prototype explicitly.
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
