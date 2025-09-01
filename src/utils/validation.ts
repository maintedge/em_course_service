export class ValidationUtil {
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static isValidPhone(phone: string): boolean {
    const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
    return phoneRegex.test(phone);
  }

  static isValidName(name: string): boolean {
    const nameRegex = /^[a-zA-Z\s\-']{2,50}$/;
    return nameRegex.test(name.trim());
  }

  static isValidRole(role: string): boolean {
    const validRoles = ['admin', 'mentor', 'student', 'tutor', 'support'];
    return validRoles.includes(role);
  }

  static isValidStatus(status: string): boolean {
    const validStatuses = ['active', 'inactive', 'suspended'];
    return validStatuses.includes(status);
  }
}
