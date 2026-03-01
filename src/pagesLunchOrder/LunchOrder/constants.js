// src/pages/Lunch/UserOrderSlide/constants.js
export const ALL_TYPES = ["re", "ws", "ot"];

export const EMPTY_SNAPSHOT = {
  user: {},
  sec: {},
  selBr: {},
  qtyBr: {},
  qtyEntry: {},
  skip: {},
  userPick: {},
};

export const makeLastSavedInit = () => ({
  re: { ...EMPTY_SNAPSHOT },
  ws: { ...EMPTY_SNAPSHOT },
  ot: { ...EMPTY_SNAPSHOT },
});
