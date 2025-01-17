import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export const fetcher = async (
  url: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  body: any,
  options: RequestInit = {}
) => {
  const { headers = {}, ...restOptions } = options;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      ...headers,
      ...(body instanceof FormData
        ? {}
        : { "Content-Type": "application/json" }),
    },
    body: body instanceof FormData ? body : JSON.stringify(body),
    ...restOptions,
  });

  if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
  return res.json();
};

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
