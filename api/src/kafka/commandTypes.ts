export const CommandType = {
  PURCHASE_ITEM: 'PURCHASE_ITEM',
} as const;

export type CommandType = typeof CommandType[keyof typeof CommandType];
