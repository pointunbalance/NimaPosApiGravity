import { db } from "../db";

export class AnalyticsService {
    // Basic memory cache to act as a materialized view for heavy queries
    static memoryCache: Record<string, {data: any, timestamp: number}> = {};

    /**
     * Get Aggregated Clinic Stats (Materialized View pattern)
     * For high volumes of data, we calculate aggregations and cache them for 5 minutes.
     */
    static async getAggregatedClinicStats(forceRefresh = false) {
        const cacheKey = 'clinic_stats_view';
        
        // Check cache (valid for 5 mins)
        if (!forceRefresh && this.memoryCache[cacheKey] && (Date.now() - this.memoryCache[cacheKey].timestamp) < 5 * 60 * 1000) {
            return this.memoryCache[cacheKey].data;
        }

        // Heavy Aggregation Queries
        const invoices = await db.clinicInvoices.toArray();
        const appointments = await db.appointments.toArray();
        const medicalRecords = await db.medicalRecords.toArray();

        let totalRevenue = 0;
        let totalCash = 0;
        let totalInsurance = 0;

        invoices.forEach(inv => {
            const amt = Number(inv.amount || 0);
            totalRevenue += amt;
            if (inv.paymentMethod === 'insurance') {
                totalInsurance += Number(inv.insuranceShare || 0);
                totalCash += Number(inv.patientShare || 0);
            } else {
                totalCash += amt;
            }
        });

        const activePatients = new Set(invoices.map(i => i.customerId)).size;
        const totalNoShows = appointments.filter(a => a.status === 'no_show').length;

        const data = {
            totalRevenue,
            totalCash,
            totalInsurance,
            activePatients,
            totalAppointments: appointments.length,
            totalNoShows,
            totalMedicalRecords: medicalRecords.length,
            lastCalculated: new Date().toISOString()
        };

        // Update pseudo-materialized view
        this.memoryCache[cacheKey] = {
            data,
            timestamp: Date.now()
        };

        return data;
    }
}
