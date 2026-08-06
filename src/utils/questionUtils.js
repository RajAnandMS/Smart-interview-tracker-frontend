export function formatEnumValue(value) {
  if (!value) {
    return "";
  }

  return value
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function formatCategory(value) {
  return formatEnumValue(value);
}

export function formatStatus(value) {
  return formatEnumValue(value);
}

export function toBackendEnum(value) {
  if (!value) {
    return "";
  }

  return value.trim().toUpperCase().replaceAll(" ", "_");
}

export function toQuestionRequest(question) {
  return {
    question: question.question.trim(),
    category: toBackendEnum(question.category),
    difficulty: toBackendEnum(question.difficulty),
    status: toBackendEnum(question.status),
  };
}

export function formatQuestionResponse(question) {
  return {
    ...question,
    category: formatCategory(question.category),
    difficulty: formatEnumValue(question.difficulty),
    status: formatStatus(question.status),
  };
}