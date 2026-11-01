import { age, aujourdhuiIso, dateFr } from './age';

describe('age', () => {
  it('counts a year only once the birthday of the year is reached', () => {
    expect(age('2004-03-15', new Date(2026, 2, 14))).toBe(21);   // the day before
    expect(age('2004-03-15', new Date(2026, 2, 15))).toBe(22);   // the birthday
    expect(age('2004-03-15', new Date(2026, 10, 1))).toBe(22);
  });

  it('handles a birth on 29 February: one more year on 1 March of a non-leap year', () => {
    expect(age('2004-02-29', new Date(2025, 1, 28))).toBe(20);
    expect(age('2004-02-29', new Date(2025, 2, 1))).toBe(21);
  });

  it('formats a date as dd/MM/yyyy and today as yyyy-MM-dd, without time zone shift', () => {
    expect(dateFr('2004-03-05')).toBe('05/03/2004');
    expect(aujourdhuiIso(new Date(2026, 0, 9))).toBe('2026-01-09');
  });
});
