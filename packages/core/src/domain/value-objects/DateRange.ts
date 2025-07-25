import { startOfDay, endOfDay, isAfter, isBefore, isEqual } from 'date-fns';

export class DateRange {
  private readonly _startDate: Date;
  private readonly _endDate: Date;

  constructor(startDate: Date, endDate: Date) {
    const start = startOfDay(startDate);
    const end = endOfDay(endDate);
    
    if (isAfter(start, end)) {
      throw new Error('Start date cannot be after end date');
    }
    
    this._startDate = start;
    this._endDate = end;
  }

  get startDate(): Date {
    return this._startDate;
  }

  get endDate(): Date {
    return this._endDate;
  }

  contains(date: Date): boolean {
    const targetDate = startOfDay(date);
    return (isEqual(targetDate, this._startDate) || isAfter(targetDate, this._startDate)) &&
           (isEqual(targetDate, this._endDate) || isBefore(targetDate, this._endDate));
  }

  overlaps(other: DateRange): boolean {
    return this.contains(other._startDate) || 
           this.contains(other._endDate) ||
           other.contains(this._startDate) ||
           other.contains(this._endDate);
  }

  getDurationInDays(): number {
    const diffTime = Math.abs(this._endDate.getTime() - this._startDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  }

  equals(other: DateRange): boolean {
    return isEqual(this._startDate, other._startDate) && 
           isEqual(this._endDate, other._endDate);
  }

  toString(): string {
    const formatter = new Intl.DateTimeFormat('pt-BR');
    return `${formatter.format(this._startDate)} - ${formatter.format(this._endDate)}`;
  }

  toJSON(): { startDate: string; endDate: string } {
    return {
      startDate: this._startDate.toISOString(),
      endDate: this._endDate.toISOString(),
    };
  }

  static fromJSON(json: { startDate: string; endDate: string }): DateRange {
    return new DateRange(
      new Date(json.startDate),
      new Date(json.endDate)
    );
  }

  static currentMonth(): DateRange {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return new DateRange(start, end);
  }

  static currentYear(): DateRange {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    const end = new Date(now.getFullYear(), 11, 31);
    return new DateRange(start, end);
  }

  static lastDays(days: number): DateRange {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days + 1);
    return new DateRange(start, end);
  }
}