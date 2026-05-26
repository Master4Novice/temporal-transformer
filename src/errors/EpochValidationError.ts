export enum EpochError {
  UndefinedOrNull = 'Epoch Is Undefined Or Null',
  NotANumber = 'Epoch Is Not A Number Or Cannot Be Parsed As A Number',
  OutOfRange = 'Epoch Is Out Of The Valid Range',
  EpochUnit = 'Invalid Epoch Unit',
  Empty = 'Epoch Is Empty',
  DateError = 'Invalid Date Format Or Value',
  TimezoneError = 'Unknown Timezone',
  ParseError = 'Cannot Parse The Provided Date String',
  RangeError = 'Invalid Range: fromEpoch Must Be Less Than Or Equal To toEpoch',
  InputTooLong = 'Input String Exceeds Maximum Allowed Length',
  FormatTooLong = 'Format String Exceeds Maximum Allowed Length',
  FormatInvalid = 'Format String Contains An Unsupported Token (See Supported Luxon Tokens In SUPPORTED_FORMAT_TOKENS)',
  ClockOutOfRange = 'System Clock Returned A Value Outside JavaScript Date Range',
}

export class EpochValidationError extends Error {
  constructor(message: EpochError) {
    super(message);
    this.name = 'EpochValidationError';
  }
}
