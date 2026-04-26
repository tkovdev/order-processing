export const getLocationName = (name: string): string => name.replace(/_/g, ' ');
export const getLocationURLSafeName = (name: string): string => name.replace(/ /g, '_');
