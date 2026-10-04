export const publicHealthDatasetRecords = [
  {
    id: 'cdc-family-health-history',
    label: 'CDC Family Health History',
    organization: 'CDC',
    type: 'education',
    url: 'https://www.cdc.gov/family-health-history/about/index.html',
    description:
      'Explains how family health history can help identify health patterns and guide prevention conversations with healthcare professionals.',
  },
  {
    id: 'medlineplus-genetics',
    label: 'MedlinePlus Genetics',
    organization: 'NIH National Library of Medicine',
    type: 'education-api',
    url: 'https://medlineplus.gov/genetics/',
    dataUrl: 'https://medlineplus.gov/about/developers/geneticsdatafilesapi/',
    description:
      'Consumer-friendly genetics information with condition summaries, genes, inheritance patterns, and downloadable/API-accessible data files.',
  },
  {
    id: 'clinvar',
    label: 'ClinVar',
    organization: 'NCBI / NIH',
    type: 'variant-database',
    url: 'https://www.ncbi.nlm.nih.gov/clinvar/',
    dataUrl: 'https://www.ncbi.nlm.nih.gov/clinvar/docs/programmatic_access/',
    description:
      'Public archive of reported relationships between human genetic variants and health conditions. Best used for genetics education, not broad family-history scoring without genetic test data.',
  },
  {
    id: 'nci-bcrat',
    label: 'NCI Breast Cancer Risk Assessment Tool',
    organization: 'National Cancer Institute',
    type: 'official-calculator',
    url: 'https://bcrisktool.cancer.gov/',
    description:
      'Official breast cancer risk calculator that uses personal factors and first-degree family history. The app links to it instead of copying its clinical model.',
  },
  {
    id: 'canrisk',
    label: 'CanRisk / BOADICEA',
    organization: 'Centre for Cancer Genetic Epidemiology',
    type: 'official-calculator',
    url: 'https://www.canrisk.org/',
    description:
      'Clinical pedigree-based tool for breast, ovarian, and prostate cancer risk. It is useful as an external reference for complex hereditary cancer patterns.',
  },
  {
    id: 'qcancer-colorectal',
    label: 'QCancer Colorectal Risk Calculator',
    organization: 'QResearch',
    type: 'official-calculator',
    url: 'https://qcancer.org/',
    description:
      'Research-based colorectal cancer risk calculator. It is linked as an external tool rather than embedded as a validated app score.',
  },
]

const publicHealthDatasetsById = new Map(
  publicHealthDatasetRecords.map((record) => [record.id, record]),
)

const conditionPublicDataRecords = {
  diabetes: {
    inheritanceSummary:
      'Diabetes often reflects a mix of family history, shared environment, and lifestyle factors rather than a simple one-gene inheritance pattern.',
    likelihoodGuidance:
      'Public sources can support an increased-awareness category when close relatives are affected, but they do not provide one universal percent likelihood for every family.',
    sourceIds: [
      'cdc-family-health-history',
      'medlineplus-genetics',
    ],
  },
  'heart disease': {
    inheritanceSummary:
      'Heart disease can cluster in families because relatives may share genes, habits, environments, blood pressure, cholesterol patterns, or diabetes-related factors.',
    likelihoodGuidance:
      'Family history is useful for prevention conversations, but exact likelihood depends on personal health factors and clinician-reviewed details.',
    sourceIds: [
      'cdc-family-health-history',
      'medlineplus-genetics',
    ],
  },
  'high blood pressure': {
    inheritanceSummary:
      'High blood pressure can run in families, but diet, activity, weight, sleep, stress, kidney health, and environment also matter.',
    likelihoodGuidance:
      'The app should treat reported family history as an awareness signal, not as a precise inherited probability.',
    sourceIds: [
      'cdc-family-health-history',
      'medlineplus-genetics',
    ],
  },
  'high cholesterol': {
    inheritanceSummary:
      'High cholesterol can be influenced by family history and lifestyle. Some families may have inherited cholesterol conditions that need clinician review.',
    likelihoodGuidance:
      'Multiple affected relatives or early heart disease can make cholesterol screening worth discussing, but exact likelihood requires medical context.',
    sourceIds: [
      'cdc-family-health-history',
      'medlineplus-genetics',
      'clinvar',
    ],
  },
  stroke: {
    inheritanceSummary:
      'Stroke risk patterns can cluster through family history of blood pressure, cholesterol, diabetes, heart rhythm problems, and shared lifestyle factors.',
    likelihoodGuidance:
      'Family history can point to prevention topics, but public datasets do not provide a single inherited percent chance for stroke.',
    sourceIds: [
      'cdc-family-health-history',
      'medlineplus-genetics',
    ],
  },
  'breast cancer': {
    inheritanceSummary:
      'Breast cancer family history can matter more when close relatives are affected, diagnoses occurred young, or breast/ovarian/prostate cancers repeat across a family.',
    likelihoodGuidance:
      'Official tools such as NCI BCRAT and CanRisk can estimate risk in specific contexts; this app should link to them instead of inventing a percentage.',
    sourceIds: [
      'cdc-family-health-history',
      'medlineplus-genetics',
      'clinvar',
      'nci-bcrat',
      'canrisk',
    ],
  },
  'colon cancer': {
    inheritanceSummary:
      'Colon cancer family history can be important, especially with close relatives, young diagnosis ages, or patterns suggesting hereditary colorectal cancer syndromes.',
    likelihoodGuidance:
      'Public tools can guide screening conversations, but exact likelihood depends on age, personal history, family details, and clinician review.',
    sourceIds: [
      'cdc-family-health-history',
      'medlineplus-genetics',
      'clinvar',
      'qcancer-colorectal',
    ],
  },
  asthma: {
    inheritanceSummary:
      'Asthma can run in families, but allergies, smoke exposure, air quality, infections, and environment also play major roles.',
    likelihoodGuidance:
      'Family history supports awareness and prevention planning, but it does not produce a single inherited likelihood.',
    sourceIds: [
      'cdc-family-health-history',
      'medlineplus-genetics',
    ],
  },
  "alzheimer's disease": {
    inheritanceSummary:
      "Alzheimer's disease can have genetic and family-history components, but age and many health factors also influence brain-health risk.",
    likelihoodGuidance:
      'Public genetics resources can explain inheritance concepts, but personal likelihood should be discussed with a healthcare professional or genetic counselor.',
    sourceIds: [
      'medlineplus-genetics',
      'clinvar',
    ],
  },
}

const conditionAliases = {
  'type 2 diabetes': 'diabetes',
  hypertension: 'high blood pressure',
  'blood pressure': 'high blood pressure',
  cholesterol: 'high cholesterol',
  'colorectal cancer': 'colon cancer',
  alzheimers: "alzheimer's disease",
  'alzheimers disease': "alzheimer's disease",
  'cardiovascular disease': 'heart disease',
}

function normalizeConditionName(value) {
  return String(value || '')
    .trim()
    .replace(/\u2019/g, "'")
    .replace(/\s*\([^)]*\)/g, '')
    .replace(/\s+/g, ' ')
    .toLowerCase()
}

function uniqueResources(resources) {
  const seenUrls = new Set()

  return resources.filter((resource) => {
    if (!resource?.url || seenUrls.has(resource.url)) {
      return false
    }

    seenUrls.add(resource.url)
    return true
  })
}

export function getPublicHealthDatasetById(datasetId) {
  return publicHealthDatasetsById.get(datasetId) || null
}

export function getPublicDataContext(conditionName) {
  const normalizedName = normalizeConditionName(conditionName)
  const lookupKey = conditionAliases[normalizedName] || normalizedName

  return conditionPublicDataRecords[lookupKey] || {
    inheritanceSummary:
      'Some conditions have family-history patterns, while others are influenced more by environment, lifestyle, age, or chance.',
    likelihoodGuidance:
      'No single public dataset gives an exact inherited likelihood for every family. Use this as educational context to guide prevention conversations.',
    sourceIds: [
      'cdc-family-health-history',
      'medlineplus-genetics',
    ],
  }
}

export function getPublicDataResources(conditionName) {
  const context = getPublicDataContext(conditionName)

  return uniqueResources(
    context.sourceIds
      .map((sourceId) => getPublicHealthDatasetById(sourceId))
      .filter(Boolean)
      .map((source) => ({
        label: source.label,
        type: source.type,
        url: source.url,
      })),
  )
}
