let sequence = 0;

/**
 * Unique key for list items created on the device. Includes a time part so
 * keys stay unique after an app restart restores persisted items.
 */
export const nextKey = () => `${Date.now().toString(36)}-${++sequence}`;
