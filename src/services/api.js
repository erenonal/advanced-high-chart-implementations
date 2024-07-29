import axios from "axios";

const API = axios.create({
  baseURL: "https://iapitest.eva.guru",
});

API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const login = (email, password) => {
  return API.post("/oauth/token", {
    Email: email,
    Password: password,
    GrantType: "password",
    Scope: "amazon_data",
    ClientId: "C0001",
    ClientSecret: "SECRET0001",
    RedirectUri: "https://api.eva.guru",
  }).then((response) => {
    return response;
  });
};

export const getUserInformation = (accessToken, email) => {
  return API.post(
    "/user/user-information",
    {
      email: email,
    },
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    }
  ).then((response) => {
    return response;
  });
};

export const getDailySalesOverview = (
  accessToken,
  marketplace,
  sellerId,
  day
) => {
  return API.post(
    "/data/daily-sales-overview",
    {
      marketplace: marketplace,
      sellerId: sellerId,
      requestStatus: 0,
      day: day,
      excludeYoYData: true,
    },
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    }
  ).then((response) => response);
};

export const getDailySalesSkuList = async (
  accessToken,
  marketplace,
  sellerId,
  salesDate,
  salesDate2,
  pageSize,
  pageNumber,
  isDaysCompare
) => {
  try {
    const response = await API.post(
      "/data/daily-sales-sku-list",
      {
        marketplace,
        sellerId,
        salesDate,
        salesDate2,
        pageSize,
        pageNumber,
        isDaysCompare,
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getSkuRefundRate = async (
  accessToken,
  marketplace,
  sellerId,
  skuList,
  requestedDay
) => {
  try {
    const response = await API.post(
      "/data/get-sku-refund-rate/",
      {
        marketplace,
        sellerId,
        skuList,
        requestedDay,
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};
