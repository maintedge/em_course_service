export const envData = process.env.ENV_DATA
  ? (typeof JSON.parse(process.env.ENV_DATA) === 'string'
	  ? JSON.parse(JSON.parse(process.env.ENV_DATA))
	  : JSON.parse(process.env.ENV_DATA))
  : {};

export const FRONTEND_URL = envData.FRONTEND_URL || 'https://skillup.maintedge.com';