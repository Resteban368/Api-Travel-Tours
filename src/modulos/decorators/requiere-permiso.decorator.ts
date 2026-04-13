import { SetMetadata } from '@nestjs/common';
import { TipoPermiso } from '../entities/permiso-agente.entity';

export const PERMISO_KEY = 'permiso_modulo';

export interface PermisoMetadata {
  modulo: string;
  nivel?: TipoPermiso;
}

export const RequierePermiso = (modulo: string, nivel?: TipoPermiso) =>
  SetMetadata(PERMISO_KEY, { modulo, nivel } as PermisoMetadata);
