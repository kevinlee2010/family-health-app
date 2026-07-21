export const riskLevels = {
  average: 'Average',
  increased: 'Increased',
  higherAttention: 'Higher Attention Recommended',
}

export const prototypeCutoffs = {
  increased: 4,
  higherAttention: 8,
}

export const firstDegreeRelationships = ['Mother', 'Father', 'Sibling']

export const modifiabilityTypes = {
  modifiable: 'modifiable',
  nonmodifiable: 'nonmodifiable',
}

export const conditionIds = {
  heartDisease: 'heartDisease',
  stroke: 'stroke',
  type2Diabetes: 'type2Diabetes',
  highBloodPressure: 'highBloodPressure',
  highCholesterol: 'highCholesterol',
  breastCancer: 'breastCancer',
  colorectalCancer: 'colorectalCancer',
}

export function getRiskLevel(score) {
  if (score >= prototypeCutoffs.higherAttention) {
    return riskLevels.higherAttention
  }

  if (score >= prototypeCutoffs.increased) {
    return riskLevels.increased
  }

  return riskLevels.average
}
