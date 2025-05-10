// Define interfaces for our domain objects
interface Symptom {
    name: string;
    category: string;
    intensity?: string;
}

interface DateValidationResult {
    valid: boolean;
    errors: string[];
    normalizedDate?: Date;
}

// Symptom normalization mapping
const symptomNormalizationMap: Record<string, string> = {
    // Physical symptoms
    'cramps': 'menstrual_cramps',
    'cramping': 'menstrual_cramps',
    'pain': 'menstrual_cramps',
    'bloating': 'bloating',
    'bloated': 'bloating',
    'headache': 'headache',
    'tired': 'fatigue',
    'exhausted': 'fatigue',
    'fatigue': 'fatigue',

    // Mood symptoms
    'sad': 'low_mood',
    'depressed': 'low_mood',
    'angry': 'irritability',
    'irritable': 'irritability',
    'anxious': 'anxiety',
    'anxiety': 'anxiety'
};

// Symptom categorization
const symptomCategories: Record<string, string> = {
    'menstrual_cramps': 'physical',
    'bloating': 'physical',
    'headache': 'physical',
    'fatigue': 'physical',
    'breast_tenderness': 'physical',
    'acne': 'physical',
    'low_mood': 'emotional',
    'irritability': 'emotional',
    'anxiety': 'emotional',
    'mood_swings': 'emotional'
};

// Normalize symptom names
export function normalizeSymptom(symptomText: string): Symptom {
    const lowerText = symptomText.toLowerCase().trim();
    const normalizedName = symptomNormalizationMap[lowerText] || lowerText;
    const category = symptomCategories[normalizedName] || 'other';

    return {
        name: normalizedName,
        category
    };
}

// Validate and normalize dates
export function validateCycleDate(dateInput: string): DateValidationResult {
    try {
        // Parse the date
        const date = new Date(dateInput);

        // Check if date is valid
        if (isNaN(date.getTime())) {
            return {
                valid: false,
                errors: ['Invalid date format']
            };
        }

        const validation: DateValidationResult = { valid: true, errors: [] };
        const currentDate = new Date();

        // Date cannot be in the future
        if (date > currentDate) {
            validation.valid = false;
            validation.errors.push('Date cannot be in the future');
        }

        // Date should be within reasonable past range (2 years)
        const twoYearsAgo = new Date();
        twoYearsAgo.setFullYear(currentDate.getFullYear() - 2);
        if (date < twoYearsAgo) {
            validation.valid = false;
            validation.errors.push('Date is too far in the past');
        }

        validation.normalizedDate = date;
        return validation;
    } catch (error) {
        return {
            valid: false,
            errors: ['Failed to parse date']
        };
    }
}

// Determine cycle phase based on days since period started
export function determineCyclePhase(daysSincePeriodStart: number): string {
    // Simple phase determination 
    // (in a real app, this would be more personalized based on user's typical cycle)
    if (daysSincePeriodStart <= 5) {
        return 'menstrual';
    } else if (daysSincePeriodStart <= 14) {
        return 'follicular';
    } else if (daysSincePeriodStart <= 16) {
        return 'ovulatory';
    } else if (daysSincePeriodStart <= 28) {
        return 'luteal';
    } else {
        return 'unknown';
    }
}

// Process and validate raw entities from LLM
export function processEntities(rawEntities: any): any {
    const processedEntities = { ...rawEntities };

    // Process symptoms
    if (rawEntities.symptoms && Array.isArray(rawEntities.symptoms)) {
        processedEntities.symptoms = rawEntities.symptoms.map((symptom: string) =>
            normalizeSymptom(symptom)
        );
    }

    // Process dates
    if (rawEntities.temporal && rawEntities.temporal.dates) {
        if (Array.isArray(rawEntities.temporal.dates)) {
            processedEntities.temporal.dates = rawEntities.temporal.dates.map((date: string) => {
                const validation = validateCycleDate(date);
                return validation.valid ? validation.normalizedDate : null;
            }).filter(Boolean);
        }
    }

    return processedEntities;
}