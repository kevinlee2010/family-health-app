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
      'Ask about diabetes prevention programs if you have prediabetes or other risk factors.',
    ],
    screening:
      'Blood glucose tests can check for diabetes or prediabetes. People with risk factors should ask a healthcare professional whether and how often they should be screened.',
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
      'General heart-health checks often include blood pressure, cholesterol, blood glucose, weight, and lifestyle risk review. A clinician may recommend additional tests based on symptoms and risk.',
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
      'Blood pressure measurement is the typical screening test. Frequency depends on age, past readings, and individual risk, so discuss timing with a healthcare professional.',
    resources: [
      {
        label: 'American Heart Association: What Is High Blood Pressure?',
        url: 'https://www.heart.org/en/health-topics/high-blood-pressure/the-facts-about-high-blood-pressure',
      },
      {
        label: 'American Heart Association: High Blood Pressure Risk Factors',
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
      'A lipid panel blood test checks total cholesterol, LDL, HDL, and triglycerides. The American Heart Association notes that many adults start regular screening by age 19, with timing adjusted for personal risk.',
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
      'There is not one routine screening test for stroke risk. General prevention often includes checking blood pressure, cholesterol, blood sugar, and heart rhythm when clinically appropriate.',
    resources: [
      {
        label: 'CDC: Stroke Signs and Symptoms',
        url: 'https://www.cdc.gov/stroke/signs-symptoms/index.html',
      },
      {
        label: 'CDC: Stroke Risk Factors',
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
      'Mammograms are the main screening test. Average-risk screening timing varies by age and preference; people at higher risk may need earlier or additional screening such as MRI.',
    resources: [
      {
        label: 'American Cancer Society: Breast Cancer Risk and Prevention',
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
      'The American Cancer Society recommends that people at average risk start regular colorectal cancer screening at age 45. People with higher risk may need earlier or different screening.',
    resources: [
      {
        label: 'American Cancer Society: Colorectal Cancer',
        url: 'https://www.cancer.org/cancer/types/colon-rectal-cancer.html',
      },
      {
        label: 'American Cancer Society: Causes, Risks, and Prevention',
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
      'Having allergies or obesity can also be associated with asthma risk.',
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
      'Increasing age is the strongest known risk factor.',
      'Family history and genetics can play a role.',
      'Some health and lifestyle factors, such as blood pressure, physical activity, hearing loss, depression, and head injury history, may affect dementia risk.',
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

export function normalizeConditionName(value) {
  return value
    .trim()
    .replace(/\u2019/g, "'")
    .replace(/\s+/g, ' ')
    .toLowerCase()
}

export function getConditionDetails(conditionName) {
  const normalizedName = normalizeConditionName(conditionName)
  const detailKey = conditionAliases[normalizedName] || normalizedName

  return conditionDetails[detailKey] || null
}
