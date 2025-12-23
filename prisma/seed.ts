import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  console.log("Starting seed...")

  // Create a firm
  const firm = await prisma.firm.create({
    data: {
      name: "Demo Law Firm",
      address: "123 Main Street, Suite 100",
      phone: "(555) 123-4567",
    },
  })
  console.log("Created firm:", firm.name)

  // Create admin user
  const adminPassword = await bcrypt.hash("Admin123!", 12)
  const admin = await prisma.user.create({
    data: {
      email: "admin@demo.com",
      name: "Admin User",
      passwordHash: adminPassword,
      role: "ADMIN",
      status: "ACTIVE",
      firmId: firm.id,
    },
  })
  console.log("Created admin:", admin.email)

  // Create attorney user
  const attorneyPassword = await bcrypt.hash("Attorney123!", 12)
  const attorney = await prisma.user.create({
    data: {
      email: "attorney@demo.com",
      name: "Jane Attorney",
      passwordHash: attorneyPassword,
      role: "ATTORNEY",
      status: "ACTIVE",
      firmId: firm.id,
      title: "Senior Associate",
    },
  })
  console.log("Created attorney:", attorney.email)

  // Create a client organization
  const client = await prisma.client.create({
    data: {
      name: "Acme Corporation",
      type: "Corporation",
      email: "contact@acme.com",
      firmId: firm.id,
    },
  })
  console.log("Created client:", client.name)

  // Create client user
  const clientPassword = await bcrypt.hash("Client123!", 12)
  const clientUser = await prisma.user.create({
    data: {
      email: "client@demo.com",
      name: "Bob Client",
      passwordHash: clientPassword,
      role: "CLIENT",
      status: "ACTIVE",
      firmId: firm.id,
    },
  })
  console.log("Created client user:", clientUser.email)

  console.log("")
  console.log("========================================")
  console.log("Seed completed successfully!")
  console.log("========================================")
  console.log("")
  console.log("Test Login Credentials:")
  console.log("------------------------")
  console.log("Admin:    admin@demo.com / Admin123!")
  console.log("Attorney: attorney@demo.com / Attorney123!")
  console.log("Client:   client@demo.com / Client123!")
  console.log("")
}

main()
  .catch((e) => {
    console.error("Seed failed:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
