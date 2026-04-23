import 'dotenv/config';
import { PrismaClient, LeadSource } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const leads = [
  { nombre: 'Ana García', email: 'ana.garcia@gmail.com', telefono: '+57 310 234 5678', fuente: LeadSource.instagram, producto_interes: 'Curso de marketing digital', presupuesto: 350 },
  { nombre: 'Carlos Martínez', email: 'carlos.martinez@hotmail.com', telefono: '+57 320 456 7890', fuente: LeadSource.facebook, producto_interes: 'Mentoría 1:1', presupuesto: 800 },
  { nombre: 'Laura Torres', email: 'laura.torres@gmail.com', fuente: LeadSource.landing_page, producto_interes: 'Pack de plantillas', presupuesto: 120 },
  { nombre: 'Miguel Rodríguez', email: 'miguel.rod@outlook.com', telefono: '+57 315 789 0123', fuente: LeadSource.referido, producto_interes: 'Curso email marketing', presupuesto: 250 },
  { nombre: 'Sofía López', email: 'sofia.lopez@gmail.com', telefono: '+57 318 012 3456', fuente: LeadSource.instagram, producto_interes: 'Comunidad mensual', presupuesto: 49 },
  { nombre: 'Andrés Herrera', email: 'andres.herrera@gmail.com', fuente: LeadSource.facebook, producto_interes: 'Curso de copywriting', presupuesto: 199 },
  { nombre: 'Valentina Díaz', email: 'vale.diaz@gmail.com', telefono: '+57 311 345 6789', fuente: LeadSource.otro, producto_interes: 'Asesoría de marca', presupuesto: 500 },
  { nombre: 'Felipe Morales', email: 'felipe.morales@gmail.com', fuente: LeadSource.landing_page, producto_interes: 'Curso de ventas', presupuesto: 450 },
  { nombre: 'Isabella Jiménez', email: 'isa.jimenez@hotmail.com', telefono: '+57 322 567 8901', fuente: LeadSource.instagram, producto_interes: 'Pack de plantillas', presupuesto: 120 },
  { nombre: 'Sebastián Castro', email: 'seba.castro@gmail.com', fuente: LeadSource.referido, producto_interes: 'Mentoría 1:1', presupuesto: 800 },
  { nombre: 'Natalia Vargas', email: 'nata.vargas@gmail.com', telefono: '+57 312 678 9012', fuente: LeadSource.facebook, producto_interes: 'Curso de marketing digital', presupuesto: 350 },
  { nombre: 'Camilo Pérez', email: 'camilo.perez@outlook.com', fuente: LeadSource.instagram, producto_interes: 'Comunidad mensual', presupuesto: 49 },
  { nombre: 'Daniela Romero', email: 'dani.romero@gmail.com', telefono: '+57 316 890 1234', fuente: LeadSource.landing_page, producto_interes: 'Curso email marketing', presupuesto: 250 },
  { nombre: 'Tomás Gutiérrez', email: 'tomas.gut@gmail.com', fuente: LeadSource.otro, producto_interes: 'Asesoría de marca', presupuesto: 600 },
  { nombre: 'Mariana Reyes', email: 'mari.reyes@gmail.com', telefono: '+57 319 901 2345', fuente: LeadSource.facebook, producto_interes: 'Curso de copywriting', presupuesto: 199 },
];

async function main() {
  await prisma.lead.deleteMany();
  const daysAgo = (n: number) => new Date(Date.now() - n * 86400000);

  for (let i = 0; i < leads.length; i++) {
    await prisma.lead.create({
      data: {
        ...leads[i],
        createdAt: daysAgo(Math.floor(Math.random() * 30)),
      },
    });
  }

  console.log(`✓ ${leads.length} leads creados`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
