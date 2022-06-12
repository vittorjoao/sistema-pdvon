export const formatNumber = (val) => {
  if (!val) return 0;
  return `${val}`
    .replace(/\B(?=(\d{3})+(?!\d))/g, ".")
    .replace(/\.(?=\d{0,2}$)/g, ",");
};

export const parseNumber = (val) => {
  if (!val) return 0;
  return Number.parseFloat(
    val.replace(/\$\s?|(\.*)/g, "").replace(/(,{1})/g, ".")
  ).toFixed(2);
};

export function generateBarcode() {
  const country = "789";
  const registerNumber = generateRandom(5);
  const sku = generateRandom(4);

  return country + String(registerNumber) + String(sku);
}

function generateRandom(length) {
  return Math.floor(
    Math.pow(10, length - 1) +
      Math.random() * (Math.pow(10, length) - Math.pow(10, length - 1) - 1)
  );
}
