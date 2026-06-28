export const DrugDatabase = [
    { tradeName: 'Panadol', activeSubstance: 'Paracetamol', type: 'Analgesic' },
    { tradeName: 'Advil', activeSubstance: 'Ibuprofen', type: 'NSAID' },
    { tradeName: 'Aspirin', activeSubstance: 'Aspirin', type: 'NSAID' },
    { tradeName: 'Augmentin', activeSubstance: 'Amoxicillin', type: 'Antibiotic' },
    { tradeName: 'Amoxil', activeSubstance: 'Amoxicillin', type: 'Antibiotic' },
    { tradeName: 'Flumox', activeSubstance: 'Amoxicillin', type: 'Antibiotic' },
    { tradeName: 'Ibuprofen', activeSubstance: 'Ibuprofen', type: 'NSAID' },
    { tradeName: 'Paracetamol', activeSubstance: 'Paracetamol', type: 'Analgesic' }
];

export const Interactions = [
    { substances: ['Ibuprofen', 'Aspirin'], warning: 'تعارض دوائي بين مضادات الالتهاب (Ibuprofen و Aspirin) قد يسبب نزيف أو قرحة معدية.' },
];

export const AllergyFamilies = {
    'بنسلين': ['Amoxicillin', 'Penicillin', 'Augmentin', 'Flumox', 'Amoxil'],
    'أسبرين': ['Aspirin', 'Ibuprofen', 'Advil'], // Often cross-reactivity with NSAIDs
    'penicillin': ['Amoxicillin', 'Penicillin', 'Augmentin', 'Flumox', 'Amoxil']
};

export class DrugService {
    static checkInteractions(currentPrescriptionText: string, historicalPrescriptionsText: string) {
        let warnings: string[] = [];
        if(!currentPrescriptionText) return warnings;

        const allText = (currentPrescriptionText + '\n' + (historicalPrescriptionsText || '')).toLowerCase();
        
        const activeSubstancesInUse = new Set<string>();

        // Find which active substances are present in the text (either by trade name or active substance name)
        DrugDatabase.forEach(drug => {
            if (allText.includes(drug.tradeName.toLowerCase()) || allText.includes(drug.activeSubstance.toLowerCase())) {
                activeSubstancesInUse.add(drug.activeSubstance);
            }
        });

        const activeArr = Array.from(activeSubstancesInUse);
        Interactions.forEach(interaction => {
            // If all substances in this interaction rule are found in the patient's records
            const hasAll = interaction.substances.every(sub => activeArr.includes(sub));
            if (hasAll) {
                // To avoid firing if BOTH are only in history, let's also ensure at least one is in the current prescription
                const currentTextLower = currentPrescriptionText.toLowerCase();
                let currentHasAtLeastOne = false;
                interaction.substances.forEach(sub => {
                    DrugDatabase.filter(d => d.activeSubstance === sub).forEach(d => {
                        if (currentTextLower.includes(d.tradeName.toLowerCase()) || currentTextLower.includes(d.activeSubstance.toLowerCase())) {
                             currentHasAtLeastOne = true;
                        }
                    });
                });

                if (currentHasAtLeastOne) {
                    warnings.push(interaction.warning);
                }
            }
        });

        return Array.from(new Set(warnings));
    }

    static checkAllergies(prescriptionText: string, patientAllergiesStr: string) {
        if (!patientAllergiesStr || !prescriptionText) return [];
        let warnings: string[] = [];
        const allergies = patientAllergiesStr.split(',').map(s => s.trim().toLowerCase());
        const prescribedText = prescriptionText.toLowerCase();

        allergies.forEach(allergy => {
            // Check family
            const fam = AllergyFamilies[allergy as keyof typeof AllergyFamilies] || [];
            if(fam.length > 0) {
               fam.forEach(drugName => {
                   if (prescribedText.includes(drugName.toLowerCase())) {
                       warnings.push(`تحذير حساسية خطير: المريض يعاني من حساسية تجاه (${allergy}) والروشتة تحتوي على (${drugName}) المتعارض معها.`);
                   }
               });
            } else {
                 if (prescribedText.includes(allergy)) {
                    warnings.push(`تحذير حساسية خطير: تم إدراج دواء للمريض يعاني من حساسية تجاهه (${allergy}).`);
                }
            }
        });

        return Array.from(new Set(warnings));
    }
}
