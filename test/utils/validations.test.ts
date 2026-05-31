import { getEpochUnitAndEpochInMiliseconds, validTimezone } from '../../src/utils/validations.js';
import { EpochUnit } from '../../src/types/index.js';
import { EpochError, EpochValidationError } from '../../src/errors/EpochValidationError.js';

describe('getEpochUnitAndEpochInMiliseconds', () => {
    test('should throw error when epoch is unknown unit', () => {
        expect(() => getEpochUnitAndEpochInMiliseconds(Number.MAX_SAFE_INTEGER * 1e4)).toThrow(new EpochValidationError(EpochError.EpochUnit));
    });

    test('should get epoch unit seconds and epoch in miliseconds', () => {
        const epoch = 1722093244;
        const data = getEpochUnitAndEpochInMiliseconds(epoch);
        expect(EpochUnit.SECONDS).toBe(data.epochUnit);
        expect(1722093244000).toBe(data.epochInMilliseconds);
    });

    test('should get epoch unit seconds and epoch in miliseconds for negative epoch', () => {
        const epoch = -1722093244;
        const data = getEpochUnitAndEpochInMiliseconds(epoch);
        expect(EpochUnit.SECONDS).toBe(data.epochUnit);
        expect(-1722093244000).toBe(data.epochInMilliseconds);
    });

    test('should get epoch unit and epoch in miliseconds', () => {
        const epoch = 1722093244504;
        const data = getEpochUnitAndEpochInMiliseconds(epoch);
        expect(EpochUnit.MILLI_SECONDS).toBe(data.epochUnit);
        expect(1722093244504).toBe(data.epochInMilliseconds);
    });

    test('should get epoch unit microseconds and epoch in miliseconds', () => {
        const epoch = 1722093244504001;
        const data = getEpochUnitAndEpochInMiliseconds(epoch);
        expect(EpochUnit.MICRO_SECONDS).toBe(data.epochUnit);
        expect(1722093244504).toBe(data.epochInMilliseconds);
    });

    test('should get epoch unit nanoseconds and epoch in miliseconds', () => {
        const epoch = 1722093244504600600;
        const data = getEpochUnitAndEpochInMiliseconds(epoch);
        expect(EpochUnit.NANO_SECONDS).toBe(data.epochUnit);
        expect(1722093244504).toBe(data.epochInMilliseconds);
    });

    test('should reject fractional epochs (ambiguous) with NotAnInteger', () => {
        expect(() => getEpochUnitAndEpochInMiliseconds("123.4567891")).toThrow(new EpochValidationError(EpochError.NotAnInteger));
        expect(() => getEpochUnitAndEpochInMiliseconds(1622547800.5)).toThrow(new EpochValidationError(EpochError.NotAnInteger));
        expect(() => getEpochUnitAndEpochInMiliseconds("-123.4561203")).toThrow(new EpochValidationError(EpochError.NotAnInteger));
    });

    test('should convert integer string numbers to number', () => {
        expect(getEpochUnitAndEpochInMiliseconds("1234567890").epochInMilliseconds).toBe(1234567890000);
        expect(getEpochUnitAndEpochInMiliseconds("-1234567890").epochInMilliseconds).toBe(-1234567890000);
    });

    test('should throw error when epoch is not a number or cannot be parsed as a number', () => {
        expect(() => getEpochUnitAndEpochInMiliseconds("not a number")).toThrow(new EpochValidationError(EpochError.NotANumber));
        expect(() => getEpochUnitAndEpochInMiliseconds({})).toThrow(new EpochValidationError(EpochError.NotANumber));
        expect(() => getEpochUnitAndEpochInMiliseconds([])).toThrow(new EpochValidationError(EpochError.NotANumber));
    });

    test('should throw error when epoch is undefined', () => {
        expect(() => getEpochUnitAndEpochInMiliseconds(undefined)).toThrow(new EpochValidationError(EpochError.UndefinedOrNull));
    });

    test('should throw error when epoch is null', () => {
        expect(() => getEpochUnitAndEpochInMiliseconds(null)).toThrow(new EpochValidationError(EpochError.UndefinedOrNull));
    });

    test('should throw error when epoch is empty string', () => {
        expect(() => getEpochUnitAndEpochInMiliseconds("")).toThrow(new EpochValidationError(EpochError.Empty));
    });

    test('should throw error for Infinity', () => {
        expect(() => getEpochUnitAndEpochInMiliseconds(Infinity)).toThrow(new EpochValidationError(EpochError.NotANumber));
        expect(() => getEpochUnitAndEpochInMiliseconds(-Infinity)).toThrow(new EpochValidationError(EpochError.NotANumber));
    });

    test('should throw error for NaN', () => {
        expect(() => getEpochUnitAndEpochInMiliseconds(NaN)).toThrow(new EpochValidationError(EpochError.NotANumber));
    });

    test('should handle whitespace-only string', () => {
        expect(() => getEpochUnitAndEpochInMiliseconds("   ")).toThrow(new EpochValidationError(EpochError.Empty));
    });

});

describe('validTimezone', () => {

    test('should be valid timezone', () => {
        expect(validTimezone("GMT")).not.toBeDefined();
    });

    test('should be invalid timezone', () => {
        expect(() => validTimezone("Amer/Bue")).toThrow(new EpochValidationError(EpochError.TimezoneError));
    });

});