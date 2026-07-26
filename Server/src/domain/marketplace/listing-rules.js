const {
    LISTING_STATUS
} = require('./listing-state');

const canPause = (listing) => {

    return listing.status === LISTING_STATUS.ACTIVE;

};

const canActivate = (listing) => {

    return listing.status === LISTING_STATUS.PAUSED;

};

const canCancel = (listing) => {

    return ![
        LISTING_STATUS.SOLD,
        LISTING_STATUS.CANCELLED,
        LISTING_STATUS.PAYMENT_PENDING,
        LISTING_STATUS.TRANSFER_PENDING
    ].includes(listing.status);

};

const canRenew = (listing) => {

    return ![
        LISTING_STATUS.SOLD,
        LISTING_STATUS.PAYMENT_PENDING,
        LISTING_STATUS.TRANSFER_PENDING
    ].includes(listing.status);

};
const canEditPrice = (listing) => {

    return [
        LISTING_STATUS.ACTIVE,
        LISTING_STATUS.PAUSED
    ].includes(
        listing.status
    );

};
const canPurchase = (listing) => {

    return listing.status === LISTING_STATUS.ACTIVE;

};

module.exports = {

    canPause,

    canActivate,

    canCancel,

    canRenew,

    canEditPrice,

    canPurchase

};