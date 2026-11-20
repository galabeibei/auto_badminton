import { describe, expect, it } from 'vitest';
import { parseMmrInput } from './mmrInput';

describe('parseMmrInput', () => {
  it('accepts a plain number, with or without surrounding spaces', () => {
    expect(parseMmrInput('1200')).toBe(1200);
    expect(parseMmrInput('  980  ')).toBe(980);
  });

  it('accepts both ends of the allowed range', () => {
    expect(parseMmrInput('0')).toBe(0);
    expect(parseMmrInput('5000')).toBe(5000);
  });

  it('rejects anything outside the allowed range', () => {
    expect(parseMmrInput('5001')).toBeNull();
    expect(parseMmrInput('-1')).toBeNull();
  });

  it('rejects empty, partial and non-numeric input instead of guessing', () => {
    expect(parseMmrInput('')).toBeNull();
    expect(parseMmrInput('   ')).toBeNull();
    expect(parseMmrInput('1200abc')).toBeNull();
    expect(parseMmrInput('12.5')).toBeNull();
    expect(parseMmrInput('一千二')).toBeNull();
  });
});
