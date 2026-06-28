import React from "react";
import { QrCode, FileCode2, XCircle } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { generateZatcaQR } from "../../utils/zatca";
import { EInvoice, AppSettings } from "../../types";

interface EInvoicingModalsProps {
  selectedInvoice: EInvoice;
  showQRModal: boolean;
  setShowQRModal: (show: boolean) => void;
  showXMLModal: boolean;
  setShowXMLModal: (show: boolean) => void;
  settings: AppSettings | null;
}

const EInvoicingModals: React.FC<EInvoicingModalsProps> = ({
  selectedInvoice,
  showQRModal,
  setShowQRModal,
  showXMLModal,
  setShowXMLModal,
  settings,
}) => {
  if (showQRModal) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 font-bold">
        <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-xl animate-in zoom-in-95">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <QrCode className="w-5 h-5 text-indigo-600" />
              رمز الاستجابة السريعة (ZATCA)
            </h3>
            <button
              onClick={() => setShowQRModal(false)}
              className="text-slate-400 hover:text-red-500 transition-colors"
            >
              <XCircle className="w-6 h-6" />
            </button>
          </div>
          <div className="p-8 flex flex-col items-center justify-center">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 mb-4">
              <QRCodeSVG
                value={generateZatcaQR(
                  settings?.storeName || "Store Name",
                  settings?.taxNumber || "312345678900003",
                  new Date(selectedInvoice.date),
                  selectedInvoice.amount,
                  selectedInvoice.amount * 0.15 // Assuming 15% VAT
                )}
                size={200}
                level="M"
              />
            </div>
            <p className="text-sm text-slate-500 text-center font-normal">
              قم بمسح الرمز باستخدام تطبيق هيئة الزكاة والضريبة والجمارك للتحقق من صحة الفاتورة.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (showXMLModal) {
    const xmlValue = `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
         xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
         xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2"
         xmlns:ext="urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2">
  <ext:UBLExtensions>
    <ext:UBLExtension>
      <ext:ExtensionURI>urn:oasis:names:specification:ubl:dsig:enveloped:xades</ext:ExtensionURI>
      <ext:ExtensionContent>
        <!-- ZATCA Cryptographic Stamp will be injected here -->
        <sig:UBLDocumentSignatures xmlns:sig="urn:oasis:names:specification:ubl:schema:xsd:CommonSignatureComponents-2">
          <sac:SignatureInformation xmlns:sac="urn:oasis:names:specification:ubl:schema:xsd:SignatureAggregateComponents-2">
            <cbc:ID>urn:oasis:names:specification:ubl:signature:1</cbc:ID>
            <sbc:ReferencedSignatureID xmlns:sbc="urn:oasis:names:specification:ubl:schema:xsd:SignatureBasicComponents-2">urn:oasis:names:specification:ubl:signature:Invoice</sbc:ReferencedSignatureID>
          </sac:SignatureInformation>
        </sac:SignatureInformation>
      </ext:ExtensionContent>
    </ext:UBLExtension>
  </ext:UBLExtensions>
  <cbc:ProfileID>reporting:1.0</cbc:ProfileID>
  <cbc:ID>${selectedInvoice.id}</cbc:ID>
  <cbc:UUID>${selectedInvoice.uuid || "PENDING-UUID"}</cbc:UUID>
  <cbc:IssueDate>${selectedInvoice.date.split("T")[0]}</cbc:IssueDate>
  <cbc:IssueTime>${selectedInvoice.date.split("T")[1]?.substring(0, 8) || "00:00:00"}</cbc:IssueTime>
  <cbc:InvoiceTypeCode name="0100000">388</cbc:InvoiceTypeCode>
  <cbc:DocumentCurrencyCode>SAR</cbc:DocumentCurrencyCode>
  <cbc:TaxCurrencyCode>SAR</cbc:TaxCurrencyCode>
  
  <cac:AccountingSupplierParty>
    <cac:Party>
      <cac:PartyIdentification>
        <cbc:ID schemeID="CRN">1234567890</cbc:ID>
      </cac:PartyIdentification>
      <cac:PartyName>
        <cbc:Name>${settings?.storeName || "Store Name"}</cbc:Name>
      </cac:PartyName>
      <cac:PartyTaxScheme>
        <cbc:CompanyID>${settings?.taxNumber || "312345678900003"}</cbc:CompanyID>
        <cac:TaxScheme>
          <cbc:ID>VAT</cbc:ID>
        </cac:TaxScheme>
      </cac:PartyTaxScheme>
    </cac:Party>
  </cac:AccountingSupplierParty>

  <cac:LegalMonetaryTotal>
    <cbc:LineExtensionAmount currencyID="SAR">${(selectedInvoice.amount / 1.15).toFixed(2)}</cbc:LineExtensionAmount>
    <cbc:TaxExclusiveAmount currencyID="SAR">${(selectedInvoice.amount / 1.15).toFixed(2)}</cbc:TaxExclusiveAmount>
    <cbc:TaxInclusiveAmount currencyID="SAR">${selectedInvoice.amount.toFixed(2)}</cbc:TaxInclusiveAmount>
    <cbc:PayableAmount currencyID="SAR">${selectedInvoice.amount.toFixed(2)}</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>
</Invoice>`;

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 font-bold">
        <div className="bg-white rounded-2xl w-full max-w-3xl overflow-hidden shadow-xl flex flex-col max-h-[90vh] animate-in zoom-in-95">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <FileCode2 className="w-5 h-5 text-indigo-600" />
              معاينة ملف XML (UBL 2.1)
            </h3>
            <button
              onClick={() => setShowXMLModal(false)}
              className="text-slate-400 hover:text-red-500 transition-colors"
            >
              <XCircle className="w-6 h-6" />
            </button>
          </div>
          <div className="p-4 overflow-y-auto bg-slate-900 text-slate-300 font-mono text-xs leading-relaxed">
            <pre className="text-left" dir="ltr">
              {xmlValue}
            </pre>
          </div>
          <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
            <button
              onClick={() => setShowXMLModal(false)}
              className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50"
            >
              إغلاق
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default EInvoicingModals;
