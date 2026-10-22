export async function apiRequest(functionName, { token, method = 'GET', body } = {}) {
  const response = await fetch(`/api/${functionName}`, {
    method,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });

  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(result.error || `คำขอไม่สำเร็จ (${response.status})`);
  }
  return result;
}
