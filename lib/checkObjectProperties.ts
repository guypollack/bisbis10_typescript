export const findMissing = (
  obj: Record<string, any>,
  allowedProperties: string[]
): string[] => {
  return allowedProperties.filter(
    (property) =>
      obj[property] === undefined
  );
};

export const findForbidden = (
  obj: Record<string, any>,
  forbiddenProperties: string[]
): string[] => {
  return forbiddenProperties.filter((property) =>
    Object.keys(obj).includes(property)
  );
};

export const findUnrecognized = (
  obj: Record<string, any>,
  allowedProperties: string[],
  forbiddenProperties: string[]
): string[] => {
  return Object.keys(obj).filter(
    (property) =>
      !allowedProperties.includes(property) &&
      !forbiddenProperties.includes(property)
  );
};
