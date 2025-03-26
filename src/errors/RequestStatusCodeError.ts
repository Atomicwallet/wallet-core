class RequestStatusCodeError extends Error {
  constructor(error: string) {
    super(`Request Status Code Error ${error}`);
  }
}

export default RequestStatusCodeError;
