export async function apiFetch(
  endpoint: string,
  options: RequestInit = {},
): Promise<Response> {
  const controllerIp = "localhost";
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  const finalUrl = endpoint.startsWith("http")
    ? endpoint
    : `http://${controllerIp}${
        endpoint.startsWith("/") ? endpoint : "/" + endpoint
      }`;

  const response = await fetch(finalUrl, { ...options, headers });

  // // Handle token expiration or invalid credentials globally
  // if (response.status === 401) {
  //   if (typeof window !== 'undefined') {
  //     localStorage.clear();
  //     window.location.href = '/login';
  //   }
  //   throw new Error('Unauthorized. Please log in again.');
  // }

  return response;
}
