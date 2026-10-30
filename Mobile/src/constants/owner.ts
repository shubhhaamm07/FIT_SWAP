import {
  numberField,
  textField,
  type FormField,
} from "../contexts/FormContext";
export const gymFields: FormField[] = [
  { key: "coordinates", label: "Gym location", type: "location" },
  textField("name", "Gym name"),
  { key: "description", label: "About the gym", type: "multiline" },
  textField("address", "Street address"),
  textField("city", "City"),
  textField("state", "State"),
  textField("pincode", "Postal code", false),
  textField("phone", "Phone", false),
  textField("email", "Email", false),
  { key: "latitude", label: "Latitude", type: "number", min: -90, max: 90 },
  { key: "longitude", label: "Longitude", type: "number", min: -180, max: 180 },
];
export const planFields: FormField[] = [
  textField("name", "Plan name"),
  numberField("durationInDays", "Duration in days", 30),
  numberField("price", "Plan price in rupees"),
  {
    ...numberField("transferFee", "Transfer fee in rupees", 0),
    required: false,
  },
  numberField("minimumTransferDays", "Minimum remaining days to transfer", 30),
  { ...numberField("maximumTransfers", "Maximum transfers"), required: false },
  ...[
    ["transferable", "Allow membership transfers", true],
    ["requiresGymApproval", "Require gym approval", true],
    ["allowOnlinePayment", "Allow UPI payment", true],
    ["allowCashTransfer", "Allow cash transfers", false],
    ["freezeAllowed", "Allow membership freeze", true],
  ].map(
    ([key, label, initial]) =>
      ({ key, label, type: "switch", initial }) as FormField,
  ),
];
