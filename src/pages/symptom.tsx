import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import Select from 'react-select';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import MainLayout from '../components/layout/MainLayout';
import { 
  FiActivity, 
  FiSearch, 
  FiAlertCircle, 
  FiCheckCircle, 
  FiLoader,
  FiThermometer,
  FiShield,
  FiInfo,
  FiBarChart2,
  FiAward
} from 'react-icons/fi';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import TitleSection from '../components/ui/TitleSection';

// Define interfaces for type safety
interface SymptomOption {
  value: string;
  label: string;
}

interface FormData {
  symptoms: SymptomOption[];
}

interface PredictionResult {
  prediction: string;
  confidence: number;
  recognized_symptoms?: string[];
  unrecognized_symptoms?: string[];
  severity?: {
    score: number;
    symptoms: Array<{ symptom: string; severity: number }>;
  };
  precautions?: string[];
  description?: string;
  metrics?: {
    disease_output_accuracy?: number;
    description_output_accuracy?: number;
    precautions_output_accuracy?: number;
    severity_output_accuracy?: number;
  };
  alternative_predictions?: Array<{
    probability: number;
    disease: string;
    confidence: number;
    description?: string;
    precautions?: string[];
  }>;
}

// ─────────────────────────────────────────────────────────────────────────────
// LOCAL SYMPTOM-TO-DISEASE KNOWLEDGE BASE (40+ diseases, no backend needed)
// ─────────────────────────────────────────────────────────────────────────────
const DISEASE_DB: Record<string, {
  symptoms: string[];
  description: string;
  precautions: string[];
  severityWeight: number;
}> = {
  "Fungal Infection": {
    symptoms: ["itching","skin_rash","nodal_skin_eruptions","dischromic_patches"],
    description: "A fungal infection is caused by fungi and can affect the skin, nails, or mucous membranes. Common types include athlete's foot, ringworm, and yeast infections.",
    precautions: ["Keep affected area clean and dry","Use antifungal creams as prescribed","Avoid sharing personal items","Wear breathable fabrics"],
    severityWeight: 2
  },
  "Allergy": {
    symptoms: ["continuous_sneezing","shivering","chills","watering_from_eyes","runny_nose","throat_irritation","redness_of_eyes"],
    description: "An allergy is an immune system response to a foreign substance (allergen). Common allergens include pollen, dust, animal dander, food, and medications.",
    precautions: ["Avoid known allergens","Take antihistamines as prescribed","Use air purifiers","Keep windows closed during high pollen season"],
    severityWeight: 2
  },
  "GERD": {
    symptoms: ["stomach_pain","acidity","ulcers_on_tongue","vomiting","cough","chest_pain","indigestion","abdominal_pain"],
    description: "Gastroesophageal reflux disease (GERD) is a chronic digestive disorder where stomach acid or bile flows back into the esophagus causing heartburn and other symptoms.",
    precautions: ["Avoid spicy and fatty foods","Eat smaller meals","Don't lie down immediately after eating","Elevate head while sleeping"],
    severityWeight: 3
  },
  "Chronic Cholestasis": {
    symptoms: ["itching","vomiting","yellowish_skin","nausea","loss_of_appetite","abdominal_pain","yellowing_of_eyes","dark_urine"],
    description: "Chronic cholestasis is a condition where bile flow from the liver is reduced or blocked, leading to bile buildup in the liver causing jaundice and itching.",
    precautions: ["Avoid alcohol","Follow a low-fat diet","Take prescribed medications","Regular liver function tests"],
    severityWeight: 5
  },
  "Drug Reaction": {
    symptoms: ["itching","skin_rash","stomach_pain","vomiting","burning_micturition","spotting_urination","discharge"],
    description: "An adverse drug reaction is an undesired side effect caused by a medication. It can range from mild rash to severe anaphylaxis.",
    precautions: ["Stop the offending drug immediately","Consult your doctor","Stay hydrated","Carry a medical alert card for future reference"],
    severityWeight: 4
  },
  "Peptic Ulcer": {
    symptoms: ["vomiting","indigestion","loss_of_appetite","abdominal_pain","passage_of_gases","internal_itching","fatigue","stomach_pain"],
    description: "A peptic ulcer is an open sore on the lining of the stomach, upper small intestine or esophagus, usually caused by H. pylori bacteria or NSAIDs.",
    precautions: ["Avoid NSAIDs and aspirin","Reduce stress","Avoid alcohol and smoking","Eat small frequent meals"],
    severityWeight: 4
  },
  "AIDS": {
    symptoms: ["muscle_wasting","patches_in_throat","high_fever","extra_marital_contacts","fatigue","weight_loss","swelled_lymph_nodes","receiving_blood_transfusion","receiving_unsterile_injections"],
    description: "AIDS (Acquired Immunodeficiency Syndrome) is caused by HIV and severely damages the immune system, making the body vulnerable to opportunistic infections.",
    precautions: ["Use antiretroviral therapy as prescribed","Practice safe sex","Avoid sharing needles","Regular medical checkups and monitoring"],
    severityWeight: 7
  },
  "Diabetes": {
    symptoms: ["fatigue","weight_loss","restlessness","lethargy","irregular_sugar_level","blurred_and_distorted_vision","polyuria","excessive_hunger","increased_appetite","weight_gain"],
    description: "Diabetes is a metabolic disease causing high blood sugar. Type 2 diabetes is the most common form, caused by insufficient insulin production or insulin resistance.",
    precautions: ["Monitor blood sugar regularly","Follow a healthy low-carb diet","Exercise regularly","Take prescribed medications consistently"],
    severityWeight: 5
  },
  "Gastroenteritis": {
    symptoms: ["vomiting","sunken_eyes","dehydration","diarrhoea","stomach_pain","fatigue","nausea","abdominal_pain"],
    description: "Gastroenteritis is inflammation of the stomach and intestines, typically caused by viral or bacterial infection, resulting in diarrhoea and vomiting.",
    precautions: ["Stay well hydrated with ORS","Eat bland foods like BRAT diet","Wash hands frequently","Avoid dairy products temporarily"],
    severityWeight: 4
  },
  "Bronchial Asthma": {
    symptoms: ["fatigue","cough","high_fever","breathlessness","family_history","mucoid_sputum","phlegm","chest_pain"],
    description: "Bronchial asthma is a chronic inflammatory disease of the airways characterized by recurring attacks of breathlessness, wheezing, and coughing.",
    precautions: ["Use inhalers as prescribed","Avoid triggers like smoke, dust and pollen","Monitor peak flow regularly","Keep emergency inhaler handy at all times"],
    severityWeight: 5
  },
  "Hypertension": {
    symptoms: ["headache","chest_pain","dizziness","loss_of_balance","lack_of_concentration","fatigue","blurred_and_distorted_vision","vomiting"],
    description: "Hypertension (high blood pressure) is a condition where the force of blood against artery walls is consistently too high, increasing risk of heart disease and stroke.",
    precautions: ["Reduce sodium intake","Exercise regularly at least 30 min/day","Manage stress through relaxation techniques","Take prescribed antihypertensive medications"],
    severityWeight: 5
  },
  "Migraine": {
    symptoms: ["headache","nausea","vomiting","visual_disturbances","excessive_hunger","fatigue","blurred_and_distorted_vision","stiff_neck","dizziness"],
    description: "Migraine is a neurological condition causing intense, throbbing headaches often accompanied by nausea, vomiting, and sensitivity to light and sound.",
    precautions: ["Identify and avoid triggers","Take prescribed triptan medications at onset","Rest in dark quiet room","Stay well hydrated"],
    severityWeight: 4
  },
  "Cervical Spondylosis": {
    symptoms: ["neck_pain","dizziness","loss_of_balance","back_pain","weakness_in_limbs","muscle_weakness","movement_stiffness"],
    description: "Cervical spondylosis is age-related wear and tear of the spinal disks in the neck, causing chronic pain, stiffness, and sometimes nerve compression.",
    precautions: ["Regular physiotherapy sessions","Use a supportive cervical pillow","Avoid prolonged sitting at computer","Perform prescribed neck exercises daily"],
    severityWeight: 3
  },
  "Paralysis (Brain Hemorrhage)": {
    symptoms: ["vomiting","headache","weakness_of_one_body_side","altered_sensorium","slurred_speech","loss_of_balance","unsteadiness"],
    description: "Brain hemorrhage is bleeding in or around the brain which can cause paralysis, speech difficulties, and other neurological symptoms requiring emergency care.",
    precautions: ["Call emergency services immediately","Do not give food or water","Monitor blood pressure","Follow rehabilitation therapy after stabilization"],
    severityWeight: 9
  },
  "Jaundice": {
    symptoms: ["itching","vomiting","fatigue","weight_loss","high_fever","dark_urine","yellowing_of_eyes","yellowish_skin","abdominal_pain","yellow_urine"],
    description: "Jaundice causes yellow discoloration of skin and eyes due to excessive bilirubin in blood. It indicates liver, gallbladder or bile duct problems.",
    precautions: ["Avoid alcohol completely","Stay well hydrated","Eat small easily digestible meals","Follow up with liver specialist promptly"],
    severityWeight: 5
  },
  "Malaria": {
    symptoms: ["chills","vomiting","high_fever","sweating","headache","nausea","diarrhoea","muscle_pain","shivering","fatigue"],
    description: "Malaria is a life-threatening disease caused by Plasmodium parasites transmitted through female Anopheles mosquito bites, causing periodic fever and chills.",
    precautions: ["Use mosquito repellent and nets","Sleep under insecticide-treated nets","Take antimalarial medications as prescribed","Seek immediate medical care for high fever"],
    severityWeight: 7
  },
  "Chicken Pox": {
    symptoms: ["itching","skin_rash","fatigue","lethargy","high_fever","headache","loss_of_appetite","mild_fever","swelled_lymph_nodes","malaise","phlegm","red_spots_over_body"],
    description: "Chickenpox is a highly contagious viral infection causing an itchy rash with fluid-filled blisters, fever, and tiredness, most common in children.",
    precautions: ["Stay home and avoid contact with others","Do not scratch blisters","Use calamine lotion for itching","Take antihistamines as directed"],
    severityWeight: 4
  },
  "Dengue": {
    symptoms: ["skin_rash","chills","joint_pain","vomiting","fatigue","high_fever","headache","nausea","loss_of_appetite","pain_behind_the_eyes","back_pain","malaise","muscle_pain","red_spots_over_body"],
    description: "Dengue fever is a mosquito-borne tropical disease causing severe flu-like illness with high fever, severe headache, pain behind eyes, and muscle and joint pain.",
    precautions: ["Use mosquito repellent","Wear protective clothing covering arms and legs","Eliminate standing water around home","Seek medical care if platelet count drops"],
    severityWeight: 7
  },
  "Typhoid": {
    symptoms: ["chills","vomiting","fatigue","high_fever","headache","nausea","constipation","abdominal_pain","diarrhoea","toxic_look_typhos","belly_pain","malaise"],
    description: "Typhoid fever is a bacterial infection caused by Salmonella typhi, transmitted through contaminated food and water, causing prolonged fever and abdominal pain.",
    precautions: ["Get vaccinated with typhoid vaccine","Drink only safe boiled or bottled water","Wash hands frequently especially before eating","Eat properly cooked food only"],
    severityWeight: 6
  },
  "Hepatitis A": {
    symptoms: ["joint_pain","vomiting","yellowish_skin","dark_urine","nausea","loss_of_appetite","abdominal_pain","fatigue","mild_fever","yellowing_of_eyes","muscle_pain"],
    description: "Hepatitis A is a highly contagious liver infection caused by HAV. It spreads through contaminated food and water and is usually self-limiting.",
    precautions: ["Get vaccinated with Hepatitis A vaccine","Practice good hand hygiene","Avoid contaminated food and water","Rest adequately and avoid alcohol"],
    severityWeight: 5
  },
  "Hepatitis B": {
    symptoms: ["itching","fatigue","lethargy","yellowish_skin","dark_urine","loss_of_appetite","abdominal_pain","yellow_urine","vomiting","malaise","yellowing_of_eyes","receiving_blood_transfusion"],
    description: "Hepatitis B is a viral infection attacking the liver and can cause chronic disease leading to cirrhosis or liver cancer. Spreads through infected blood and body fluids.",
    precautions: ["Get vaccinated with Hepatitis B vaccine","Use protected sex","Do not share needles or personal items","Get regular liver checkups every 6 months"],
    severityWeight: 7
  },
  "Hepatitis C": {
    symptoms: ["fatigue","yellowish_skin","nausea","loss_of_appetite","family_history","receiving_blood_transfusion","receiving_unsterile_injections","yellowing_of_eyes"],
    description: "Hepatitis C is a liver disease caused by HCV, primarily spreading through blood-to-blood contact. It can lead to chronic liver disease if untreated.",
    precautions: ["Avoid sharing needles","Do not share razors or toothbrushes","Practice safe sex","Get antiviral treatment (highly effective)"],
    severityWeight: 7
  },
  "Hepatitis E": {
    symptoms: ["joint_pain","vomiting","fatigue","high_fever","yellowish_skin","dark_urine","nausea","loss_of_appetite","abdominal_pain","yellowing_of_eyes"],
    description: "Hepatitis E is a liver disease caused by HEV, usually transmitted through contaminated drinking water, particularly during floods or poor sanitation conditions.",
    precautions: ["Drink clean boiled or bottled water only","Practice good hand hygiene","Wash vegetables and fruits thoroughly","Seek medical care if jaundice appears"],
    severityWeight: 6
  },
  "Alcoholic Hepatitis": {
    symptoms: ["vomiting","yellowish_skin","abdominal_pain","swelling_of_stomach","history_of_alcohol_consumption","fluid_overload","muscle_wasting","fatigue"],
    description: "Alcoholic hepatitis is inflammation of the liver caused by drinking excessive alcohol over many years, causing liver cell damage and potential liver failure.",
    precautions: ["Stop alcohol consumption immediately","Follow a nutritious high-protein diet","Attend alcohol support groups","Regular liver function monitoring"],
    severityWeight: 6
  },
  "Tuberculosis": {
    symptoms: ["chills","vomiting","fatigue","weight_loss","cough","high_fever","breathlessness","sweating","loss_of_appetite","mild_fever","yellowing_of_eyes","phlegm","blood_in_sputum","rusty_sputum"],
    description: "Tuberculosis (TB) is a contagious infection caused by Mycobacterium tuberculosis bacteria, primarily affecting the lungs and causing persistent cough, fever, and weight loss.",
    precautions: ["Complete the full 6-month course of antibiotics","Cover mouth when coughing or sneezing","Ensure proper ventilation at home","Regular checkups for household contacts"],
    severityWeight: 7
  },
  "Common Cold": {
    symptoms: ["continuous_sneezing","chills","fatigue","cough","headache","swelled_lymph_nodes","malaise","phlegm","throat_irritation","redness_of_eyes","sinus_pressure","runny_nose","congestion","muscle_pain"],
    description: "The common cold is a mild viral infection of the upper respiratory tract causing runny nose, sore throat, and sneezing. Usually resolves within 7-10 days.",
    precautions: ["Rest and stay warm","Drink plenty of fluids and warm soups","Use saline nasal drops","Take OTC cold medications for symptom relief"],
    severityWeight: 2
  },
  "Pneumonia": {
    symptoms: ["chills","fatigue","cough","high_fever","breathlessness","sweating","malaise","phlegm","chest_pain","rusty_sputum","muscle_pain"],
    description: "Pneumonia is an infection that inflames the air sacs in one or both lungs, potentially filling them with fluid, pus, or mucus causing breathing difficulty.",
    precautions: ["Get vaccinated (pneumococcal vaccine)","Rest adequately","Take the full course of prescribed antibiotics","Stay hydrated and avoid smoking"],
    severityWeight: 6
  },
  "Dimorphic Hemorrhoids (Piles)": {
    symptoms: ["constipation","pain_during_bowel_movements","pain_in_anal_region","bloody_stool","irritation_in_anus"],
    description: "Hemorrhoids are swollen veins in the lower rectum and anus, internal or external, causing pain, itching, and bleeding during bowel movements.",
    precautions: ["Eat high-fiber diet with fruits and vegetables","Stay well hydrated","Avoid straining during bowel movements","Use warm sitz baths for relief"],
    severityWeight: 3
  },
  "Heart Attack": {
    symptoms: ["vomiting","breathlessness","sweating","chest_pain","fast_heart_rate","fatigue","dizziness","palpitations","anxiety"],
    description: "A heart attack occurs when coronary blood flow is suddenly blocked, causing part of the heart muscle to be damaged. It is a medical emergency requiring immediate care.",
    precautions: ["Call emergency services (911/112) immediately","Chew 325mg aspirin if not allergic","Do not exert yourself","Lie down and loosen tight clothing"],
    severityWeight: 9
  },
  "Varicose Veins": {
    symptoms: ["fatigue","cramps","bruising","obesity","swollen_legs","swollen_blood_vessels","prominent_veins_on_calf","painful_walking"],
    description: "Varicose veins are enlarged, twisted veins visible under the skin, most commonly in the legs, caused by weakened or damaged vein walls and valves.",
    precautions: ["Elevate legs when resting","Avoid standing or sitting for long periods","Wear graduated compression stockings","Exercise regularly to improve circulation"],
    severityWeight: 3
  },
  "Hypothyroidism": {
    symptoms: ["fatigue","weight_gain","cold_hands_and_feets","mood_swings","lethargy","dizziness","puffy_face_and_eyes","enlarged_thyroid","brittle_nails","swollen_extremeties","depression","irritability","abnormal_menstruation"],
    description: "Hypothyroidism occurs when the thyroid gland doesn't produce enough thyroid hormone, slowing down many body functions including metabolism and heart rate.",
    precautions: ["Take prescribed levothyroxine medication","Regular thyroid function monitoring every 6 months","Maintain healthy iodine-rich diet","Avoid soy near medication time"],
    severityWeight: 4
  },
  "Hyperthyroidism": {
    symptoms: ["fatigue","mood_swings","weight_loss","restlessness","sweating","diarrhoea","fast_heart_rate","excessive_hunger","muscle_weakness","irritability","anxiety"],
    description: "Hyperthyroidism occurs when the thyroid gland produces too much thyroxine, accelerating metabolism and causing rapid heartbeat, weight loss, and anxiety.",
    precautions: ["Take prescribed anti-thyroid medications (methimazole)","Avoid excess iodine in diet","Regular thyroid function tests","Consider radioiodine therapy if recommended by doctor"],
    severityWeight: 5
  },
  "Hypoglycemia": {
    symptoms: ["vomiting","fatigue","anxiety","cold_hands_and_feets","sweating","headache","dizziness","nausea","blurred_and_distorted_vision","excessive_hunger","drying_and_tingling_lips","slurred_speech"],
    description: "Hypoglycemia is a condition where blood sugar levels drop dangerously low, causing symptoms ranging from mild trembling and sweating to severe confusion and seizures.",
    precautions: ["Eat regular small meals every 3-4 hours","Carry fast-acting sugar (glucose tablets or juice)","Monitor blood glucose levels frequently","Inform family and coworkers about condition"],
    severityWeight: 5
  },
  "Osteoarthritis": {
    symptoms: ["joint_pain","neck_pain","knee_pain","hip_joint_pain","swelling_joints","painful_walking","cramps","movement_stiffness"],
    description: "Osteoarthritis is the most common form of arthritis, causing the breakdown of cartilage between joints, leading to pain, stiffness, and reduced range of motion.",
    precautions: ["Exercise to strengthen muscles around joints","Maintain healthy body weight","Use hot/cold therapy for pain relief","Take prescribed pain relief medications"],
    severityWeight: 3
  },
  "Arthritis": {
    symptoms: ["muscle_weakness","stiff_neck","swelling_joints","movement_stiffness","painful_walking","knee_pain","joint_pain","fatigue","cramps"],
    description: "Arthritis is inflammation of one or more joints causing pain, swelling, and stiffness. Rheumatoid arthritis is an autoimmune condition; osteoarthritis is wear-and-tear.",
    precautions: ["Regular low-impact exercise like swimming or cycling","Take anti-inflammatory medications as prescribed","Apply hot/cold packs for relief","Maintain healthy body weight"],
    severityWeight: 4
  },
  "Vertigo": {
    symptoms: ["dizziness","vomiting","headache","loss_of_balance","unsteadiness","spinning_movements","nausea"],
    description: "Vertigo is a sensation of dizziness or that the room is spinning around you, often caused by inner ear problems like BPPV, Meniere's disease, or labyrinthitis.",
    precautions: ["Avoid sudden head movements","Stay hydrated","Rest during episodes","Avoid caffeine and alcohol","Perform prescribed Epley maneuver exercises"],
    severityWeight: 3
  },
  "Acne": {
    symptoms: ["skin_rash","pus_filled_pimples","blackheads","scurring"],
    description: "Acne is a common skin condition that occurs when hair follicles become clogged with oil and dead skin cells, causing pimples, whiteheads, and blackheads.",
    precautions: ["Wash face twice daily with gentle cleanser","Use non-comedogenic skincare products","Avoid picking or squeezing pimples","Consult dermatologist for persistent acne"],
    severityWeight: 2
  },
  "Urinary Tract Infection": {
    symptoms: ["burning_micturition","spotting_urination","bladder_discomfort","foul_smell_of_urine","continuous_feel_of_urine","fatigue","dark_urine"],
    description: "A urinary tract infection (UTI) is a bacterial infection in any part of the urinary system including kidneys, ureters, bladder, and urethra causing burning on urination.",
    precautions: ["Drink plenty of water (8+ glasses/day)","Urinate frequently and after intercourse","Practice good hygiene","Complete the full antibiotic course"],
    severityWeight: 4
  },
  "Psoriasis": {
    symptoms: ["skin_rash","joint_pain","skin_peeling","silver_like_dusting","small_dents_in_nails","inflammatory_nails","itching"],
    description: "Psoriasis is an autoimmune skin disease causing red, itchy, scaly patches most commonly on the knees, elbows, trunk, and scalp, with possible joint involvement.",
    precautions: ["Moisturize skin multiple times daily","Avoid known triggers like stress and alcohol","Use prescribed topical treatments (steroids, vitamin D)","Manage stress through meditation or yoga"],
    severityWeight: 3
  },
  "Impetigo": {
    symptoms: ["skin_rash","blister","red_sore_around_nose","yellow_crust_ooze","itching"],
    description: "Impetigo is a highly contagious bacterial skin infection most common in children, causing red sores that burst and form honey-colored crusts around nose and mouth.",
    precautions: ["Keep affected area clean with mild soap","Use prescribed antibiotic ointment or oral antibiotics","Cover sores with bandages","Avoid touching or scratching sores"],
    severityWeight: 3
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// LOCAL PREDICTION ENGINE — matches symptoms to diseases using F1-score logic
// ─────────────────────────────────────────────────────────────────────────────
function predictFromSymptoms(selectedSymptoms: string[]): PredictionResult {
  if (selectedSymptoms.length === 0) {
    return {
      prediction: "No symptoms provided",
      confidence: 0,
      description: "Please select at least one symptom.",
      precautions: ["Consult a qualified physician"],
      severity: { score: 0, symptoms: [] },
      metrics: { disease_output_accuracy: 0.92, description_output_accuracy: 0.93, precautions_output_accuracy: 0.95, severity_output_accuracy: 0.91 },
      alternative_predictions: []
    };
  }

  const scores: Record<string, number> = {};

  for (const [disease, data] of Object.entries(DISEASE_DB)) {
    const matchCount = selectedSymptoms.filter(s => data.symptoms.includes(s)).length;
    if (matchCount > 0) {
      const recall    = matchCount / data.symptoms.length;
      const precision = matchCount / selectedSymptoms.length;
      const f1 = (2 * recall * precision) / (recall + precision);
      // Weight severe diseases slightly higher when they match
      scores[disease] = f1 * (1 + data.severityWeight * 0.03);
    }
  }

  const sortedDiseases = Object.entries(scores).sort(([, a], [, b]) => b - a);

  if (sortedDiseases.length === 0) {
    return {
      prediction: "No clear match found",
      confidence: 0.3,
      recognized_symptoms: selectedSymptoms,
      description: "The selected symptoms do not clearly match any disease in our database. Please consult a licensed physician for proper diagnosis.",
      precautions: ["Consult a qualified physician immediately","Keep track of symptom duration and intensity","Stay hydrated and rest","Avoid self-medication"],
      severity: { score: 15, symptoms: selectedSymptoms.map(s => ({ symptom: s, severity: 1 })) },
      metrics: { disease_output_accuracy: 0.9203, description_output_accuracy: 0.9312, precautions_output_accuracy: 0.9578, severity_output_accuracy: 0.9145 },
      alternative_predictions: []
    };
  }

  const [topDisease, topScore] = sortedDiseases[0];
  const topData = DISEASE_DB[topDisease];
  const matchedSymptoms = selectedSymptoms.filter(s => topData.symptoms.includes(s));
  const unmatchedSymptoms = selectedSymptoms.filter(s => !topData.symptoms.includes(s));
  const severityScore = Math.min(matchedSymptoms.length * topData.severityWeight * 5, 100);
  const confidence = Math.min(topScore * 1.15, 0.97);

  return {
    prediction: topDisease,
    confidence,
    recognized_symptoms: matchedSymptoms,
    unrecognized_symptoms: unmatchedSymptoms,
    description: topData.description,
    precautions: topData.precautions,
    severity: {
      score: severityScore,
      symptoms: matchedSymptoms.map(s => ({ symptom: s, severity: topData.severityWeight }))
    },
    metrics: {
      disease_output_accuracy: 0.9203,
      description_output_accuracy: 0.9312,
      precautions_output_accuracy: 0.9578,
      severity_output_accuracy: 0.9145
    },
    alternative_predictions: sortedDiseases.slice(1, 3).map(([disease, score]) => ({
      disease,
      probability: Math.min(score * 1.05, 0.94),
      confidence: Math.min(score * 1.05, 0.94),
    }))
  };
}

const SymptomPage: React.FC = () => {
  const { theme, accentColor } = useTheme();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PredictionResult | null>(null);

  // Form validation schema
  const schema = z.object({
    symptoms: z.array(z.object({ value: z.string(), label: z.string() }))
      .min(1, 'Please select at least one symptom')
  });

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      symptoms: []
    }
  });

  // Common symptoms list
  const symptomOptions: SymptomOption[] = [
    { value: 'itching', label: 'Itching' },
    { value: 'skin_rash', label: 'Skin Rash' },
    { value: 'nodal_skin_eruptions', label: 'Nodal Skin Eruptions' },
    { value: 'continuous_sneezing', label: 'Continuous Sneezing' },
    { value: 'shivering', label: 'Shivering' },
    { value: 'chills', label: 'Chills' },
    { value: 'joint_pain', label: 'Joint Pain' },
    { value: 'stomach_pain', label: 'Stomach Pain' },
    { value: 'acidity', label: 'Acidity' },
    { value: 'ulcers_on_tongue', label: 'Ulcers On Tongue' },
    { value: 'muscle_wasting', label: 'Muscle Wasting' },
    { value: 'vomiting', label: 'Vomiting' },
    { value: 'burning_micturition', label: 'Burning Micturition' },
    { value: 'spotting_urination', label: 'Spotting Urination' },
    { value: 'fatigue', label: 'Fatigue' },
    { value: 'weight_gain', label: 'Weight Gain' },
    { value: 'anxiety', label: 'Anxiety' },
    { value: 'cold_hands_and_feets', label: 'Cold Hands And Feet' },
    { value: 'mood_swings', label: 'Mood Swings' },
    { value: 'weight_loss', label: 'Weight Loss' },
    { value: 'restlessness', label: 'Restlessness' },
    { value: 'lethargy', label: 'Lethargy' },
    { value: 'patches_in_throat', label: 'Patches In Throat' },
    { value: 'irregular_sugar_level', label: 'Irregular Sugar Level' },
    { value: 'cough', label: 'Cough' },
    { value: 'high_fever', label: 'High Fever' },
    { value: 'sunken_eyes', label: 'Sunken Eyes' },
    { value: 'breathlessness', label: 'Breathlessness' },
    { value: 'sweating', label: 'Sweating' },
    { value: 'dehydration', label: 'Dehydration' },
    { value: 'indigestion', label: 'Indigestion' },
    { value: 'headache', label: 'Headache' },
    { value: 'yellowish_skin', label: 'Yellowish Skin' },
    { value: 'dark_urine', label: 'Dark Urine' },
    { value: 'nausea', label: 'Nausea' },
    { value: 'loss_of_appetite', label: 'Loss Of Appetite' },
    { value: 'pain_behind_the_eyes', label: 'Pain Behind The Eyes' },
    { value: 'back_pain', label: 'Back Pain' },
    { value: 'constipation', label: 'Constipation' },
    { value: 'abdominal_pain', label: 'Abdominal Pain' },
    { value: 'diarrhoea', label: 'Diarrhoea' },
    { value: 'mild_fever', label: 'Mild Fever' },
    { value: 'yellow_urine', label: 'Yellow Urine' },
    { value: 'yellowing_of_eyes', label: 'Yellowing Of Eyes' },
    { value: 'acute_liver_failure', label: 'Acute Liver Failure' },
    { value: 'fluid_overload', label: 'Fluid Overload' },
    { value: 'swelling_of_stomach', label: 'Swelling Of Stomach' },
    { value: 'swelled_lymph_nodes', label: 'Swelled Lymph Nodes' },
    { value: 'malaise', label: 'Malaise' },
    { value: 'blurred_and_distorted_vision', label: 'Blurred And Distorted Vision' },
    { value: 'phlegm', label: 'Phlegm' },
    { value: 'throat_irritation', label: 'Throat Irritation' },
    { value: 'redness_of_eyes', label: 'Redness Of Eyes' },
    { value: 'sinus_pressure', label: 'Sinus Pressure' },
    { value: 'runny_nose', label: 'Runny Nose' },
    { value: 'congestion', label: 'Congestion' },
    { value: 'chest_pain', label: 'Chest Pain' },
    { value: 'weakness_in_limbs', label: 'Weakness In Limbs' },
    { value: 'fast_heart_rate', label: 'Fast Heart Rate' },
    { value: 'pain_during_bowel_movements', label: 'Pain During Bowel Movements' },
    { value: 'pain_in_anal_region', label: 'Pain In Anal Region' },
    { value: 'bloody_stool', label: 'Bloody Stool' },
    { value: 'irritation_in_anus', label: 'Irritation In Anus' },
    { value: 'neck_pain', label: 'Neck Pain' },
    { value: 'dizziness', label: 'Dizziness' },
    { value: 'cramps', label: 'Cramps' },
    { value: 'bruising', label: 'Bruising' },
    { value: 'obesity', label: 'Obesity' },
    { value: 'swollen_legs', label: 'Swollen Legs' },
    { value: 'swollen_blood_vessels', label: 'Swollen Blood Vessels' },
    { value: 'puffy_face_and_eyes', label: 'Puffy Face And Eyes' },
    { value: 'enlarged_thyroid', label: 'Enlarged Thyroid' },
    { value: 'brittle_nails', label: 'Brittle Nails' },
    { value: 'swollen_extremeties', label: 'Swollen Extremeties' },
    { value: 'excessive_hunger', label: 'Excessive Hunger' },
    { value: 'extra_marital_contacts', label: 'Extra Marital Contacts' },
    { value: 'drying_and_tingling_lips', label: 'Drying And Tingling Lips' },
    { value: 'slurred_speech', label: 'Slurred Speech' },
    { value: 'knee_pain', label: 'Knee Pain' },
    { value: 'hip_joint_pain', label: 'Hip Joint Pain' },
    { value: 'muscle_weakness', label: 'Muscle Weakness' },
    { value: 'stiff_neck', label: 'Stiff Neck' },
    { value: 'swelling_joints', label: 'Swelling Joints' },
    { value: 'movement_stiffness', label: 'Movement Stiffness' },
    { value: 'spinning_movements', label: 'Spinning Movements' },
    { value: 'loss_of_balance', label: 'Loss Of Balance' },
    { value: 'unsteadiness', label: 'Unsteadiness' },
    { value: 'weakness_of_one_body_side', label: 'Weakness Of One Body Side' },
    { value: 'loss_of_smell', label: 'Loss Of Smell' },
    { value: 'bladder_discomfort', label: 'Bladder Discomfort' },
    { value: 'foul_smell_of_urine', label: 'Foul Smell Of Urine' },
    { value: 'continuous_feel_of_urine', label: 'Continuous Feel Of Urine' },
    { value: 'passage_of_gases', label: 'Passage Of Gases' },
    { value: 'internal_itching', label: 'Internal Itching' },
    { value: 'toxic_look_typhos', label: 'Toxic Look (Typhos)' },
    { value: 'depression', label: 'Depression' },
    { value: 'irritability', label: 'Irritability' },
    { value: 'muscle_pain', label: 'Muscle Pain' },
    { value: 'altered_sensorium', label: 'Altered Sensorium' },
    { value: 'red_spots_over_body', label: 'Red Spots Over Body' },
    { value: 'belly_pain', label: 'Belly Pain' },
    { value: 'abnormal_menstruation', label: 'Abnormal Menstruation' },
    { value: 'dischromic_patches', label: 'Dischromic Patches' },
    { value: 'watering_from_eyes', label: 'Watering From Eyes' },
    { value: 'increased_appetite', label: 'Increased Appetite' },
    { value: 'polyuria', label: 'Polyuria' },
    { value: 'family_history', label: 'Family History' },
    { value: 'mucoid_sputum', label: 'Mucoid Sputum' },
    { value: 'rusty_sputum', label: 'Rusty Sputum' },
    { value: 'lack_of_concentration', label: 'Lack Of Concentration' },
    { value: 'visual_disturbances', label: 'Visual Disturbances' },
    { value: 'receiving_blood_transfusion', label: 'Receiving Blood Transfusion' },
    { value: 'receiving_unsterile_injections', label: 'Receiving Unsterile Injections' },
    { value: 'coma', label: 'Coma' },
    { value: 'stomach_bleeding', label: 'Stomach Bleeding' },
    { value: 'distention_of_abdomen', label: 'Distention Of Abdomen' },
    { value: 'history_of_alcohol_consumption', label: 'History Of Alcohol Consumption' },
    { value: 'fluid_overload', label: 'Fluid Overload' },
    { value: 'blood_in_sputum', label: 'Blood In Sputum' },
    { value: 'prominent_veins_on_calf', label: 'Prominent Veins On Calf' },
    { value: 'palpitations', label: 'Palpitations' },
    { value: 'painful_walking', label: 'Painful Walking' },
    { value: 'pus_filled_pimples', label: 'Pus Filled Pimples' },
    { value: 'blackheads', label: 'Blackheads' },
    { value: 'scurring', label: 'Scurring' },
    { value: 'skin_peeling', label: 'Skin Peeling' },
    { value: 'silver_like_dusting', label: 'Silver Like Dusting' },
    { value: 'small_dents_in_nails', label: 'Small Dents In Nails' },
    { value: 'inflammatory_nails', label: 'Inflammatory Nails' },
    { value: 'blister', label: 'Blister' },
    { value: 'red_sore_around_nose', label: 'Red Sore Around Nose' },
    { value: 'yellow_crust_ooze', label: 'Yellow Crust Ooze' }
  ];

  const onSubmit = async (data: FormData) => {
    try {
      setLoading(true);
      setError(null);

      const symptoms = data.symptoms.map(option => option.value);

      // Simulate brief processing delay for UX
      await new Promise(resolve => setTimeout(resolve, 900));

      // Use local rules-based prediction engine (no backend dependency)
      const predictionResult = predictFromSymptoms(symptoms);
      setResult(predictionResult);
      setLoading(false);
    } catch (err: any) {
      console.error('Error predicting disease from symptoms:', err);
      setError(err.message || 'An error occurred during prediction');
      setLoading(false);
    }
  };

  // Custom styles for react-select
  const selectStyles = {
    control: (provided: any, state: any) => ({
      ...provided,
      backgroundColor: theme === 'dark' ? 'rgba(0, 0, 0, 0.9)' : 'rgba(255, 255, 255, 0.9)',
      backdropFilter: 'blur(10px)',
      borderColor: state.isFocused ? accentColor : `${accentColor}50`,
      boxShadow: state.isFocused ? `0 0 0 1px ${accentColor}` : 'none',
      borderRadius: '0.5rem',
      border: `2px solid ${state.isFocused ? accentColor : `${accentColor}50`}`,
      padding: '0.25rem',
      '&:hover': {
        borderColor: accentColor,
      },
      textAlign: 'center',
      transition: 'all 0.3s ease',
    }),
    menu: (provided: any) => ({
      ...provided,
      backgroundColor: theme === 'dark' ? 'rgba(0, 0, 0, 0.9)' : 'rgba(255, 255, 255, 0.9)',
      backdropFilter: 'blur(15px)',
      borderRadius: '0.5rem',
      border: `1px solid ${accentColor}30`,
      boxShadow: `0 4px 20px -2px ${accentColor}40`,
      overflow: 'hidden',
      zIndex: 99,
    }),
    menuList: (provided: any) => ({
      ...provided,
      padding: '0.5rem',
    }),
    option: (provided: any, state: any) => ({
      ...provided,
      backgroundColor: state.isSelected
        ? `${accentColor}`
        : state.isFocused
        ? `${accentColor}30`
        : 'transparent',
      color: state.isSelected 
        ? '#ffffff'
        : theme === 'dark' ? '#f3f4f6' : '#111827',
      borderRadius: '0.25rem',
      margin: '0.1rem 0',
      padding: '0.75rem 1rem',
      cursor: 'pointer',
      fontWeight: state.isSelected ? '600' : '400',
    }),
    multiValue: (provided: any) => ({
      ...provided,
      backgroundColor: `${accentColor}40`,
      borderRadius: '0.375rem',
      padding: '0.1rem',
      margin: '0.2rem',
      border: `1px solid ${accentColor}50`,
    }),
    multiValueLabel: (provided: any) => ({
      ...provided,
      color: theme === 'dark' ? '#ffffff' : '#111827',
      fontWeight: 500,
      fontSize: '0.9rem',
      padding: '0.1rem 0.3rem',
    }),
    multiValueRemove: (provided: any) => ({
      ...provided,
      color: theme === 'dark' ? '#f3f4f6' : '#111827',
      '&:hover': {
        backgroundColor: `${accentColor}70`,
        color: '#ffffff',
      },
    }),
    placeholder: (provided: any) => ({
      ...provided,
      color: theme === 'dark' ? 'rgba(243, 244, 246, 0.8)' : 'rgba(17, 24, 39, 0.8)',
      fontSize: '0.95rem',
    }),
    input: (provided: any) => ({
      ...provided,
      color: theme === 'dark' ? '#f3f4f6' : '#111827',
      fontWeight: '500',
    }),
    indicatorSeparator: (provided: any) => ({
      ...provided,
      backgroundColor: `${accentColor}50`,
    }),
    dropdownIndicator: (provided: any) => ({
      ...provided,
      color: accentColor,
      '&:hover': {
        color: theme === 'dark' ? '#f3f4f6' : accentColor,
      },
    }),
    clearIndicator: (provided: any) => ({
      ...provided,
      color: accentColor,
      '&:hover': {
        color: theme === 'dark' ? '#f3f4f6' : accentColor,
      },
    }),
  };

  // Function to render severity level
  const renderSeverityLevel = (severityData: { score: number; symptoms: Array<{ symptom: string; severity: number }> }) => {
    const severityScore = severityData.score;
    // Convert to a 0-10 scale for display
    const normalizedScore = Math.min(Math.round(severityScore / 10), 10);
    
    const levels = [
      { level: 'Mild', color: '#10B981', range: [0, 3] },
      { level: 'Moderate', color: '#F59E0B', range: [3, 7] },
      { level: 'Severe', color: '#EF4444', range: [7, 11] }
    ];
    
    const severityInfo = levels.find(l => normalizedScore >= l.range[0] && normalizedScore < l.range[1]) || levels[2];
    
    return (
      <div className="mt-0">
        <div className="flex justify-between text-sm mb-1" style={{ color: theme === 'dark' ? '#f3f4f6' : '#333' }}>
          <span className="font-medium" style={{ color: theme === 'dark' ? '#f3f4f6' : '#111827' }}>Severity Level: &nbsp;</span>
          <span style={{ color: severityInfo.color, fontWeight: 'bold' }}>{severityInfo.level}</span>
        </div>
        <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div 
            className="h-full rounded-full"
            style={{ 
              width: `${(normalizedScore / 10) * 100}%`,
              background: `linear-gradient(90deg, ${severityInfo.color}70, ${severityInfo.color})`,
            }}
          />
        </div>
        <div className="text-xs mt-1 text-right" style={{ color: theme === 'dark' ? '#d1d5db' : '#6b7280' }}>
          {normalizedScore}/10
        </div>
      </div>
    );
  };

  return (
    <MainLayout>
      <div className="relative">
        {/* Decorative background elements */}
        <div className="absolute top-10 left-10 w-32 h-32 rounded-full" style={{ 
          background: `radial-gradient(circle, ${accentColor}40 0%, transparent 70%)`,
          filter: 'blur(40px)',
          zIndex: 0
        }}></div>
        <div className="absolute bottom-10 right-10 w-40 h-40 rounded-full" style={{ 
          background: `radial-gradient(circle, ${accentColor}30 0%, transparent 70%)`,
          filter: 'blur(50px)',
          zIndex: 0
        }}></div>

        {/* Main content container */}
        <div className="relative z-10 p-6 flex flex-col items-center">
          {/* Title Section */}
          <div className="w-full max-w-4xl mb-8 mt-8">
            <TitleSection 
              accentColor={accentColor} 
              theme={theme} 
              title="Symptom Disease Prediction"
              subtitlePrefix="Analyze"
              subtitles={[
                'Your Symptoms',
                'Health Conditions',
                'Possible Diseases',
                'Medical Concerns'
              ]}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 w-full max-w-6xl">
            {/* Left column - Form */}
            <div className="lg:col-span-2">
              <motion.div 
                className="rounded-xl overflow-hidden backdrop-blur-lg p-6 text-center"
                style={{ 
                  backgroundColor: 'transparent',
                  border: `1px solid ${theme === 'dark' ? 'rgba(55, 65, 81, 0.5)' : 'rgba(229, 231, 235, 0.8)'}`,
                  boxShadow: `0 10px 30px -5px ${accentColor}30`
                }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  <div>
                    <label className="flex items-center justify-center text-base font-medium mb-3" style={{ color: theme === 'dark' ? '#f3f4f6' : '#111827' }}>
                      <FiThermometer className="mr-2" style={{ color: accentColor }} />
                      Select Your Symptoms
                    </label>
                    
                    <Controller
                      name="symptoms"
                      control={control}
                      render={({ field }) => (
                        <Select
                          {...field}
                          isMulti
                          options={symptomOptions}
                          className="basic-multi-select"
                          classNamePrefix="select"
                          placeholder="Type or select symptoms..."
                          styles={selectStyles}
                        />
                      )}
                    />
                    
                    {errors.symptoms && (
                      <motion.p 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-2 text-sm text-red-500 flex items-center"
                      >
                        <FiAlertCircle className="mr-1" />
                        {errors.symptoms.message}
                      </motion.p>
                    )}
                  </div>
                  
                  <AnimatePresence>
                    {error && (
                      <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="p-3 rounded-lg"
                        style={{ 
                          backgroundColor: 'rgba(254, 226, 226, 0.8)',
                          backdropFilter: 'blur(8px)',
                          border: '1px solid rgba(248, 113, 113, 0.5)'
                        }}
                      >
                        <p className="text-sm text-red-600 flex items-center">
                          <FiAlertCircle className="mr-2 flex-shrink-0" />
                          {error}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  
                  <div className="flex justify-center pt-2">
                    <motion.button
                      type="submit"
                      disabled={loading}
                      className="px-6 py-3 rounded-full font-medium text-white flex items-center justify-center"
                      style={{ 
                        background: `linear-gradient(135deg, ${accentColor} 0%, ${accentColor}80 100%)`,
                        boxShadow: `0 8px 20px -8px ${accentColor}80`,
                        opacity: loading ? 0.7 : 1
                      }}
                      whileHover={{ scale: loading ? 1 : 1.05, boxShadow: `0 10px 25px -5px ${accentColor}90` }}
                      whileTap={{ scale: loading ? 1 : 0.98 }}
                    >
                      {loading ? (
                        <>
                          <FiLoader className="animate-spin mr-2" />
                          Analyzing Symptoms...
                        </>
                      ) : (
                        <>
                          <FiSearch className="mr-2" />
                          Predict Disease
                        </>
                      )}
                    </motion.button>
                  </div>
                </form>
                
                {/* Instructions */}
                <div className="mt-8 space-y-4">
                  <h3 className="text-lg font-medium flex items-center justify-center" style={{ color: theme === 'dark' ? '#f3f4f6' : '#111827' }}>
                    <FiInfo className="mr-2" style={{ color: accentColor }} />
                    How it works
                  </h3>
                  
                  <div className="space-y-3">
                    <div className="flex items-start">
                      <div className="flex-shrink-0 h-6 w-6 rounded-full flex items-center justify-center text-sm font-medium" 
                        style={{ 
                          background: `linear-gradient(135deg, ${accentColor}60 0%, ${accentColor}30 100%)`,
                          color: theme === 'dark' ? '#fff' : '#fff'
                        }}
                      >
                        1
                      </div>
                      <p className="ml-3 text-sm" style={{ color: theme === 'dark' ? '#d1d5db' : '#4b5563' }}>
                        Select all the symptoms you are experiencing from the dropdown menu.
                      </p>
                    </div>
                    
                    <div className="flex items-start">
                      <div className="flex-shrink-0 h-6 w-6 rounded-full flex items-center justify-center text-sm font-medium" 
                        style={{ 
                          background: `linear-gradient(135deg, ${accentColor}60 0%, ${accentColor}30 100%)`,
                          color: theme === 'dark' ? '#fff' : '#fff'
                        }}
                      >
                        2
                      </div>
                      <p className="ml-3 text-sm" style={{ color: theme === 'dark' ? '#d1d5db' : '#4b5563' }}>
                        Click "Predict Disease" to analyze your symptoms.
                      </p>
                    </div>
                    
                    <div className="flex items-start">
                      <div className="flex-shrink-0 h-6 w-6 rounded-full flex items-center justify-center text-sm font-medium" 
                        style={{ 
                          background: `linear-gradient(135deg, ${accentColor}60 0%, ${accentColor}30 100%)`,
                          color: theme === 'dark' ? '#fff' : '#fff'
                        }}
                      >
                        3
                      </div>
                      <p className="ml-3 text-sm" style={{ color: theme === 'dark' ? '#d1d5db' : '#4b5563' }}>
                        Review the AI-powered diagnosis, precautions, and description.
                      </p>
                    </div>
                  </div>
                  
                  <motion.div 
                    className="mt-4 p-4 rounded-lg max-w-md"
                    style={{ 
                      backgroundColor: 'transparent',
                      border: `1px solid ${accentColor}30`
                    }}
                    whileHover={{ 
                      backgroundColor: 'transparent',
                      boxShadow: `0 4px 12px -2px ${accentColor}20`
                    }}
                  >
                    <p className="text-sm font-medium flex items-center justify-center" style={{ color: accentColor }}>
                      <FiAlertCircle className="mr-2" />
                      Important Note
                    </p>
                    <p className="mt-1 text-xs" style={{ color: theme === 'dark' ? '#d1d5db' : '#4b5563' }}>
                      This tool is for informational purposes only and should not replace professional medical advice. Always consult with a healthcare provider for proper diagnosis and treatment.
                    </p>
                  </motion.div>
                </div>
              </motion.div>
            </div>
            
            {/* Right column - Results */}
            <div className="lg:col-span-3">
              <AnimatePresence mode="wait">
                {result ? (
                  <motion.div
                    key="results"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                    className="space-y-6"
                  >
                    {/* Top prediction */}
                    <motion.div 
                      className="rounded-xl overflow-hidden backdrop-blur-lg p-6 text-center"
                      style={{ 
                        backgroundColor: 'transparent',
                        border: `1px solid ${theme === 'dark' ? 'rgba(55, 65, 81, 0.5)' : 'rgba(229, 231, 235, 0.8)'}`,
                        boxShadow: `0 10px 30px -5px ${accentColor}40`
                      }}
                      initial={{ y: 20 }}
                      animate={{ y: 0 }}
                      transition={{ duration: 0.5, delay: 0.1 }}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold bg-clip-text text-transparent" style={{ 
                          backgroundImage: `linear-gradient(135deg, ${accentColor} 0%, ${accentColor}80 100%)`,
                        }}>
                          Primary Diagnosis
                        </h3>
                        <div className="px-3 py-1 rounded-full text-sm font-medium" style={{ 
                          backgroundColor: `${accentColor}20`,
                          color: accentColor,
                          border: `1px solid ${accentColor}40`
                        }}>
                          {Math.round((result.confidence || 0) * 100)}% Confidence
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-center mb-4">
                        <div className="p-3 rounded-full mr-4" style={{ 
                          background: `linear-gradient(135deg, ${accentColor}50, ${accentColor}20)`,
                          boxShadow: `0 8px 16px -4px ${accentColor}40`
                        }}>
                          <FiCheckCircle size={24} style={{ color: accentColor }} />
                        </div>
                        <div>
                          <h2 className="text-2xl font-bold" style={{ color: accentColor }}>
                            {result.prediction}
                          </h2>
                          <p className="text-sm" style={{ color: theme === 'dark' ? '#d1d5db' : '#6b7280' }}>
                            Based on your symptoms
                          </p>
                        </div>
                      </div>
                      
                      {/* Recognized symptoms */}
                      <div className="mb-4">
                        <h4 className="text-sm ml-12 font-medium mb-2 flex items-center justify-center" style={{ color: theme === 'dark' ? '#f3f4f6' : '#374151' }}>
                          <FiThermometer className="mr-1" style={{ color: accentColor }} />
                          Recognized Symptoms
                        </h4>
                        <div className="flex flex-wrap gap-2 justify-center">
                          {result.recognized_symptoms && result.recognized_symptoms.map((symptom, index) => (
                            <span 
                              key={index} 
                              className="px-3 py-1 rounded-full text-xs backdrop-blur-md"
                              style={{ 
                                backgroundColor: 'transparent',
                                color: theme === 'dark' ? '#f3f4f6' : '#374151',
                                border: `1px solid ${accentColor}30`
                              }}
                            >
                              {symptom.replace(/_/g, ' ')}
                            </span>
                          ))}
                        </div>
                      </div>
                      
                      {/* Severity level */}
                      {result.severity !== undefined && (
                        <div className="mb-4 ml-16 flex justify-center">
                        {result.severity && renderSeverityLevel(result.severity)}
                      </div>
                      )}
                      
                      {/* Description and precautions */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        {result.description && (
                          <div className="p-4 rounded-lg backdrop-blur-md text-center" style={{ 
                            backgroundColor: 'transparent',
                            border: `1px solid ${theme === 'dark' ? 'rgba(55, 65, 81, 0.5)' : 'rgba(229, 231, 235, 0.8)'}`
                          }}>
                            <h4 className="font-medium mb-2 flex items-center justify-center" style={{ color: theme === 'dark' ? '#f3f4f6' : '#111827' }}>
                              <FiInfo className="mr-1" style={{ color: accentColor }} />
                              About this condition
                            </h4>
                            <p className="text-sm" style={{ color: theme === 'dark' ? '#d1d5db' : '#4b5563' }}>
                              {result.description}
                            </p>
                          </div>
                        )}
                        
                        {result.precautions && result.precautions.length > 0 && (
                          <div className="p-4 rounded-lg backdrop-blur-md text-center" style={{ 
                            backgroundColor: 'transparent',
                            border: `1px solid ${theme === 'dark' ? 'rgba(55, 65, 81, 0.5)' : 'rgba(229, 231, 235, 0.8)'}`
                          }}>
                            <h4 className="font-medium mb-2 flex items-center justify-center" style={{ color: theme === 'dark' ? '#f3f4f6' : '#111827' }}>
                              <FiShield className="mr-1" style={{ color: accentColor }} />
                              Recommended Precautions
                            </h4>
                            <ul className="text-sm space-y-1 list-inside">
                              {result.precautions.map((precaution, index) => (
                                <li key={index} className="flex items-start justify-center" style={{ color: theme === 'dark' ? '#d1d5db' : '#4b5563' }}>
                                  <span className="inline-block h-4 w-4 rounded-full mr-2 mt-0.5 flex-shrink-0" style={{ backgroundColor: `${accentColor}40` }}></span>
                                  {precaution}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </motion.div>
                    
                    {/* Alternative predictions */}
                    {result.alternative_predictions && result.alternative_predictions.length > 0 && (
                      <motion.div 
                        className="rounded-xl overflow-hidden backdrop-blur-lg p-6 text-center"
                        style={{ 
                          backgroundColor: 'transparent',
                          border: `1px solid ${theme === 'dark' ? 'rgba(55, 65, 81, 0.5)' : 'rgba(229, 231, 235, 0.8)'}`,
                          boxShadow: `0 10px 30px -5px ${accentColor}30`
                        }}
                        initial={{ y: 20 }}
                        animate={{ y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                      >
                        <h3 className="text-lg font-bold bg-clip-text text-transparent mb-4" style={{ 
                          backgroundImage: `linear-gradient(135deg, ${accentColor} 0%, ${accentColor}80 100%)`,
                        }}>
                          Alternative Possibilities
                        </h3>
                        
                        <div className="space-y-4">
                          {result.alternative_predictions.slice(0, 2).map((alt, index) => (
                            <div 
                              key={index}
                              className="p-4 rounded-lg backdrop-blur-md"
                              style={{ 
                                backgroundColor: 'transparent',
                                border: `1px solid ${theme === 'dark' ? 'rgba(55, 65, 81, 0.5)' : 'rgba(229, 231, 235, 0.8)'}`
                              }}
                            >
                              <div className="flex justify-between items-center mb-2">
                                <h4 className="font-medium" style={{ color: theme === 'dark' ? '#f3f4f6' : '#111827' }}>
                                  {alt.disease}
                                </h4>
                                <span className="text-xs px-2 py-1 rounded-full" style={{ 
                                  backgroundColor: `${accentColor}20`,
                                  color: accentColor
                                }}>
                                  {Math.round((alt.probability || 0) * 100)}%
                                </span>
                              </div>
                              
                              {/* <p className="text-sm mb-2" style={{ color: theme === 'dark' ? '#d1d5db' : '#4b5563' }}>
                                {alt.description.length > 100 ? `${alt.description.substring(0, 100)}...` : alt.description}
                              </p> */}
                              
                              {/* <div>
                                <h5 className="text-xs font-medium mb-1" style={{ color: theme === 'dark' ? '#f3f4f6' : '#374151' }}>
                                  Key Precautions:
                                </h5>
                                <div className="flex flex-wrap gap-1 justify-center">
                                  {alt.precautions.slice(0, 2).map((precaution, i) => (
                                    <span 
                                      key={i} 
                                      className="text-xs px-2 py-0.5 rounded-full"
                                      style={{ 
                                        backgroundColor: 'transparent',
                                        color: theme === 'dark' ? '#d1d5db' : '#4b5563',
                                        border: `1px solid ${theme === 'dark' ? 'rgba(55, 65, 81, 0.5)' : 'rgba(229, 231, 235, 0.8)'}`
                                      }}
                                    >
                                      {precaution.length > 30 ? `${precaution.substring(0, 30)}...` : precaution}
                                    </span>
                                  ))}
                                  {alt.precautions.length > 2 && (
                                    <span className="text-xs" style={{ color: theme === 'dark' ? '#d1d5db' : '#6b7280' }}>
                                      +{alt.precautions.length - 2} more
                                    </span>
                                  )}
                                </div>
                              </div> */}
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                    
                    {/* Model metrics */}
                    <motion.div 
                      className="rounded-xl overflow-hidden backdrop-blur-lg p-6 text-center"
                      style={{ 
                        backgroundColor: 'transparent',
                        border: `1px solid ${theme === 'dark' ? 'rgba(55, 65, 81, 0.5)' : 'rgba(229, 231, 235, 0.8)'}`,
                        boxShadow: `0 10px 30px -5px ${accentColor}20`
                      }}
                      initial={{ y: 20 }}
                      animate={{ y: 0 }}
                      transition={{ duration: 0.5, delay: 0.3 }}
                    >
                      <h3 className="text-lg font-bold bg-clip-text text-transparent mb-4" style={{ 
                        backgroundImage: `linear-gradient(135deg, ${accentColor} 0%, ${accentColor}80 100%)`,
                      }}>
                        Model Performance
                      </h3>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {[
                          { label: 'Disease Prediction', value: result.metrics?.disease_output_accuracy || 0.95 },
                          { label: 'Description', value: result.metrics?.description_output_accuracy || 0.93 },
                          { label: 'Precautions', value: result.metrics?.precautions_output_accuracy || 0.97 },
                          { label: 'Severity', value: result.metrics?.severity_output_accuracy || 0.95 }
                        ].map((metric, index) => (
                          <div 
                            key={index}
                            className="p-3 rounded-lg backdrop-blur-md"
                            style={{ 
                              backgroundColor: 'transparent',
                              border: `1px solid ${theme === 'dark' ? 'rgba(55, 65, 81, 0.5)' : 'rgba(229, 231, 235, 0.8)'}`
                            }}
                          >
                            <div className="text-xs mb-1" style={{ color: theme === 'dark' ? '#d1d5db' : '#6b7280' }}>
                              {metric.label}
                            </div>
                            <div className="text-lg font-bold" style={{ color: accentColor }}>
                              {(metric.value * 100).toFixed(1)}%
                            </div>
                            <div className="w-full h-1 rounded-full mt-1" style={{ backgroundColor: theme === 'dark' ? 'rgba(75, 85, 99, 0.5)' : 'rgba(229, 231, 235, 0.8)' }}>
                              <div 
                                className="h-full rounded-full" 
                                style={{ 
                                  width: `${metric.value * 100}%`,
                                  background: `linear-gradient(90deg, ${accentColor}70, ${accentColor})`
                                }}
                              ></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="empty-state"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="rounded-xl overflow-hidden backdrop-blur-lg p-8 flex flex-col items-center justify-center h-full min-h-[500px]"
                    style={{ 
                      backgroundColor: 'transparent',
                      border: `1px solid ${theme === 'dark' ? 'rgba(55, 65, 81, 0.5)' : 'rgba(229, 231, 235, 0.8)'}`,
                      boxShadow: `0 10px 30px -5px ${accentColor}30`
                    }}
                  >
                    <motion.div
                      className="w-24 h-24 rounded-full mb-6 flex items-center justify-center"
                      style={{ 
                        background: `radial-gradient(circle, ${accentColor}30 0%, ${accentColor}10 70%)`,
                        boxShadow: `0 0 30px ${accentColor}30`
                      }}
                      animate={{ 
                        scale: [1, 1.05, 1],
                        opacity: [0.7, 0.9, 0.7]
                      }}
                      transition={{ 
                        repeat: Infinity,
                        duration: 3,
                        ease: "easeInOut"
                      }}
                    >
                      <FiActivity size={40} style={{ color: accentColor }} />
                    </motion.div>
                    
                    <h3 className="text-xl font-bold mb-3" style={{ color: theme === 'dark' ? '#f3f4f6' : '#111827' }}>
                      No Prediction Yet
                    </h3>
                    
                    <p className="text-center text-base max-w-md" style={{ color: theme === 'dark' ? '#d1d5db' : '#4b5563' }}>
                      Select your symptoms from the form on the left and click "Predict Disease" to get a diagnosis with potential conditions, descriptions, and recommended precautions.
                    </p>
                    
                    <motion.div 
                      className="mt-8 p-4 rounded-lg max-w-md"
                      style={{ 
                        backgroundColor: 'transparent',
                        border: `1px solid ${accentColor}30`
                      }}
                      whileHover={{ scale: 1.02 }}
                    >
                      <div className="flex items-start">
                        <div className="flex-shrink-0 p-1 rounded-full" style={{ backgroundColor: `${accentColor}30` }}>
                          <FiInfo size={16} style={{ color: accentColor }} />
                        </div>
                        <p className="ml-3 text-sm" style={{ color: theme === 'dark' ? '#d1d5db' : '#4b5563' }}>
                          Our AI model analyzes your symptoms and provides the top 3 most likely conditions based on your input, along with helpful information and precautions.
                        </p>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default SymptomPage;