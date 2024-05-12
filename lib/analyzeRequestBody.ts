export const findMissing = (
  reqBody: Record<string, any>,
  allowedProperties: string[]
): string[] => {
  return allowedProperties.filter(
    (property) =>
      reqBody[property] === undefined
  );
};

export const findForbidden = (
  reqBody: Record<string, any>,
  forbiddenProperties: string[]
): string[] => {
  return forbiddenProperties.filter((property) =>
    Object.keys(reqBody).includes(property)
  );
};

export const findUnrecognized = (
  reqBody: Record<string, any>,
  allowedProperties: string[],
  forbiddenProperties: string[]
): string[] => {
  return Object.keys(reqBody).filter(
    (property) =>
      !allowedProperties.includes(property) &&
      !forbiddenProperties.includes(property)
  );
};
