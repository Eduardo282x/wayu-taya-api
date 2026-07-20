import { Injectable } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from 'src/generated/prisma/client';

@Injectable()
export class PrismaService extends PrismaClient {
    constructor() {
        const databaseUrl = process.env.DATABASE_URL;

        if (!databaseUrl) {
            throw new Error(
                'DATABASE_URL no está definido. Asegúrate de cargar el archivo .env o exportar la variable antes de iniciar la aplicación.'
            );
        }

        const adapter = new PrismaPg({
            connectionString: databaseUrl,
        });
        super({ adapter });
    }
}