import axios from "axios";

export const httpClient = axios.create({
  headers: {
    Accept: "application/json",
  },
});
