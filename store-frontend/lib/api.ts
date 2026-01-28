import axios from "axios";
import qs from "qs";

export const getStrapiURL = (path = "") => {
  return `${process.env.NEXT_PUBLIC_STRAPI_API_URL || "http://localhost:1337"
    }${path}`;
};

export const getStrapiMedia = (url: string) => {
  if (url == null) {
    return null;
  }
  if (url.startsWith("http") || url.startsWith("//")) {
    return url;
  }
  return `${process.env.NEXT_PUBLIC_STRAPI_API_URL || "http://localhost:1337"}${url}`;
};

export const fetchAPI = async (
  path: string,
  urlParamsObject: any = {},
  options: any = {}
) => {
  const mergedOptions = {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.STRAPI_API_TOKEN}`,
    },
    ...options,
  };

  const queryString = qs.stringify(urlParamsObject, { encodeValuesOnly: true });
  const requestUrl = `${getStrapiURL(
    `/api${path}`
  )}${queryString ? `?${queryString}` : ""}`;

  try {
    const response = await axios.get(requestUrl, mergedOptions);
    return response.data;
  } catch (error) {
    console.error("Error fetching API:", error);
    return { data: [], meta: {} }; // Fallback
  }
};
