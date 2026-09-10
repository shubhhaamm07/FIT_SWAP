const marketplaceSafeSeller = (seller) => seller?.isProfilePublic
    ? {
        firstName: seller.firstName,
        lastName: seller.lastName,
        username: seller.username,
        isProfilePublic: true,
    }
    : {
        firstName: 'FitSwap',
        lastName: 'Seller',
        username: null,
        isProfilePublic: false,
    };

const serializePublicListing = (record) => {
    if (!record) return record;
    const { sellerId: _sellerId, seller, membership, ...listing } = record;
    const sourceSeller = seller || membership?.user;
    const { userId: _userId, user: _user, plan, ...safeMembership } = membership || {};
    const gym = plan?.gym;
    const safeGym = gym && (() => {
        const { ownerId: _ownerId, images, ...publicGym } = gym;
        return {
            ...publicGym,
            ...(images ? { images: images.map(({ imageKey: _imageKey, ...image }) => image) } : {}),
        };
    })();

    return {
        ...listing,
        membership: {
            ...safeMembership,
            plan: plan ? { ...plan, gym: safeGym } : plan,
        },
        seller: marketplaceSafeSeller(sourceSeller),
    };
};

module.exports = { marketplaceSafeSeller, serializePublicListing };
