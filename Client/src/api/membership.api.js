import axios from "./axios";

export const getMyMemberships = async () => {
    const { data } = await axios.get("/memberships/my");
    return data.data;
};

export const getMembershipById = async (membershipId) => {
    const { data } = await axios.get(
        `/memberships/${membershipId}`
    );

    return data.data;
};

export const purchaseMembership = async (planId) => {
    const { data } = await axios.post(
        "/memberships/purchase",
        {
            planId,
        }
    );

    return data.data;
};

export const freezeMembership = async (membershipId) => {
    const { data } = await axios.patch(
        `/memberships/${membershipId}/freeze`
    );

    return data.data;
};

export const unfreezeMembership = async (
    membershipId
) => {
    const { data } = await axios.patch(
        `/memberships/${membershipId}/unfreeze`
    );

    return data.data;
};