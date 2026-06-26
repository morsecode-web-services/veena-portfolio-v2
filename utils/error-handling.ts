export const getErrorMessage = (error: any): string => {
  if (!error) return 'An unexpected error occurred';

  // Supabase specific error codes
  if (error.code === '23505') {
    // unique_violation
    if (error.message?.includes('slug')) {
      return 'A blog post with this title/slug already exists. Please change the title.';
    }
    return 'This record already exists.';
  }

  if (error.code === '42501') {
    // insufficient_privilege
    return 'Permission denied. You may need to log in again.';
  }

  // Storage errors
  if (error.message?.includes('row-level security')) {
    return 'Upload failed: Permission denied. Please check your login status.';
  }

  if (error.statusCode === '413') {
    return 'File is too large. Please upload an image smaller than 5MB.';
  }

  // Validation errors
  if (error.message?.includes('violates check constraint')) {
    return 'Invalid data provided. Please checks your inputs.';
  }

  // Network errors
  if (error.message === 'Failed to fetch') {
    return 'Network error. Please check your internet connection.';
  }

  return error.message || 'An unexpected error occurred. Please try again.';
};
