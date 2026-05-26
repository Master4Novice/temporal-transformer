import { EpochError, EpochValidationError } from '../../src/errors/EpochValidationError.js';
import { getRelativeTimeDifference, validateMomentDate } from '../../src/utils/utility.js';

describe('getRelativeTimeDifference', () => {
    // Re-capture inside each test for deterministic bucketing.
    it('should calculate relative time for past dates', () => {
        const pastEpoch = Date.now() - 60000; // 1 minute ago
        expect(getRelativeTimeDifference(pastEpoch)).toBe('1 minute ago');
    });

    it('should calculate relative time for future dates', () => {
        const futureEpoch = Date.now() + 60000; // 1 minute from now
        // Function re-reads Date.now() — a few ms elapse, so the diff is < 60000ms.
        // The result lands in the seconds bucket.
        expect(getRelativeTimeDifference(futureEpoch)).toMatch(/^(59 seconds|1 minute) from now$/);
    });

    it('should handle differences in seconds (singular)', () => {
        const pastEpoch = Date.now() - 1000; // 1 second ago
        expect(getRelativeTimeDifference(pastEpoch)).toBe('1 second ago');
    });

    it('should handle differences in seconds (plural)', () => {
        const pastEpoch = Date.now() - 5000;
        expect(getRelativeTimeDifference(pastEpoch)).toBe('5 seconds ago');
    });

    it('should handle differences in hours', () => {
        const pastEpoch = Date.now() - 7200000; // 2 hours ago
        expect(getRelativeTimeDifference(pastEpoch)).toBe('2 hours 0 minutes ago');
    });

    it('should handle 1 hour singular grammar', () => {
        const pastEpoch = Date.now() - 3700000; // 1h 1m 40s
        expect(getRelativeTimeDifference(pastEpoch)).toBe('1 hour 1 minute ago');
    });

    it('should handle differences in days', () => {
        const pastEpoch = Date.now() - 86400000; // 1 day ago
        expect(getRelativeTimeDifference(pastEpoch)).toBe('1 day 0 hours ago');
    });

    it('should handle differences in months', () => {
        const pastEpoch = Date.now() - 2592000000; // 30 days ago
        expect(getRelativeTimeDifference(pastEpoch)).toBe('1 month 0 days ago');
    });

    it('should handle differences in years', () => {
        const pastEpoch = Date.now() - 31536000000; // 1 year ago
        expect(getRelativeTimeDifference(pastEpoch)).toBe('1 year 0 months ago');
    });
});

describe('validateMomentDate', () => {

    it('should throw error invalid date', () => {
        const invalidDate = new Date('invalid date string');
        expect(() => validateMomentDate(invalidDate)).toThrow(new EpochValidationError(EpochError.DateError));
    });

    it('should throw not throw error for date', () => {
        const validDate = new Date(2024, 1, 1);
        expect(() => validateMomentDate(validDate)).not.toThrow(new EpochValidationError(EpochError.DateError));
    });
});