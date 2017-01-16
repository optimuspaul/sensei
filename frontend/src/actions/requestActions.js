
const HANDLE_REQUEST = 'HANDLE_REQUEST';
export const handleRequest = (requestId, requestStatus, payload) => {
  return {
    type: HANDLE_REQUEST,
    requestId,
    requestStatus,
    payload
  }
}