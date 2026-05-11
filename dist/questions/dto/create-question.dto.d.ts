export declare const CREATABLE_QUESTION_CATEGORIES: readonly ["Heart", "Diabetes", "Hypertension", "Weight Loss", "PCOD / PCOS", "Joint Pain", "Kidney", "Skin Care", "Hair Loss / Hair Fall", "Thyroid", "Piles", "Arthritis", "Lifestyle & Diet", "Heart Health", "Blood Pressure", "Weight Management", "Other"];
export declare class CreateQuestionDto {
    title: string;
    body: string;
    category?: string;
    patientAgeGroup?: string;
    patientGender?: string;
    patientHistory?: string;
}
