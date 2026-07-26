const formatPrice = (price) => {
    if (price === null || price === undefined) return "₹0";

    return `₹${Number(price).toLocaleString("en-IN")}`;
};

export default formatPrice;