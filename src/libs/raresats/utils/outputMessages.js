export function success(x) {
  return {"success": true, "result": x};
}

export function failure(error_message) {
  return {"success": false, "error": error_message};
}