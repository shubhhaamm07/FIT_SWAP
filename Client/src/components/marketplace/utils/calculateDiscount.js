const calculateDiscount = (originalPrice, sellingPrice) => {
    if (!originalPrice || originalPrice <= 0) return 0;

    return Math.round(
        ((originalPrice - sellingPrice) / originalPrice) * 100
    );
};

export default calculateDiscount; 