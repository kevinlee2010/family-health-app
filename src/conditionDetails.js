const conditionDetails = {
  'type 2 diabetes': {
    name: 'Type 2 Diabetes',
    overview:
      'Type 2 diabetes is a long-term condition where the body has trouble using insulin well, which can cause blood sugar levels to rise over time.',
    symptoms: [
      'Often develops slowly and may have no noticeable symptoms at first.',
      'Increased thirst, frequent urination, hunger, or fatigue.',
      'Blurred vision, slow-healing cuts, or numbness or tingling in the hands or feet.',
    ],
    riskFactors: [
      'Family history of type 2 diabetes.',
      'Being age 45 or older.',
      'Having overweight or obesity, being physically inactive, or having a history of gestational diabetes.',
      'High blood pressure, high cholesterol, or a history of heart disease or stroke.',
    ],
    preventionTips: [
      'Maintain regular physical activity and a balanced eating pattern.',
      'Work with a clinician on healthy weight, blood pressure, and cholesterol goals.',
      'Ask about diabetes prevention programs if you have prediabetes or other health factors.',
    ],
    screening:
      'Blood glucose tests can check for diabetes or prediabetes. People with health factors should ask a healthcare professional whether and how often they should be screened.',
    resources: [
      {
        label: 'CDC: About Type 2 Diabetes',
        url: 'https://www.cdc.gov/diabetes/about/about-type-2-diabetes.html',
      },
      {
        label: 'CDC: Diabetes Testing',
        url: 'https://www.cdc.gov/diabetes/diabetes-testing/index.html',
      },
      {
        label: 'MedlinePlus: Type 2 Diabetes',
        url: 'https://medlineplus.gov/diabetestype2.html',
      },
    ],
  },
  'heart disease': {
    name: 'Heart Disease',
    overview:
      'Heart disease is a broad term for conditions that affect the heart. Coronary heart disease, one common type, happens when plaque buildup narrows arteries that supply the heart.',
    symptoms: [
      'Chest pain, pressure, or discomfort.',
      'Shortness of breath, unusual fatigue, dizziness, or nausea.',
      'Pain or discomfort in the arm, back, neck, jaw, or upper belly can also occur.',
    ],
    riskFactors: [
      'Older age and family history of early heart disease.',
      'High blood pressure, high cholesterol, diabetes, or smoking.',
      'Physical inactivity, unhealthy eating patterns, and having overweight or obesity.',
    ],
    preventionTips: [
      'Avoid tobacco and limit exposure to secondhand smoke.',
      'Stay physically active and choose heart-healthy foods.',
      'Work with a healthcare professional to monitor and manage blood pressure, cholesterol, and blood sugar.',
    ],
    screening:
      'General heart-health checks often include blood pressure, cholesterol, blood glucose, weight, and lifestyle health-factor review. A clinician may recommend additional tests based on symptoms and health history.',
    resources: [
      {
        label: 'MedlinePlus: Heart Diseases',
        url: 'https://medlineplus.gov/heartdiseases.html',
      },
      {
        label: 'MedlinePlus: How to Prevent Heart Disease',
        url: 'https://medlineplus.gov/howtopreventheartdisease.html',
      },
      {
        label: 'American Heart Association: Heart-Health Screenings',
        url: 'https://www.heart.org/en/health-topics/consumer-healthcare/what-is-cardiovascular-disease/heart-health-screenings',
      },
    ],
  },
  'high blood pressure': {
    name: 'High Blood Pressure',
    overview:
      'High blood pressure, also called hypertension, means the force of blood against artery walls stays higher than recommended, which can strain the heart and blood vessels.',
    symptoms: [
      'Often has no symptoms, which is why checking blood pressure matters.',
      'Very high blood pressure with chest pain, shortness of breath, weakness, numbness, or severe headache needs urgent medical attention.',
    ],
    riskFactors: [
      'Family history, older age, and chronic kidney disease.',
      'High-sodium eating patterns, physical inactivity, and having overweight or obesity.',
      'Smoking, heavy alcohol use, sleep apnea, diabetes, and high cholesterol.',
    ],
    preventionTips: [
      'Check blood pressure regularly and know your numbers.',
      'Limit sodium, avoid tobacco, stay active, and maintain a balanced eating pattern.',
      'Take prescribed medicines as directed if a clinician recommends them.',
    ],
    screening:
      'Blood pressure measurement is the typical screening test. Frequency depends on age, past readings, and individual health history, so discuss timing with a healthcare professional.',
    resources: [
      {
        label: 'American Heart Association: What Is High Blood Pressure?',
        url: 'https://www.heart.org/en/health-topics/high-blood-pressure/the-facts-about-high-blood-pressure',
      },
      {
        label: 'American Heart Association: High Blood Pressure Health Factors',
        url: 'https://www.heart.org/en/health-topics/high-blood-pressure/know-your-risk-factors-for-high-blood-pressure',
      },
      {
        label: 'American Heart Association: Managing High Blood Pressure',
        url: 'https://www.heart.org/en/health-topics/high-blood-pressure/changes-you-can-make-to-manage-high-blood-pressure',
      },
    ],
  },
  'high cholesterol': {
    name: 'High Cholesterol',
    overview:
      'High cholesterol means there are higher-than-recommended levels of cholesterol or other fats in the blood, which can contribute to plaque buildup in arteries.',
    symptoms: [
      'Usually has no symptoms.',
      'Many people learn about it from a cholesterol blood test.',
    ],
    riskFactors: [
      'Family history and aging.',
      'Eating patterns high in saturated or trans fats.',
      'Physical inactivity, smoking, diabetes, and having overweight or obesity.',
    ],
    preventionTips: [
      'Choose foods lower in saturated fat and higher in fiber.',
      'Stay physically active and avoid tobacco.',
      'Discuss cholesterol goals and treatment options with a healthcare professional.',
    ],
    screening:
      'A lipid panel blood test checks total cholesterol, LDL, HDL, and triglycerides. The American Heart Association notes that many adults start regular screening by age 19, with timing adjusted for personal health history.',
    resources: [
      {
        label: 'American Heart Association: Cholesterol',
        url: 'https://www.heart.org/en/health-topics/cholesterol',
      },
      {
        label: 'American Heart Association: How to Get Your Cholesterol Tested',
        url: 'https://www.heart.org/en/health-topics/cholesterol/how-to-get-your-cholesterol-tested',
      },
      {
        label: 'American Heart Association: What Your Cholesterol Levels Mean',
        url: 'https://www.heart.org/en/health-topics/cholesterol/about-cholesterol/what-your-cholesterol-levels-mean',
      },
    ],
  },
  stroke: {
    name: 'Stroke',
    overview:
      'A stroke happens when blood flow to part of the brain is blocked or when a blood vessel in the brain bursts. It is a medical emergency.',
    symptoms: [
      'Sudden numbness or weakness in the face, arm, or leg, especially on one side.',
      'Sudden confusion, trouble speaking, or trouble understanding speech.',
      'Sudden vision trouble, dizziness, loss of balance, or severe headache with no known cause.',
    ],
    riskFactors: [
      'High blood pressure, high cholesterol, diabetes, and heart disease.',
      'Smoking, physical inactivity, and unhealthy eating patterns.',
      'Older age, prior stroke or TIA, and family history.',
    ],
    preventionTips: [
      'Call 911 right away for stroke symptoms.',
      'Manage blood pressure, cholesterol, diabetes, and heart rhythm concerns with a healthcare team.',
      'Avoid tobacco, stay active, and maintain a balanced eating pattern.',
    ],
    screening:
      'There is not one routine screening test for stroke prevention. General prevention often includes checking blood pressure, cholesterol, blood sugar, and heart rhythm when clinically appropriate.',
    resources: [
      {
        label: 'CDC: Stroke Signs and Symptoms',
        url: 'https://www.cdc.gov/stroke/signs-symptoms/index.html',
      },
      {
        label: 'CDC: Stroke Health Factors',
        url: 'https://www.cdc.gov/stroke/risk-factors/index.html',
      },
      {
        label: 'CDC: Preventing Stroke',
        url: 'https://www.cdc.gov/stroke/prevention/index.html',
      },
    ],
  },
  'breast cancer': {
    name: 'Breast Cancer',
    overview:
      'Breast cancer starts when cells in breast tissue grow out of control. It can affect women and men, though it is much more common in women.',
    symptoms: [
      'A new lump or mass in the breast or underarm.',
      'Breast swelling, skin dimpling, nipple changes, or nipple discharge.',
      'Any new breast change should be checked by a healthcare professional.',
    ],
    riskFactors: [
      'Getting older and being born female.',
      'Family history, inherited gene changes, or a personal history of breast cancer.',
      'Alcohol use, physical inactivity, and having excess body weight after menopause.',
    ],
    preventionTips: [
      'Stay physically active and maintain a healthy weight when possible.',
      'Limit or avoid alcohol and avoid tobacco.',
      'Discuss personal and family history with a clinician, especially if multiple relatives have had breast or related cancers.',
    ],
    screening:
      'Mammograms are the main screening test. Screening timing varies by age, preference, and personal or family history. A healthcare professional can help determine whether additional screening is appropriate.',
    resources: [
      {
        label: 'American Cancer Society: Breast Cancer Prevention',
        url: 'https://www.cancer.org/cancer/types/breast-cancer/risk-and-prevention.html',
      },
      {
        label: 'American Cancer Society: Breast Cancer Early Detection',
        url: 'https://www.cancer.org/cancer/types/breast-cancer/screening-tests-and-early-detection.html',
      },
      {
        label: 'American Cancer Society: Breast Cancer Screening Guidelines',
        url: 'https://www.cancer.org/cancer/types/breast-cancer/screening-tests-and-early-detection/american-cancer-society-recommendations-for-the-early-detection-of-breast-cancer.html',
      },
    ],
  },
  'colon cancer': {
    name: 'Colon Cancer',
    overview:
      'Colon cancer is part of colorectal cancer, which starts in the colon or rectum. It can begin as growths called polyps that may become cancer over time.',
    symptoms: [
      'A change in bowel habits, blood in the stool, or rectal bleeding.',
      'Abdominal pain or cramping, weakness, fatigue, or unexplained weight loss.',
      'Early colorectal cancer may not cause symptoms.',
    ],
    riskFactors: [
      'Older age, personal history of polyps or inflammatory bowel disease, and family history.',
      'Inherited syndromes such as Lynch syndrome or familial adenomatous polyposis.',
      'Type 2 diabetes, physical inactivity, having excess body weight, smoking, heavy alcohol use, or diets high in red or processed meat.',
    ],
    preventionTips: [
      'Keep up with recommended colorectal cancer screening.',
      'Stay physically active and maintain a balanced eating pattern.',
      'Avoid tobacco and limit alcohol.',
    ],
    screening:
      'The American Cancer Society recommends that many adults discuss regular colorectal cancer screening around midlife. People with relevant family history may need a personalized screening conversation.',
    resources: [
      {
        label: 'American Cancer Society: Colorectal Cancer',
        url: 'https://www.cancer.org/cancer/types/colon-rectal-cancer.html',
      },
      {
        label: 'American Cancer Society: Causes and Prevention',
        url: 'https://www.cancer.org/cancer/types/colon-rectal-cancer/causes-risks-prevention.html',
      },
      {
        label: 'American Cancer Society: Colorectal Screening Recommendations',
        url: 'https://www.cancer.org/cancer/types/colon-rectal-cancer/detection-diagnosis-staging/acs-recommendations.html',
      },
    ],
  },
  asthma: {
    name: 'Asthma',
    overview:
      'Asthma is a chronic lung disease where airways can become inflamed and narrowed, making it harder to breathe.',
    symptoms: [
      'Wheezing, coughing, chest tightness, or shortness of breath.',
      'Symptoms may come and go and can worsen during an asthma attack or flare-up.',
    ],
    riskFactors: [
      'Family history of asthma or allergies.',
      'Exposure to secondhand smoke, air pollution, workplace irritants, or allergens.',
      'Having allergies or obesity can also be associated with asthma-related health concerns.',
    ],
    preventionTips: [
      'Avoid known triggers when possible and do not smoke.',
      'Follow an asthma action plan if a clinician provides one.',
      'Use prescribed controller or rescue medicines as directed.',
    ],
    screening:
      'Asthma evaluation may include medical history, physical exam, and lung function tests such as spirometry or peak flow measurement.',
    resources: [
      {
        label: 'MedlinePlus: Asthma',
        url: 'https://medlineplus.gov/asthma.html',
      },
      {
        label: 'CDC: Asthma',
        url: 'https://www.cdc.gov/asthma/index.html',
      },
    ],
  },
  "alzheimer's disease": {
    name: "Alzheimer's Disease",
    overview:
      "Alzheimer's disease is a brain disorder that gradually affects memory, thinking skills, behavior, and the ability to carry out daily activities.",
    symptoms: [
      'Memory loss that disrupts daily life.',
      'Confusion, trouble solving problems, difficulty with language, or getting lost in familiar places.',
      'Changes in mood, personality, judgment, or daily functioning.',
    ],
    riskFactors: [
      'Increasing age is the strongest known health factor.',
      'Family history and genetics can play a role.',
      'Some health and lifestyle factors, such as blood pressure, physical activity, hearing loss, depression, and head injury history, may be relevant to dementia-related prevention conversations.',
    ],
    preventionTips: [
      "There is no proven way to prevent Alzheimer's disease.",
      'General brain-health steps may include physical activity, blood pressure management, social connection, and cognitive engagement.',
      'Discuss memory or thinking changes with a healthcare professional.',
    ],
    screening:
      'There is no routine screening test for everyone. Evaluation for concerns may include medical history, cognitive tests, medicine review, lab tests, and sometimes brain imaging or specialist referral.',
    resources: [
      {
        label: "National Institute on Aging: Alzheimer's Disease Fact Sheet",
        url: 'https://www.nia.nih.gov/health/alzheimers-and-dementia/alzheimers-disease-fact-sheet',
      },
      {
        label: "MedlinePlus: Alzheimer's Disease",
        url: 'https://medlineplus.gov/alzheimersdisease.html',
      },
      {
        label: "National Institute on Aging: Preventing Alzheimer's Disease",
        url: 'https://www.nia.nih.gov/health/alzheimers-and-dementia/preventing-alzheimers-disease-what-do-we-know',
      },
    ],
  },
}

const conditionAliases = {
  alzheimers: "alzheimer's disease",
  'alzheimers disease': "alzheimer's disease",
  diabetes: 'type 2 diabetes',
  hypertension: 'high blood pressure',
  'blood pressure': 'high blood pressure',
  cholesterol: 'high cholesterol',
  'colon cancer': 'colon cancer',
  'colorectal cancer': 'colon cancer',
  'cardiovascular disease': 'heart disease',
}

const conditionCategoryFallbacks = [
  {
    name: 'Cardiovascular condition',
    keywords: [
      'heart',
      'stroke',
      'blood pressure',
      'hypertension',
      'cholesterol',
      'cardiovascular',
    ],
    overview:
      'This condition is related to the heart or blood vessels. Family history can be a useful clue for prevention conversations, especially when close relatives are affected.',
    symptoms: [
      'Some cardiovascular conditions have no symptoms until checked by a clinician.',
      'Warning signs can include chest discomfort, shortness of breath, sudden weakness, dizziness, or unusual fatigue.',
      'Sudden stroke-like symptoms or severe chest pain should be treated as an emergency.',
    ],
    riskFactors: [
      'Family history of heart disease, stroke, high blood pressure, or high cholesterol.',
      'High blood pressure, high cholesterol, diabetes, smoking, and physical inactivity.',
      'Age, diet, sleep, stress, and weight can also be relevant to cardiovascular prevention conversations.',
    ],
    preventionTips: [
      'Discuss blood pressure, cholesterol, and blood sugar checks with a healthcare professional.',
      'Stay physically active, avoid tobacco, and choose heart-supportive eating patterns.',
      'Share family history details with your clinician, especially if relatives were diagnosed early.',
    ],
    screening:
      'Common prevention checks include blood pressure, cholesterol, blood sugar, weight, and lifestyle review. A clinician can recommend timing based on personal and family history.',
    resources: [
      {
        label: 'American Heart Association: Health Topics',
        url: 'https://www.heart.org/en/health-topics',
      },
      {
        label: 'CDC: Heart Disease',
        url: 'https://www.cdc.gov/heart-disease/index.html',
      },
      {
        label: 'MedlinePlus: Heart and Circulation',
        url: 'https://medlineplus.gov/heartandcirculation.html',
      },
    ],
  },
  {
    name: 'Diabetes or metabolic condition',
    keywords: ['diabetes', 'obesity', 'metabolic'],
    overview:
      'This condition is related to blood sugar, body weight, hormones, or how the body uses energy. Family history can help guide screening conversations.',
    symptoms: [
      'Some metabolic conditions develop slowly and may not cause obvious symptoms at first.',
      'Possible signs can include fatigue, increased thirst, frequent urination, weight changes, or changes in energy.',
      'Symptoms vary by condition and should be discussed with a healthcare professional.',
    ],
    riskFactors: [
      'Family history of diabetes, obesity, or metabolic disease.',
      'Physical inactivity, eating patterns, sleep, stress, and weight can be relevant to preventive care.',
      'Blood pressure, cholesterol, and other health conditions can also matter.',
    ],
    preventionTips: [
      'Ask about blood sugar, cholesterol, blood pressure, and weight-related screening.',
      'Build habits around regular movement, balanced nutrition, and healthy weight support.',
      'Track family history changes and bring them to preventive care visits.',
    ],
    screening:
      'Screening may include blood glucose, A1C, cholesterol, blood pressure, and weight-related measures. Timing depends on age, symptoms, and health factors.',
    resources: [
      {
        label: 'CDC: Diabetes',
        url: 'https://www.cdc.gov/diabetes/index.html',
      },
      {
        label: 'MedlinePlus: Diabetes',
        url: 'https://medlineplus.gov/diabetes.html',
      },
      {
        label: 'NIH: Obesity',
        url: 'https://www.niddk.nih.gov/health-information/weight-management/adult-overweight-obesity',
      },
    ],
  },
  {
    name: 'Cancer',
    keywords: ['cancer', 'melanoma', 'tumor', 'tumour'],
    overview:
      'Cancer happens when cells grow out of control. Family history can be important, especially when several relatives have cancer or diagnoses happened at younger ages.',
    symptoms: [
      'Symptoms vary widely by cancer type and may not appear early.',
      'Possible warning signs include new lumps, unusual bleeding, unexplained weight loss, persistent pain, or changes in skin, bowel, or urinary habits.',
      'New or persistent changes should be discussed with a healthcare professional.',
    ],
    riskFactors: [
      'Family history of cancer, especially in close relatives.',
      'Inherited gene changes can be relevant for some cancers.',
      'Age, tobacco, alcohol, sun exposure, infections, and lifestyle factors can also contribute.',
    ],
    preventionTips: [
      'Discuss whether family history suggests earlier or different screening.',
      'Avoid tobacco, limit alcohol, use sun protection, stay active, and keep up with routine care.',
      'Ask whether genetic counseling is appropriate if cancer appears repeatedly in the family.',
    ],
    screening:
      'Screening depends on cancer type, age, sex, symptoms, and family history. A healthcare professional can help decide which screenings are appropriate.',
    resources: [
      {
        label: 'American Cancer Society: Cancer A-Z',
        url: 'https://www.cancer.org/cancer/types.html',
      },
      {
        label: 'National Cancer Institute: Cancer Types',
        url: 'https://www.cancer.gov/types',
      },
      {
        label: 'CDC: Cancer',
        url: 'https://www.cdc.gov/cancer/index.htm',
      },
    ],
  },
  {
    name: 'Neurological condition',
    keywords: ['alzheimer', 'parkinson', 'neurological', 'dementia'],
    overview:
      'This condition affects the brain, nerves, movement, memory, or thinking. Family history may be one clue, but many neurological conditions have multiple causes.',
    symptoms: [
      'Symptoms can include memory changes, movement changes, tremor, weakness, numbness, or changes in balance.',
      'Mood, sleep, speech, thinking, or daily function may also change depending on the condition.',
      'New neurological symptoms should be discussed with a healthcare professional.',
    ],
    riskFactors: [
      'Family history can matter for some neurological conditions.',
      'Age, vascular health, head injury history, sleep, and other health conditions may contribute.',
      'Health factors vary widely by condition.',
    ],
    preventionTips: [
      'Discuss family history and new symptoms with a healthcare professional.',
      'Support brain health through physical activity, blood pressure management, sleep, and social connection.',
      'Track changes over time so they can be shared during visits.',
    ],
    screening:
      'Screening and evaluation depend on symptoms. A clinician may use history, exam, cognitive or movement testing, lab work, imaging, or specialist referral.',
    resources: [
      {
        label: 'National Institute of Neurological Disorders and Stroke',
        url: 'https://www.ninds.nih.gov/health-information/disorders',
      },
      {
        label: 'MedlinePlus: Brain and Nerves',
        url: 'https://medlineplus.gov/brainandnerves.html',
      },
    ],
  },
  {
    name: 'Respiratory condition',
    keywords: ['asthma', 'copd', 'lung', 'respiratory'],
    overview:
      'This condition affects the lungs or breathing. Family history, environment, allergies, infections, and smoke exposure can all play a role depending on the condition.',
    symptoms: [
      'Shortness of breath, wheezing, cough, or chest tightness.',
      'Symptoms may be triggered by activity, infections, allergens, smoke, or air pollution.',
      'Severe breathing trouble should be treated as urgent.',
    ],
    riskFactors: [
      'Family history of asthma, allergies, or lung disease.',
      'Smoking, secondhand smoke, air pollution, workplace exposures, or repeated lung infections.',
      'Allergies and obesity can also affect some breathing conditions.',
    ],
    preventionTips: [
      'Avoid tobacco smoke and known breathing triggers when possible.',
      'Ask about lung function testing if symptoms or family history suggest it.',
      'Follow an action plan or medications if prescribed by a clinician.',
    ],
    screening:
      'Evaluation may include symptom review, physical exam, oxygen measurement, and lung function tests such as spirometry.',
    resources: [
      {
        label: 'American Lung Association: Lung Health & Diseases',
        url: 'https://www.lung.org/lung-health-diseases',
      },
      {
        label: 'CDC: Asthma',
        url: 'https://www.cdc.gov/asthma/index.html',
      },
      {
        label: 'MedlinePlus: Lung Diseases',
        url: 'https://medlineplus.gov/lungdiseases.html',
      },
    ],
  },
  {
    name: 'Bone, joint, or autoimmune condition',
    keywords: [
      'osteoporosis',
      'arthritis',
      'rheumatoid',
      'lupus',
      'crohn',
      'ulcerative',
      'celiac',
      'autoimmune',
    ],
    overview:
      'This condition may affect bones, joints, digestion, inflammation, or the immune system. Some of these conditions can run in families.',
    symptoms: [
      'Symptoms vary but can include pain, swelling, stiffness, fatigue, digestive changes, rashes, or flares that come and go.',
      'Some conditions are silent early and are found through screening or lab tests.',
      'Persistent or worsening symptoms should be discussed with a healthcare professional.',
    ],
    riskFactors: [
      'Family history of autoimmune, inflammatory, bone, or joint conditions.',
      'Sex, age, hormones, nutrition, smoking, infections, and other immune factors can contribute.',
      'Health factors depend on the specific condition.',
    ],
    preventionTips: [
      'Track symptoms, flares, and family history details over time.',
      'Discuss screening or specialist referral if several relatives have related conditions.',
      'Support overall health with activity, balanced nutrition, sleep, and avoiding tobacco.',
    ],
    screening:
      'Evaluation may include medical history, physical exam, blood tests, imaging, bone density testing, or condition-specific testing.',
    resources: [
      {
        label: 'MedlinePlus: Autoimmune Diseases',
        url: 'https://medlineplus.gov/autoimmunediseases.html',
      },
      {
        label: 'NIH NIAMS: Health Topics',
        url: 'https://www.niams.nih.gov/health-topics',
      },
      {
        label: 'MedlinePlus: Bone, Joint and Muscle Disorders',
        url: 'https://medlineplus.gov/bonesjointsandmuscles.html',
      },
    ],
  },
  {
    name: 'Kidney or endocrine condition',
    keywords: ['kidney', 'renal', 'thyroid', 'endocrine'],
    overview:
      'This condition is related to the kidneys, hormones, or glands. Family history can be useful for deciding what to monitor over time.',
    symptoms: [
      'Symptoms vary and may include fatigue, swelling, urination changes, weight changes, temperature sensitivity, or changes in heart rate.',
      'Some kidney or thyroid conditions may have few symptoms early.',
      'Lab tests are often important for detection and monitoring.',
    ],
    riskFactors: [
      'Family history of kidney disease, thyroid disease, or endocrine disorders.',
      'High blood pressure, diabetes, autoimmune disease, and some inherited conditions can affect kidney or hormone health.',
      'Health factors depend on the specific condition.',
    ],
    preventionTips: [
      'Ask about blood pressure, blood sugar, kidney function, urine, or thyroid testing when relevant.',
      'Manage blood pressure and diabetes-related health factors with a healthcare professional.',
      'Track family history changes, especially inherited kidney conditions.',
    ],
    screening:
      'Screening may include blood pressure, blood tests, urine tests, thyroid labs, imaging, or specialist evaluation depending on the condition.',
    resources: [
      {
        label: 'National Kidney Foundation: Kidney Disease',
        url: 'https://www.kidney.org/kidney-topics/chronic-kidney-disease-ckd',
      },
      {
        label: 'MedlinePlus: Kidney Diseases',
        url: 'https://medlineplus.gov/kidneydiseases.html',
      },
      {
        label: 'MedlinePlus: Thyroid Diseases',
        url: 'https://medlineplus.gov/thyroiddiseases.html',
      },
    ],
  },
  {
    name: 'Vision condition',
    keywords: ['glaucoma', 'macular', 'vision', 'eye'],
    overview:
      'This condition affects the eyes or vision. Some eye diseases can run in families and may be easier to manage when found early.',
    symptoms: [
      'Some eye conditions cause no symptoms in early stages.',
      'Possible signs include blurry vision, loss of side vision, distorted central vision, eye pain, or trouble seeing in low light.',
      'Sudden vision loss or severe eye pain needs urgent care.',
    ],
    riskFactors: [
      'Family history of glaucoma, macular degeneration, or other eye disease.',
      'Age, diabetes, high blood pressure, smoking, and eye injury history can be relevant to preventive care.',
      'Health factors vary by condition.',
    ],
    preventionTips: [
      'Schedule regular comprehensive eye exams, especially with family history.',
      'Manage blood pressure, diabetes, and tobacco exposure.',
      'Protect eyes from injury and discuss vision changes promptly.',
    ],
    screening:
      'Eye screening may include a dilated eye exam, eye pressure measurement, retinal exam, visual field testing, or imaging depending on health history.',
    resources: [
      {
        label: 'National Eye Institute: Eye Conditions',
        url: 'https://www.nei.nih.gov/learn-about-eye-health/eye-conditions-and-diseases',
      },
      {
        label: 'MedlinePlus: Eye Diseases',
        url: 'https://medlineplus.gov/eyediseases.html',
      },
    ],
  },
  {
    name: 'Mental or behavioral health condition',
    keywords: [
      'depression',
      'anxiety',
      'bipolar',
      'schizophrenia',
      'adhd',
      'autism',
      'mental',
    ],
    overview:
      'This condition affects mood, thinking, attention, behavior, or daily functioning. Family history can be one helpful clue, but support and treatment are highly individual.',
    symptoms: [
      'Symptoms vary and can include mood changes, anxiety, trouble focusing, sleep changes, social or communication differences, or changes in daily function.',
      'Warning signs can also include withdrawal, severe distress, or thoughts of self-harm.',
      'If someone may harm themselves or others, seek emergency help right away.',
    ],
    riskFactors: [
      'Family history of mental or behavioral health conditions.',
      'Stress, trauma, sleep, substance use, medical conditions, and environment can also contribute.',
      'Health factors vary by condition and person.',
    ],
    preventionTips: [
      'Discuss symptoms and family history with a qualified healthcare or mental health professional.',
      'Support mental health with sleep, social connection, movement, and stress-management routines.',
      'Track symptoms and seek help early if distress or daily functioning worsens.',
    ],
    screening:
      'Screening may include questionnaires, clinical interviews, developmental evaluation, or referral to a mental health specialist.',
    resources: [
      {
        label: 'NIMH: Health Topics',
        url: 'https://www.nimh.nih.gov/health/topics',
      },
      {
        label: 'MedlinePlus: Mental Health',
        url: 'https://medlineplus.gov/mentalhealth.html',
      },
      {
        label: '988 Suicide & Crisis Lifeline',
        url: 'https://988lifeline.org/',
      },
    ],
  },
  {
    name: 'Inherited blood or genetic condition',
    keywords: [
      'sickle',
      'thalassemia',
      'hemophilia',
      'cystic fibrosis',
      'inherited',
      'genetic',
      'blood disorder',
    ],
    overview:
      'This condition may be inherited through genes. Family history can be especially important for understanding carrier status, testing options, and reproductive planning.',
    symptoms: [
      'Symptoms depend on the condition and may include anemia, pain episodes, bleeding problems, lung or digestive symptoms, or frequent infections.',
      'Some people may be carriers without symptoms.',
      'Known family history is important to share with healthcare professionals.',
    ],
    riskFactors: [
      'Having biological relatives with the condition or carrier status.',
      'Ancestry can affect the likelihood of some inherited blood disorders.',
      'Both parents may need to carry certain gene changes for a child to be affected.',
    ],
    preventionTips: [
      'Ask whether genetic counseling or carrier screening is appropriate.',
      'Keep a clear family history record and share it with clinicians.',
      'Follow condition-specific care plans if a diagnosis is known.',
    ],
    screening:
      'Testing may include newborn screening, blood tests, carrier screening, genetic testing, or referral to a genetics professional.',
    resources: [
      {
        label: 'MedlinePlus Genetics',
        url: 'https://medlineplus.gov/genetics/',
      },
      {
        label: 'CDC: Genomics and Precision Health',
        url: 'https://www.cdc.gov/genomics/index.htm',
      },
      {
        label: 'NIH: Genetic and Rare Diseases Information Center',
        url: 'https://rarediseases.info.nih.gov/',
      },
    ],
  },
]

export function normalizeConditionName(value) {
  return value
    .trim()
    .replace(/\u2019/g, "'")
    .replace(/\s*\([^)]*\)/g, '')
    .replace(/\s+/g, ' ')
    .toLowerCase()
}

export function getConditionDetails(conditionName) {
  const normalizedName = normalizeConditionName(conditionName)
  const detailKey = conditionAliases[normalizedName] || normalizedName
  const exactDetails = conditionDetails[detailKey]

  if (exactDetails) {
    return exactDetails
  }

  const fallback = conditionCategoryFallbacks.find(({ keywords }) =>
    keywords.some((keyword) => detailKey.includes(keyword)),
  )

  if (!fallback) {
    return null
  }

  return {
    ...fallback,
    name: conditionName,
  }
}
