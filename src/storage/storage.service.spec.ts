// uuid se distribuye como ESM y ts-jest no lo transforma
jest.mock('uuid', () => ({ v4: () => 'uuid-fijo' }));

import { of } from 'rxjs';
import { StorageService } from './storage.service';

const API = 'https://api.test';

function crearServicio(env: Record<string, string>, propfindXml = '') {
  const configService = { get: (key: string) => env[key] } as any;
  const httpService = {
    request: jest.fn().mockReturnValue(of({ data: propfindXml })),
  } as any;
  const service = new StorageService(httpService, configService, {} as any);
  return { service, httpService };
}

const ENV_KOOFR = {
  STORAGE_DAV_URL: 'https://app.koofr.net/',
  STORAGE_DAV_ROOT: '/dav/Koofr/',
  STORAGE_USER: 'yo@correo.com',
  STORAGE_PASSWORD: 'secreto',
};

const ENV_NEXTCLOUD_LEGACY = {
  NEXTCLOUD_URL: 'https://cloud.midominio.com',
  NEXTCLOUD_USER: 'admin',
  NEXTCLOUD_PASSWORD: 'secreto',
};

const xml = (...hrefs: string[]) =>
  `<d:multistatus>${hrefs.map((h) => `<d:response><d:href>${h}</d:href></d:response>`).join('')}</d:multistatus>`;

describe('StorageService', () => {
  describe('configuración', () => {
    it('usa STORAGE_DAV_ROOT para armar la URL WebDAV', async () => {
      const { service, httpService } = crearServicio(ENV_KOOFR, xml());
      await service.browseNcPath('Photos', API);
      expect(httpService.request).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'https://app.koofr.net/dav/Koofr/Photos',
        }),
      );
    });

    it('cae a NEXTCLOUD_* y a la raíz de Nextcloud si no hay STORAGE_*', async () => {
      const { service, httpService } = crearServicio(
        ENV_NEXTCLOUD_LEGACY,
        xml(),
      );
      await service.browseNcPath('Photos', API);
      expect(httpService.request).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'https://cloud.midominio.com/remote.php/dav/files/admin/Photos',
        }),
      );
    });

    it('falla al arrancar si falta una variable obligatoria', () => {
      expect(() => crearServicio({ STORAGE_DAV_URL: 'https://x' })).toThrow(
        'STORAGE_USER',
      );
    });
  });

  describe('browseNcPath', () => {
    const esperado = {
      path: 'Photos',
      subfolders: [{ path: 'Photos/Viajes 2026', name: 'Viajes 2026' }],
      images: [
        {
          filename: 'playa.jpg',
          ncPath: 'Photos/playa.jpg',
          url: `${API}/v1/storage/nc-photo/Photos/playa.jpg`,
        },
      ],
    };

    it('entiende hrefs con URL absoluta (Koofr)', async () => {
      const { service } = crearServicio(
        ENV_KOOFR,
        xml(
          'https://app.koofr.net/dav/Koofr/Photos/',
          'https://app.koofr.net/dav/Koofr/Photos/Viajes%202026/',
          'https://app.koofr.net/dav/Koofr/Photos/playa.jpg',
        ),
      );
      await expect(service.browseNcPath('Photos', API)).resolves.toEqual(
        esperado,
      );
    });

    it('detecta carpetas de Koofr sin "/" final por <collection/>', async () => {
      const respuesta = (href: string, carpeta: boolean) =>
        `<D:response><D:href>${href}</D:href><D:propstat><D:prop><D:resourcetype>${carpeta ? '<D:collection xmlns:D="DAV:"/>' : ''}</D:resourcetype></D:prop></D:propstat></D:response>`;
      const { service } = crearServicio(
        ENV_KOOFR,
        `<D:multistatus>${[
          respuesta('/dav/Koofr', true),
          respuesta('/dav/Koofr/Photos', true),
          respuesta('/dav/Koofr/portada.jpg', false),
        ].join('')}</D:multistatus>`,
      );
      await expect(service.browseNcPath('', API)).resolves.toEqual({
        path: '',
        subfolders: [{ path: 'Photos', name: 'Photos' }],
        images: [
          {
            filename: 'portada.jpg',
            ncPath: 'portada.jpg',
            url: `${API}/v1/storage/nc-photo/portada.jpg`,
          },
        ],
      });
    });

    it('entiende hrefs con ruta relativa (Nextcloud)', async () => {
      const { service } = crearServicio(
        ENV_NEXTCLOUD_LEGACY,
        xml(
          '/remote.php/dav/files/admin/Photos/',
          '/remote.php/dav/files/admin/Photos/Viajes%202026/',
          '/remote.php/dav/files/admin/Photos/playa.jpg',
        ),
      );
      await expect(service.browseNcPath('Photos', API)).resolves.toEqual(
        esperado,
      );
    });
  });
});
