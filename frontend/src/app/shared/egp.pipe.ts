import { Pipe, PipeTransform } from '@angular/core';
import { formatEgp } from '../core/utils';

/** `{{ 1290 | egp }}` → "EGP 1,290" */
@Pipe({ name: 'egp' })
export class EgpPipe implements PipeTransform {
  transform(value: number | null | undefined, withUnit = true): string {
    return withUnit ? `EGP ${formatEgp(value)}` : formatEgp(value);
  }
}
