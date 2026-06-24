import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  console.log("🧹 Clearing old seed data...")
  // Delete child records first to satisfy foreign key rules
  await prisma.cutoff.deleteMany({})
  await prisma.college.deleteMany({})

  console.log("🌱 Inserting fresh colleges...")
  await prisma.college.createMany({
    data: [
      { name: "IIT Delhi", location: "New Delhi", state: "Delhi", fees: 200000, rating: 4.8, description: "One of the top engineering colleges in India" },
      { name: "IIT Bombay", location: "Mumbai", state: "Maharashtra", fees: 220000, rating: 4.9, description: "Premier engineering institution on the west coast" },
      { name: "NIT Trichy", location: "Tiruchirappalli", state: "Tamil Nadu", fees: 150000, rating: 4.5, description: "Top NIT in South India" },
      { name: "BITS Pilani", location: "Pilani", state: "Rajasthan", fees: 450000, rating: 4.7, description: "Top private engineering college in India" },
      { name: "IIT Madras", location: "Chennai", state: "Tamil Nadu", fees: 210000, rating: 4.9, description: "Ranked #1 engineering college in India" },
    ],
    skipDuplicates: true
  })

  console.log("📈 Inserting fresh cutoffs...")
  await prisma.cutoff.createMany({
    data: [
      { exam: "JEE", category: "General", openingRank: 1, closingRank: 100, collegeId: 1 },
      { exam: "JEE", category: "General", openingRank: 1, closingRank: 50, collegeId: 2 },
      { exam: "JEE", category: "General", openingRank: 500, closingRank: 3000, collegeId: 3 },
      { exam: "JEE", category: "General", openingRank: 100, closingRank: 500, collegeId: 4 },
      { exam: "JEE", category: "General", openingRank: 1, closingRank: 80, collegeId: 5 },
      { exam: "JEE", category: "OBC", openingRank: 100, closingRank: 500, collegeId: 1 },
      { exam: "JEE", category: "OBC", openingRank: 50, closingRank: 200, collegeId: 2 },
      { exam: "JEE", category: "OBC", openingRank: 3000, closingRank: 8000, collegeId: 3 },
    ],
    skipDuplicates: true
  })

  console.log("Seeded successfully!")
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())