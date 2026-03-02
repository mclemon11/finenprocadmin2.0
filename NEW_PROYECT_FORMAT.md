{
  "general": {
    "name": "Test proyect",
    "description": "A Test proyect to config the UI to investors",
    "body": "Lorem ipsum...",
    "category": "Trading",
    "type": "fixed",
    "status": "active",
    "visibleToUsers": true,
    "investable": true,
    "createdAt": Timestamp,
    "updatedAt": Timestamp
  },

  "location": {
    "country": "Colombia",
    "region": "Antioquia",
    "city": "Medellín",
    "assetType": "energy",
    "operator": "Ecobuble"
  },

  "financials": {
    "targetAmount": 60000,
    "capitalRecaudado": 0,
    "capitalObjetivo": 60000,
    "minInvestment": 100,
    "maxInvestment": 9998,
    "totalInvested": 0,
    "totalInvestment": 0
  },

  "returns": {
    "expectedROI": 15,
    "roiAnual": 0,
    "roiAcumulado": 0,
    "totalROI": 20,
    "estimatedIRR": null,
    "paybackPeriod": null,
    "paymentFrequency": "monthly",
    "returnExpected": null
  },

  "risk": {
    "riskScore": 4,
    "riskLevel": "low",
    "countryRisk": true,
    "regulatoryRisk": false,
    "hasGuarantee": true,
    "guaranteeType": "Activo",
    "guaranteeValue": 3000
  },

  "capitalDistribution": {
    "infraestructura": 35,
    "operacion": 25,
    "beneficio": 25,
    "reserva": 15
  },

  "costStructure": {
    "initialCapex": 1500,
    "minViableCapital": 2000,
    "monthlyOperatingCost": 200
  },

  "projections": {
    "scenario": "base",
    "monthlyRevenue": null,
    "monthlyCosts": null,
    "operatingMargin": null,
    "contingencyFund": null
  },

  "duration": {
    "months": 16,
    "durationMeses": 16
  },

  "images": {
    "cover": {
      "path": "projects/...jpeg",
      "url": "https://...",
      "updatedAt": Timestamp
    },
    "gallery": [
      {
        "path": "projects/...jpeg",
        "url": "https://..."
      }
    ]
  },

  "documents": {
    "items": [],
    "updatedAt": Timestamp
  },

  "controls": {
    "manualControl": true,
    "autoLockOnTarget": true,
    "kycRequired": true
  },

  "restrictions": {
    "minInvestment": 100,
    "maxInvestment": null,
    "maxInvestors": null,
    "maxPercentPerInvestor": null
  },

  "performance": null,
  "drawdown": null,
  "paymentCalendar": [],
  "charts": {},
  "finance": {},
  "metrics": {}
}