export { applyMetricEffects, calculateRelationshipHealth, METRIC_DISPLAY } from './metrics-engine';
export { validateScenario, checkTagCompatibility } from './tag-validator';
export type { ValidationResult, ValidationError } from './tag-validator';
export { processChoice, findEnding, calculateDominantStyle, calculateStyleDistribution, calculateProfileUpdates, STYLE_LABELS } from './game-engine';
export { checkScenarioUnlock, enrichScenarioCatalog, DIFFICULTY_LABELS } from './progression';
export { filterScenarios, sortScenarios, groupByRelationship, recommendScenarios, RELATIONSHIP_CATEGORIES } from './scenario-matcher';
export type { ScenarioFilters } from './scenario-matcher';
