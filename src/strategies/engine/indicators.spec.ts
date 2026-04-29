import { calculateEMA, calculateMACD, calculateRSI } from './indicators';

describe('technical indicators', () => {
  describe('calculateEMA', () => {
    it('returns an EMA value for each input value', () => {
      const result = calculateEMA([10, 11, 12, 13], 3);

      expect(result).toEqual([10, 10.5, 11.25, 12.125]);
    });

    it('returns an empty array when EMA input is not enough', () => {
      expect(calculateEMA([10, 11], 3)).toEqual([]);
    });

    it('returns an empty array for invalid EMA periods', () => {
      expect(calculateEMA([10, 11, 12], 0)).toEqual([]);
      expect(calculateEMA([10, 11, 12], -1)).toEqual([]);
    });
  });

  describe('calculateRSI', () => {
    it('returns index-aligned RSI values with nulls before enough data exists', () => {
      const result = calculateRSI([10, 11, 12, 13], 3);

      expect(result).toEqual([null, null, null, 100]);
    });

    it('returns RSI 0 when all recent changes are losses', () => {
      const result = calculateRSI([10, 9, 8, 7], 3);

      expect(result).toEqual([null, null, null, 0]);
    });

    it('returns an empty array when RSI input is not enough', () => {
      expect(calculateRSI([10, 11, 12], 3)).toEqual([]);
    });

    it('returns an empty array for invalid RSI periods', () => {
      expect(calculateRSI([10, 11, 12], 0)).toEqual([]);
      expect(calculateRSI([10, 11, 12], -1)).toEqual([]);
    });
  });

  describe('calculateMACD', () => {
    it('returns index-aligned MACD values with nulls before enough data exists', () => {
      const result = calculateMACD([10, 10, 10, 8, 12], 2, 3, 2);

      expect(result.slice(0, 3)).toEqual([null, null, null]);
      expect(result[3]).toEqual({
        macd: expect.any(Number) as number,
        signal: expect.any(Number) as number,
        histogram: expect.any(Number) as number,
      });
      expect(result[4]).toEqual({
        macd: expect.any(Number) as number,
        signal: expect.any(Number) as number,
        histogram: expect.any(Number) as number,
      });
    });

    it('returns an empty array when MACD input is not enough', () => {
      expect(calculateMACD([10, 11, 12], 2, 3, 2)).toEqual([]);
    });

    it('returns an empty array for invalid MACD periods', () => {
      expect(calculateMACD([10, 11, 12, 13, 14], 0, 3, 2)).toEqual([]);
      expect(calculateMACD([10, 11, 12, 13, 14], 2, 0, 2)).toEqual([]);
      expect(calculateMACD([10, 11, 12, 13, 14], 2, 3, 0)).toEqual([]);
    });
  });
});
