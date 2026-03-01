export interface AIRiskScore {
  overall: number
  confidence: number
  factors: RiskFactor[]
  modelVersion: string
  generatedAt: Date
}

export interface RiskFactor {
  name: string
  weight: number
  impact: 'INCREASES' | 'DECREASES'
  value: string
}

export interface AIAlert {
  id: string
  type: 'FRAUD' | 'INTEREST_ANOMALY' | 'NPA_PREDICTION' | 'CASH_FLOW_WARNING'
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
  affectedEntity: {
    type: 'MEMBER' | 'LOAN' | 'TRANSACTION'
    id: string
    name: string
  }
  explanation: string
  confidence: number
  timestamp: Date
  status: 'PENDING' | 'ACKNOWLEDGED' | 'DISMISSED' | 'ESCALATED'
}

export interface CashFlowForecast {
  date: Date
  optimistic: number
  base: number
  pessimistic: number
  confidence: number
}

export interface AIModel {
  id: string
  name: string
  type: 'RISK_SCORER' | 'FRAUD_DETECTOR' | 'NPA_PREDICTOR' | 'AUTO_LEDGER' | 'ANOMALY_DETECTOR'
  version: string
  deployedDate: Date
  accuracy: number
  status: 'ACTIVE' | 'INACTIVE' | 'DEPRECATED'
  lastBiasAudit?: Date
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  language: 'EN' | 'HI' | 'MR'
}
