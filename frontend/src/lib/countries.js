export const COUNTRIES = [
  { code: "VE", name: "Venezuela", idCard: "Cédula de identidad" },
  { code: "CL", name: "Chile", idCard: "Cédula de identidad" },
  { code: "CO", name: "Colombia", idCard: "Cédula de ciudadanía" },
  { code: "AR", name: "Argentina", idCard: "DNI" },
  { code: "PE", name: "Perú", idCard: "DNI" },
  { code: "MX", name: "México", idCard: "INE" },
  { code: "EC", name: "Ecuador", idCard: "Cédula de identidad" },
  { code: "BO", name: "Bolivia", idCard: "Cédula de identidad" },
  { code: "UY", name: "Uruguay", idCard: "Cédula de identidad" },
  { code: "PY", name: "Paraguay", idCard: "Cédula de identidad" },
  { code: "BR", name: "Brasil", idCard: "RG" },
  { code: "CR", name: "Costa Rica", idCard: "Cédula de identidad" },
  { code: "PA", name: "Panamá", idCard: "Cédula" },
  { code: "DO", name: "República Dominicana", idCard: "Cédula" },
  { code: "ES", name: "España", idCard: "DNI" },
  { code: "PT", name: "Portugal", idCard: "Cartão de cidadão" },
  { code: "FR", name: "Francia", idCard: "Carte d'identité" },
  { code: "IT", name: "Italia", idCard: "Carta d'identità" },
  { code: "DE", name: "Alemania", idCard: "Personalausweis" },
  { code: "GB", name: "Reino Unido", idCard: "National Insurance Number" },
  { code: "US", name: "Estados Unidos", idCard: "Social Security Number" },
  { code: "CA", name: "Canadá", idCard: "Social Insurance Number" },
];

export function countryName(code) {
  return COUNTRIES.find((country) => country.code === code)?.name ?? code;
}

export function idCardName(code) {
  return (
    COUNTRIES.find((country) => country.code === code)?.idCard ??
    "Documento de identidad"
  );
}

export function documentLabel(code, type) {
  return type === "pasaporte" ? "Pasaporte" : idCardName(code);
}

export function fold(value) {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase();
}

export function filterCountries(query) {
  const needle = fold(query.trim());
  if (!needle) return COUNTRIES;
  return COUNTRIES.filter(
    (country) =>
      fold(country.name).includes(needle) || fold(country.code).includes(needle)
  );
}
