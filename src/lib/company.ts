/**
 * Company branding shown on PDFs (vouchers, invoices, ledgers) and the
 * sidebar / login screens. Edit these values to match your own business
 * details — everything that prints or displays the company name reads this.
 */
export const COMPANY = {
  name: "S.S.B Travel & Tours",
  tagline: "Travel Agency Management",
  address: "Office # 7, Aasa Jalal Complex, Iqbal Hoti Road, Gazdarabad, Karachi",
  /** Primary landline + mobiles printed on vouchers. */
  phones: ["0213-2751509", "0321-2331437", "0300-8202893"] as const,
  email: "ssbtravelntours@gmail.com",
  /** Public asset used as the logo on PDFs. */
  logo: "/ssb-voucher-logo.jpg",
};

/** Tel line as shown on vouchers: `0213-…  0321-… / 0300-…` */
export function companyTelLine() {
  const [landline, mobile1, mobile2] = COMPANY.phones;
  return `${landline}  ${mobile1} / ${mobile2}`;
}
