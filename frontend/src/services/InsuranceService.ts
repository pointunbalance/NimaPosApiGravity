import { db } from "../db";

export class InsuranceService {
    /**
     * Rules Engine: Evaluates a line item against the patient's insurance policy.
     */
    static async validateServiceCoverage(
        companyId: number, 
        serviceId: number, 
        servicePrice: number, 
        customerId: number
    ) {
        const company = await db.clinicInsuranceCompanies.get(companyId);
        if (!company || company.status === 'inactive') {
            return {
                isCovered: false,
                patientShare: servicePrice,
                insuranceShare: 0,
                reason: 'الشركة غير موجودة أو غير فعالة'
            };
        }

        const rule = company.rules?.find((r: any) => r.serviceId === serviceId || r.categoryId === serviceId /* Assuming category check handled similarly if needed */);
        
        let coPayPercentage = company.defaultCopay || 100; // e.g. 20% patient pays
        let isCovered = true;
        let reason = '';

        if (rule) {
            if (rule.isCovered === false) {
                isCovered = false;
                reason = rule.exclusionReason || 'الخدمة غير مغطاة (استبعاد تعاقدي)';
                coPayPercentage = 100;
            } else {
                coPayPercentage = rule.coPayPercentage ?? coPayPercentage;
            }
        } else {
            // Unspecified services might fall back to default assuming cover, but let's check company policy
            if (company.strictRulesOnly) {
                isCovered = false;
                reason = 'الخدمة غير متضمنة في التعاقد بشكل واضح.';
                coPayPercentage = 100;
            }
        }

        // Apply co-pay
        let patientShare = isCovered ? (servicePrice * (coPayPercentage / 100)) : servicePrice;
        let insuranceShare = servicePrice - patientShare;

        // Apply Cap per service
        if (isCovered && rule?.maxCap && insuranceShare > rule.maxCap) {
            patientShare += (insuranceShare - rule.maxCap);
            insuranceShare = rule.maxCap;
            reason = `تم تطبيق سقف التغطية للخدمة (${rule.maxCap})`;
        }

        // Apply Annual Cap check
        // Check all previous claims for this customer in this company this year
        const currentYear = new Date().getFullYear();
        const startOfYear = new Date(currentYear, 0, 1).toISOString();
        
        const previousClaims = await db.clinicInsuranceClaims
            .where('customerId').equals(customerId)
            .toArray();
            
        const yearClaims = previousClaims.filter(c => c.date >= startOfYear && c.companyId === companyId);
        const totalUsed = yearClaims.reduce((sum, c) => sum + (c.claimedAmount || 0), 0);

        const annualCap = company.annualCapPerPatient || Infinity;
        if (isCovered && (totalUsed + insuranceShare > annualCap)) {
            const allowedRemaining = Math.max(0, annualCap - totalUsed);
            patientShare += (insuranceShare - allowedRemaining);
            insuranceShare = allowedRemaining;
            
            if (allowedRemaining === 0) {
                isCovered = false;
                reason = 'تم تجاوز السقف السنوي للمريض.';
            } else {
                reason = `تم الوصول للسقف السنوي (المتبقي: ${allowedRemaining})`;
            }
        }

        return {
            isCovered,
            patientShare,
            insuranceShare,
            reason
        };
    }

    /**
     * Issue Invoice with Insurance Claims Calculation
     */
    static async issueInvoice(invoiceData: any) {
        return await db.transaction('rw', [db.clinicInvoices, db.clinicInsuranceClaims, db.auditLogs], async () => {
            const { items, customerId, companyId, ...rest } = invoiceData;

            let totalAmount = 0;
            let totalPatientShare = 0;
            let totalInsuranceShare = 0;

            const processedItems = items;

            // Recalculate totals from items assuming rules engine already ran on them before submit or we run now.
            // But if it's already structured in items via UI:
            for (const item of processedItems) {
                 totalAmount += item.price * item.quantity;
                 totalPatientShare += (item.patientShare || item.price) * item.quantity;
                 totalInsuranceShare += (item.insuranceShare || 0) * item.quantity;
            }

            const invoiceId = await db.clinicInvoices.add({
                ...rest,
                customerId,
                companyId,
                items: processedItems,
                amount: totalAmount,
                patientShare: totalPatientShare,
                insuranceShare: totalInsuranceShare,
                status: totalPatientShare === 0 ? 'paid' : (rest.status || 'pending'),
                date: new Date().toISOString()
            });

            // Create Claim
            if (totalInsuranceShare > 0 && companyId) {
                const claimId = await db.clinicInsuranceClaims.add({
                    companyId,
                    customerId,
                    invoiceId,
                    date: new Date().toISOString(),
                    claimedAmount: totalInsuranceShare,
                    status: 'pending_submission' // pending_submission -> submitted -> approved/rejected -> collected
                });

                await db.auditLogs.add({
                    userId: 1,
                    action: 'CREATE_INSURANCE_CLAIM',
                    module: 'ClinicBilling',
                    timestamp: new Date().toISOString(),
                    details: `إنشاء مطالبة مالية للشركة ID: ${companyId} بقيمة ${totalInsuranceShare} مرتبطة بفاتورة ID: ${invoiceId}`
                });
            }

            await db.auditLogs.add({
                userId: 1,
                action: 'ISSUE_INVOICE',
                module: 'ClinicBilling',
                timestamp: new Date().toISOString(),
                details: `إصدار فاتورة ID: ${invoiceId} بقيمة ${totalAmount}`
            });

            return invoiceId;
        });
    }
}
