"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("../../app.module");
const usuarios_service_1 = require("../../usuarios/usuarios.service");
async function bootstrap() {
    const app = await core_1.NestFactory.createApplicationContext(app_module_1.AppModule);
    const usuariosService = app.get(usuarios_service_1.UsuariosService);
    const email = process.env.SEED_ADMIN_EMAIL ?? 'admin@agente.com';
    const password = process.env.SEED_ADMIN_PASSWORD ?? 'Admin2026!';
    const existing = await usuariosService.findByEmail(email);
    if (existing) {
        console.log(`✅ Usuario admin ya existe: ${email}`);
    }
    else {
        await usuariosService.create({
            nombre: 'Administrador',
            email,
            password,
            rol: 'admin',
            activo: true,
        });
        console.log(`✅ Usuario admin creado: ${email}`);
        console.log(`   Contraseña: ${password}`);
        console.log(`   ⚠️  Cambia la contraseña en producción.`);
    }
    await app.close();
}
bootstrap().catch((err) => {
    console.error('❌ Error al ejecutar el seed:', err);
    process.exit(1);
});
//# sourceMappingURL=admin.seed.js.map