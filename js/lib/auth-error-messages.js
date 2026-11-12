function getErrorText(error) {
  return `${error?.code || ""} ${error?.message || ""}`.toLowerCase();
}

function isNetworkError(value) {
  return (
    value.includes("failed to fetch") ||
    value.includes("network") ||
    value.includes("load failed")
  );
}

export function getSignupErrorMessage(error) {
  const value = getErrorText(error);

  if (value.includes("already registered") || value.includes("already exists")) {
    return "This email is already registered. Please use the sign-in page.";
  }

  if (value.includes("email address not authorized")) {
    return "This email cannot receive a confirmation. Check the address or use another email.";
  }

  if (value.includes("invalid email")) {
    return "This email address is invalid. Please check the spelling.";
  }

  if (value.includes("password")) {
    return "Your password does not meet the security requirements.";
  }

  if (value.includes("rate") || value.includes("too many")) {
    return "Too many attempts. Wait a moment and try again.";
  }

  if (value.includes("signup") && (value.includes("disabled") || value.includes("not allowed"))) {
    return "Account registration is currently unavailable. Contact the Pathly team.";
  }

  if (value.includes("database error") || value.includes("unexpected_failure")) {
    return "A system issue prevented account creation. Try again or contact the Pathly team.";
  }

  if (isNetworkError(value)) {
    return "Could not connect to the server. Check your internet connection and try again.";
  }

  return "Your account could not be created. Check your details and try again.";
}

export function getLoginErrorMessage(error) {
  const value = getErrorText(error);

  if (value.includes("email not confirmed")) {
    return "Your email is not confirmed. Open the confirmation email from Pathly first.";
  }

  if (isNetworkError(value)) {
    return "Could not connect to the server. Check your internet connection and try again.";
  }

  return "Incorrect email or password. Check your details and try again.";
}

export function getPasswordResetErrorMessage(error) {
  const value = getErrorText(error);

  if (value.includes("rate") || value.includes("too many")) {
    return "Too many requests. Wait a moment and try again.";
  }

  if (value.includes("email address not authorized")) {
    return "This email cannot receive a reset link. Check the address or use another email.";
  }

  if (isNetworkError(value)) {
    return "Could not connect to the server. Check your internet connection and try again.";
  }

  return "The reset link could not be sent. Check your email address and try again.";
}
