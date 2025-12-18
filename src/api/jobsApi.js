import { api } from "./api";

export const JobsApi = {
  getRecent: (params = {}) =>
    api.get("/job/recent", { params }).then((r) => r.data),

  getActive: (params = {}) =>
    api.get("/job/active", { params }).then((r) => r.data),

  getById: (jobId) =>
    api.get(`/job/${jobId}`).then((r) => r.data),
};