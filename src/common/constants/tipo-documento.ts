export const TIPOS_DOCUMENTO = ['CC', 'TI', 'CE', 'Pasaporte'] as const;
export type TipoDocumento = (typeof TIPOS_DOCUMENTO)[number];
