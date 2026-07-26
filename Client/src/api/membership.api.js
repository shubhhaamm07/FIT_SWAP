import axiosInstance from "./axios";

export const getMyMemberships = async () => {
    const response = await axiosInstance.get(
        "/memberships/my"
    );

    return response.data;
};

export const getMembershipById = async (
    membershipId
) => {
    const response = await axiosInstance.get(
        `/memberships/${membershipId}`
    );

    return response.data;
};

export const purchaseMembership = async (
    planId
) => {
    const response = await axiosInstance.post(
        "/memberships/purchase",
        {
            planId,
        }
    );

    return response.data;
};

export const freezeMembership = async (
    membershipId
) => {
    const response = await axiosInstance.patch(
        `/memberships/${membershipId}/freeze`
    );

    return response.data;
};

export const unfreezeMembership = async (
    membershipId
) => {
    const response = await axiosInstance.patch(
        `/memberships/${membershipId}/unfreeze`
    );

    return response.data;
};