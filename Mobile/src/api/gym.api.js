import { download, upload } from "../utils/files";
import axios from "./axios";

export const createGym = async (gymData) => {
  const { data } = await axios.post("/gyms", gymData);
  return data.data;
};

export const submitGymVerification = async (gymId, file) =>
  (
    await upload(`/gyms/${gymId}/verification-documents`, {}, [
      { field: "document", file },
    ])
  ).data;

export const downloadGymVerification = (gymId, document) =>
  download(
    `/gyms/${gymId}/verification-documents/${document.id}`,
    document.fileName || "gym-verification.pdf",
  );

export const getAllGyms = async (query = {}, config = {}) => {
  const { data } = await axios.get("/gyms", { ...config, params: query });

  return data.data;
};

export const getMyGyms = async (config = {}) => {
  const { data } = await axios.get("/gyms/my-gyms", config);

  return data.data;
};

export const getGymById = async (gymId, config = {}) => {
  const { data } = await axios.get(`/gyms/${gymId}`, config);
  return data.data;
};

export const getGymPosts = async (gymId, config = {}) => {
  const { data } = await axios.get(`/gyms/${gymId}/posts`, config);
  return data.data;
};

export const getMyGymPosts = async (gymId, config = {}) => {
  const { data } = await axios.get(`/gyms/${gymId}/my-posts`, config);
  return data.data;
};

export const saveGymPost = async (gymId, post, poster, postId = null) =>
  (
    await upload(
      `/gyms/${gymId}/posts${postId ? `/${postId}` : ""}`,
      post,
      poster ? [{ field: "poster", file: poster }] : [],
      postId ? "PATCH" : "POST",
    )
  ).data;

export const deleteGymPost = async (gymId, postId) => {
  await axios.delete(`/gyms/${gymId}/posts/${postId}`);
};

export const createMembershipPlan = async (gymId, planData) => {
  const { data } = await axios.post(`/gyms/${gymId}/plans`, planData);
  return data.data;
};

export const updateMembershipPlan = async (planId, planData) => {
  const { data } = await axios.patch(`/plans/${planId}`, planData);
  return data.data;
};

export const updateMyGym = async (gymId, gymData) => {
  const { data } = await axios.patch(`/gyms/${gymId}`, gymData);
  return data.data;
};

export const getGymCrowdLevel = async (gymId, config = {}) => {
  const { data } = await axios.get(`/gyms/${gymId}/crowd`, config);
  return data.data;
};

export const reportGymCrowdLevel = async (gymId, level) => {
  const { data } = await axios.post(`/gyms/${gymId}/crowd-reports`, { level });
  return data.data;
};
