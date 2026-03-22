// Tests for isometric coordinate math (engine.js lines 17-29)
// Functions are redefined here because the game files use globals, not modules.

const TW = 64, TH = 32;
const isoX = (c, r) => (c - r) * (TW / 2);
const isoY = (c, r) => (c + r) * (TH / 2);
const toScreen = (c, r, offX = 0, offY = 0) => ({
  x: isoX(c, r) + offX,
  y: isoY(c, r) + offY,
});
const toTile = (sx, sy, offX = 0, offY = 0) => {
  const wx = sx - offX, wy = sy - offY;
  return {
    col: Math.round((wx / (TW / 2) + wy / (TH / 2)) / 2),
    row: Math.round((wy / (TH / 2) - wx / (TW / 2)) / 2),
  };
};

describe('isoX / isoY', () => {
  it('origin is (0, 0)', () => {
    expect(isoX(0, 0)).toBe(0);
    expect(isoY(0, 0)).toBe(0);
  });

  it('isoX increases with col, decreases with row', () => {
    expect(isoX(1, 0)).toBeGreaterThan(isoX(0, 0));
    expect(isoX(0, 1)).toBeLessThan(isoX(0, 0));
  });

  it('isoY increases with both col and row', () => {
    expect(isoY(1, 0)).toBeGreaterThan(isoY(0, 0));
    expect(isoY(0, 1)).toBeGreaterThan(isoY(0, 0));
  });

  it('known value: col=2, row=0 → x=64, y=32', () => {
    expect(isoX(2, 0)).toBe(64);
    expect(isoY(2, 0)).toBe(32);
  });

  it('known value: col=0, row=2 → x=-64, y=32', () => {
    expect(isoX(0, 2)).toBe(-64);
    expect(isoY(0, 2)).toBe(32);
  });
});

describe('toScreen / toTile round-trip', () => {
  const cases = [[0, 0], [1, 0], [0, 1], [5, 3], [10, 10], [20, 23]];

  for (const [c, r] of cases) {
    it(`col=${c}, row=${r} survives round-trip`, () => {
      const { x, y } = toScreen(c, r);
      const { col, row } = toTile(x, y);
      expect(col).toBe(c);
      expect(row).toBe(r);
    });
  }

  it('respects offset in toScreen and toTile', () => {
    const offX = 100, offY = 50;
    const { x, y } = toScreen(5, 3, offX, offY);
    const { col, row } = toTile(x, y, offX, offY);
    expect(col).toBe(5);
    expect(row).toBe(3);
  });
});
