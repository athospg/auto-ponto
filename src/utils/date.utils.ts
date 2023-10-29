export const createDateAsUTC = (date: Date) => {
  const dateOffset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() + dateOffset);
};
