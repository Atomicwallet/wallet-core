class RequestStatusCodeError extends Error {
  constructor (errorString) {
    super(`Request Status Code Error ${errorString}`)
  }
}

export default RequestStatusCodeError
