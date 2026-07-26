const LOCK_TYPES = Object.freeze({

    PAYMENT: 'PAYMENT',

    TRANSFER: 'TRANSFER',

    ADMIN: 'ADMIN',

    FRAUD: 'FRAUD',

    SYSTEM: 'SYSTEM'

});

const isLocked = (listing) => {

    return listing?.isLocked === true;

};

const hasPaymentLock = (listing) => {

    return listing?.lockType ===
        LOCK_TYPES.PAYMENT;

};

const hasTransferLock = (listing) => {

    return listing?.lockType ===
        LOCK_TYPES.TRANSFER;

};

const hasAdminLock = (listing) => {

    return listing?.lockType ===
        LOCK_TYPES.ADMIN;

};

const hasFraudLock = (listing) => {

    return listing?.lockType ===
        LOCK_TYPES.FRAUD;

};

const hasSystemLock = (listing) => {

    return listing?.lockType ===
        LOCK_TYPES.SYSTEM;

};

const canModifyListing = (listing) => {

    return !isLocked(listing);

};

module.exports = {

    LOCK_TYPES,

    isLocked,

    hasPaymentLock,

    hasTransferLock,

    hasAdminLock,

    hasFraudLock,

    hasSystemLock,

    canModifyListing

};