export const CUSTOM_CAREERS_STORAGE_KEY = "pathlyCustomCareers";
export const LEGACY_CUSTOM_CAREER_STORAGE_KEY = "pathlyCustomCareer";

const MAX_STORED_CUSTOM_CAREERS = 20;

export function coerceCustomCareerCollection(value) {
  if (Array.isArray(value)) return value;
  if (value && typeof value === "object") return [value];
  return [];
}

export function upsertCustomCareer(collection, data) {
  const careerId = data?.career?.id;

  if (!careerId) {
    return coerceCustomCareerCollection(collection);
  }

  return [
    data,
    ...coerceCustomCareerCollection(collection).filter(function (item) {
      return item?.career?.id !== careerId;
    })
  ].slice(0, MAX_STORED_CUSTOM_CAREERS);
}

export function removeCustomCareer(collection, careerId) {
  return coerceCustomCareerCollection(collection).filter(function (item) {
    return item?.career?.id !== careerId;
  });
}
