export const calculateShippingCost = (product, quantity, region) => {
  const shippingInfo = product?.shipping;

  // Default to 1000 if no shipping info
  if (!shippingInfo || !shippingInfo.zones || shippingInfo.zones.length === 0) {
    return 1000;
  }

  // Find matching zone or default to first zone
  let zoneClient =
    shippingInfo.zones.find(
      (zone) => zone.name.toLowerCase() === region.toLowerCase()
    ) || shippingInfo.zones[0];

  // Calculate shipping cost
  const baseFee = zoneClient.baseFee || 0;
  const weightFee = shippingInfo.weight
    ? shippingInfo.weight * (zoneClient.weightFee || 0) * quantity
    : 0;

  return baseFee + weightFee;
};

export const calculateTotalShippingCost = (products, region, orderItems) => {
  // Add null checks
  if (!orderItems || !Array.isArray(orderItems) || orderItems.length === 0) {
    return 0;
  }

  return orderItems.reduce((total, item) => {
    const product = products?.find((p) => p._id === item.produit);

    if (!product) return total;

    const shippingCost = calculateShippingCost(
      product,
      item.quantite || 1,
      region || "Niamey"
    );
    return total + shippingCost;
  }, 0);
};
