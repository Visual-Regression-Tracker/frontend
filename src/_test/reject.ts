// how a service fails: handleResponse rejects with the API's message, not an Error
export const rejectWithMessage = (message: string): Promise<never> =>
  // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors -- mirrors handleResponse's string rejection
  Promise.reject(message);
