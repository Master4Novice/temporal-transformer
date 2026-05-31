import { convertEpoch, convertDateToEpoch } from '../../src/epoch/convertor.js';
import { DateTime } from 'luxon';

describe('convertEpoch', () => {
    const epoch = 1622547800000; // Example epoch value
    const format = 'yyyy-MM-dd HH:mm:ss';

    it('should convert epoch in milliseconds to human-readable dates', () => {
        const { dateTime, dateTimeInGMT, epochUnit, relative } = convertEpoch(epoch, format);
        expect(epochUnit).toBe('milliseconds');
        expect(dateTime).toMatch(/\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/);
        expect(dateTimeInGMT).toMatch(/\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/);
        expect(relative).toBeTruthy();
    });

    it('should convert epoch in milliseconds to human-readable dates default format', () => {
        const { dateTime, dateTimeInGMT, epochUnit, relative } = convertEpoch(epoch);
        expect(epochUnit).toBe('milliseconds');
        expect(dateTime).toMatch(/\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/);
        expect(dateTimeInGMT).toMatch(/\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/);
        expect(relative).toBeTruthy();
    });

    it('should convert epoch in seconds to human-readable dates', () => {
        const { dateTime, dateTimeInGMT, epochUnit, relative } = convertEpoch(epoch / 1e3, format);
        expect(epochUnit).toBe('seconds');
        expect(dateTime).toMatch(/\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/);
        expect(dateTimeInGMT).toMatch(/\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/);
        expect(relative).toBeTruthy();
    });

    it('should convert epoch in microseconds to human-readable dates', () => {
        const { dateTime, dateTimeInGMT, epochUnit, relative } = convertEpoch(epoch * 1e3, format);
        expect(epochUnit).toBe('microseconds');
        expect(dateTime).toMatch(/\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/);
        expect(dateTimeInGMT).toMatch(/\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/);
        expect(relative).toBeTruthy();
    });

    it('should convert epoch in nanoseconds to human-readable dates', () => {
        const { dateTime, dateTimeInGMT, epochUnit, relative } = convertEpoch(epoch * 1e6, format);
        expect(epochUnit).toBe('nanoseconds');
        expect(dateTime).toMatch(/\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/);
        expect(dateTimeInGMT).toMatch(/\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/);
        expect(relative).toBeTruthy();
    });

    it('should throw error', () => {
        expect(() => convertEpoch(epoch * 1e7, format)).toThrow('Invalid Epoch Unit');
    });

    it('should reject fractional epochs instead of silently misclassifying them', () => {
        // Regression: 1622547800.5 used to be read as 16225478005 ms (a 1970
        // date) by stripping the decimal. Fractional epochs are now rejected.
        expect(() => convertEpoch(1622547800.5, format)).toThrow('Whole Number');
        expect(() => convertEpoch(epoch / 1e3 + 0.5, format)).toThrow('Whole Number');
    });
});

describe('convertDateToEpoch', () => {
    const dateObj = new Date();
    const userTimezone = 'Asia/Kolkata';
    const dt = DateTime.fromJSDate(dateObj);
    const epochInSecondsIn = Math.floor(dt.toMillis() / 1000);
    const epochInMillisecondsIn = dt.toMillis();

    const gmtDateIn = dt.setZone('UTC').toFormat('yyyy-MM-dd HH:mm:ss');
    const timezoneDateIn = dt.setZone(userTimezone).toFormat('yyyy-MM-dd HH:mm:ss');

    it('should convert date to epoch values for user timezone', () => {
        const { epochInSeconds, epochInMilliseconds, dateTimeInGMT } = convertDateToEpoch(dateObj, userTimezone);
        expect(epochInSeconds).toBe(epochInSecondsIn);
        expect(epochInMilliseconds).toBe(epochInMillisecondsIn);
        expect(dateTimeInGMT).toMatch(gmtDateIn);
    });

    it('should convert date to epoch values for specific timezone', () => {
        const { epochInSeconds, epochInMilliseconds, dateTime, dateTimeInGMT } = convertDateToEpoch(dateObj, userTimezone);
        expect(epochInSeconds).toBe(epochInSecondsIn);
        expect(epochInMilliseconds).toBe(epochInMillisecondsIn);
        expect(dateTimeInGMT).toMatch(gmtDateIn);
        expect(dateTime).toBe(timezoneDateIn);
    });
});
