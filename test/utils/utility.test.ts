import { EpochError, EpochValidationError } from '../../src/errors/EpochValidationError.js';
import { getRelativeTimeDifference, validateMomentDate } from '../../src/utils/utility.js';

describe('getRelativeTimeDifference', () => {
    const currentTime = Date.now();

    it('should calculate relative time for past dates', () => {
        const pastEpoch = currentTime - 60000; // 1 minute ago
        expect(getRelativeTimeDifference(pastEpoch)).toBe('1 minutes ago');
    });

    it('should calculate relative time for future dates', () => {
        const futureEpoch = currentTime + 60000; // 1 minute from now
        expect(getRelativeTimeDifference(futureEpoch)).toBe('59 seconds from now');
    });

    it('should handle differences in seconds', () => {
        const pastEpochInMilliseconds = (currentTime - 1000); // 1 second ago
        expect(getRelativeTimeDifference(pastEpochInMilliseconds)).toBe('1 seconds ago');
    });

    it('should handle differences in hours', () => {
        const pastEpochInMilliseconds = (currentTime - 7200000); // 2 hours ago
        expect(getRelativeTimeDifference(pastEpochInMilliseconds)).toBe('2 hours 0 minutes ago');
    });

    it('should handle differences in days', () => {
        const pastEpochInMilliseconds = (currentTime - 86400000); // 1 day ago
        expect(getRelativeTimeDifference(pastEpochInMilliseconds)).toBe('1 days 0 hours ago');
    });

    it('should handle differences in months', () => {
        const pastEpoch = currentTime - 2592000000; // 30 days ago
        expect(getRelativeTimeDifference(pastEpoch)).toBe('1 months 0 days ago');
    });

    it('should handle differences in years', () => {
        const pastEpoch = currentTime - 31536000000; // 1 year ago
        expect(getRelativeTimeDifference(pastEpoch)).toBe('1 years 0 months ago');
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