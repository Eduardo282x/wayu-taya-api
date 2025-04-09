-- CreateTable
CREATE TABLE "Estados" (
    "id_estado" SERIAL NOT NULL,
    "estado" TEXT NOT NULL,

    CONSTRAINT "Estados_pkey" PRIMARY KEY ("id_estado")
);

-- CreateTable
CREATE TABLE "Municipios" (
    "id_municipio" SERIAL NOT NULL,
    "id_estado" INTEGER NOT NULL,
    "municipio" TEXT NOT NULL,

    CONSTRAINT "Municipios_pkey" PRIMARY KEY ("id_municipio")
);

-- CreateTable
CREATE TABLE "Ciudades" (
    "id_ciudad" SERIAL NOT NULL,
    "id_municipio" INTEGER NOT NULL,
    "ciudad" TEXT NOT NULL,

    CONSTRAINT "Ciudades_pkey" PRIMARY KEY ("id_ciudad")
);

-- CreateTable
CREATE TABLE "Parroquias" (
    "id_parroquia" SERIAL NOT NULL,
    "id_ciudad" INTEGER NOT NULL,
    "parroquia" TEXT NOT NULL,

    CONSTRAINT "Parroquias_pkey" PRIMARY KEY ("id_parroquia")
);

-- CreateTable
CREATE TABLE "Persona" (
    "id_persona" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT NOT NULL,
    "edad" INTEGER NOT NULL,
    "direccion" TEXT NOT NULL,
    "id_parroquia" INTEGER NOT NULL,
    "telefono" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "numero_identificacion" TEXT NOT NULL,
    "empleado" BOOLEAN NOT NULL,
    "razon_social" TEXT NOT NULL,
    "entidad" TEXT NOT NULL,
    "fecha_creacion" TIMESTAMP(3) NOT NULL,
    "fecha_modificacion" TIMESTAMP(3) NOT NULL,
    "activo" BOOLEAN NOT NULL,

    CONSTRAINT "Persona_pkey" PRIMARY KEY ("id_persona")
);

-- CreateTable
CREATE TABLE "Documentos" (
    "id_documento" SERIAL NOT NULL,
    "nombre_documento" TEXT NOT NULL,
    "id_parroquia" INTEGER NOT NULL,
    "link" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Documentos_pkey" PRIMARY KEY ("id_documento")
);

-- CreateTable
CREATE TABLE "Colaboradores" (
    "id" SERIAL NOT NULL,
    "id_documento" INTEGER NOT NULL,
    "id_persona" INTEGER NOT NULL,

    CONSTRAINT "Colaboradores_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Municipios" ADD CONSTRAINT "Municipios_id_estado_fkey" FOREIGN KEY ("id_estado") REFERENCES "Estados"("id_estado") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ciudades" ADD CONSTRAINT "Ciudades_id_municipio_fkey" FOREIGN KEY ("id_municipio") REFERENCES "Municipios"("id_municipio") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Parroquias" ADD CONSTRAINT "Parroquias_id_ciudad_fkey" FOREIGN KEY ("id_ciudad") REFERENCES "Ciudades"("id_ciudad") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Persona" ADD CONSTRAINT "Persona_id_parroquia_fkey" FOREIGN KEY ("id_parroquia") REFERENCES "Parroquias"("id_parroquia") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Documentos" ADD CONSTRAINT "Documentos_id_parroquia_fkey" FOREIGN KEY ("id_parroquia") REFERENCES "Parroquias"("id_parroquia") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Colaboradores" ADD CONSTRAINT "Colaboradores_id_documento_fkey" FOREIGN KEY ("id_documento") REFERENCES "Documentos"("id_documento") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Colaboradores" ADD CONSTRAINT "Colaboradores_id_persona_fkey" FOREIGN KEY ("id_persona") REFERENCES "Persona"("id_persona") ON DELETE RESTRICT ON UPDATE CASCADE;
