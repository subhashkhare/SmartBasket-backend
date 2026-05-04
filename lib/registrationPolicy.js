const PHONE_ERROR = 'Phone number must be a valid US 10-digit number';
const EMAIL_ERROR = 'Email must be valid';
const ZIP_ERROR = 'ZIP code must be valid US format';
const PIN_ERROR = 'PIN must be exactly 4 digits';

const normalizeUSPhoneNumber = (phoneNumber) => {
  const digitsOnly = String(phoneNumber || '').replaceAll(/\D/g, '');
  if (digitsOnly.length === 11 && digitsOnly.startsWith('1')) {
    return digitsOnly.slice(1);
  }
  return digitsOnly;
};

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();
const normalizeZipCode = (zipCode) => String(zipCode || '').trim();

const isValidPin = (pin) => /^\d{4}$/.test(pin);
const isValidEmail = (email) => /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(email);
const isValidUSZipCode = (zipCode) => /^\d{5}(?:-\d{4})?$/.test(zipCode);
const isValidUSPhoneNumber = (phoneNumber) => /^\d{10}$/.test(phoneNumber);

const evaluateRegistrationForAutoApproval = ({ phoneNumber, email, pin, zipCode }) => {
  const normalizedPhoneNumber = normalizeUSPhoneNumber(phoneNumber);
  const normalizedEmail = normalizeEmail(email);
  const normalizedZipCode = normalizeZipCode(zipCode);

  if (!isValidUSPhoneNumber(normalizedPhoneNumber)) {
    return { approved: false, errorMessage: PHONE_ERROR };
  }

  if (!isValidEmail(normalizedEmail)) {
    return { approved: false, errorMessage: EMAIL_ERROR };
  }

  if (normalizedZipCode && !isValidUSZipCode(normalizedZipCode)) {
    return { approved: false, errorMessage: ZIP_ERROR };
  }

  if (!isValidPin(pin)) {
    return { approved: false, errorMessage: PIN_ERROR };
  }

  return {
    approved: true,
    normalizedPhoneNumber,
    normalizedEmail,
    normalizedZipCode,
  };
};

const evaluateLoginForAutoApproval = ({ phoneNumber, pin }) => {
  const normalizedPhoneNumber = normalizeUSPhoneNumber(phoneNumber);

  if (!isValidUSPhoneNumber(normalizedPhoneNumber)) {
    return { approved: false, errorMessage: PHONE_ERROR };
  }

  if (!isValidPin(pin)) {
    return { approved: false, errorMessage: PIN_ERROR };
  }

  return { approved: true, normalizedPhoneNumber };
};

module.exports = {
  evaluateRegistrationForAutoApproval,
  evaluateLoginForAutoApproval,
};
