import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  await prisma.college.createMany({
    data: [
      { name: "IIT Delhi", location: "New Delhi", state: "Delhi", fees: 200000, rating: 4.8, description: "One of the top engineering colleges in India" },
      { name: "IIT Bombay", location: "Mumbai", state: "Maharashtra", fees: 220000, rating: 4.9, description: "Premier engineering institution on the west coast" },
      { name: "IIT Madras", location: "Chennai", state: "Tamil Nadu", fees: 210000, rating: 4.9, description: "Ranked #1 engineering college in India" },
      { name: "IIT Kanpur", location: "Kanpur", state: "Uttar Pradesh", fees: 200000, rating: 4.7, description: "Known for research and academics" },
      { name: "IIT Kharagpur", location: "Kharagpur", state: "West Bengal", fees: 195000, rating: 4.6, description: "Oldest IIT in India" },
      { name: "IIT Roorkee", location: "Roorkee", state: "Uttarakhand", fees: 198000, rating: 4.6, description: "Asia's oldest technical institute" },
      { name: "IIT Guwahati", location: "Guwahati", state: "Assam", fees: 190000, rating: 4.4, description: "Top IIT in North East India" },
      { name: "IIT Hyderabad", location: "Hyderabad", state: "Telangana", fees: 192000, rating: 4.4, description: "Young IIT with strong research focus" },
      { name: "IIT Indore", location: "Indore", state: "Madhya Pradesh", fees: 188000, rating: 4.3, description: "Growing IIT in Central India" },
      { name: "IIT Jodhpur", location: "Jodhpur", state: "Rajasthan", fees: 185000, rating: 4.2, description: "IIT in the desert city of Rajasthan" },
      { name: "NIT Trichy", location: "Tiruchirappalli", state: "Tamil Nadu", fees: 150000, rating: 4.5, description: "Top NIT in South India" },
      { name: "NIT Warangal", location: "Warangal", state: "Telangana", fees: 140000, rating: 4.4, description: "Premier NIT in Telangana" },
      { name: "NIT Surathkal", location: "Surathkal", state: "Karnataka", fees: 145000, rating: 4.3, description: "Top NIT on the west coast" },
      { name: "NIT Calicut", location: "Kozhikode", state: "Kerala", fees: 138000, rating: 4.3, description: "Leading NIT in Kerala" },
      { name: "NIT Rourkela", location: "Rourkela", state: "Odisha", fees: 135000, rating: 4.2, description: "Top NIT in Eastern India" },
      { name: "NIT Allahabad", location: "Prayagraj", state: "Uttar Pradesh", fees: 130000, rating: 4.1, description: "One of the oldest NITs" },
      { name: "NIT Jaipur", location: "Jaipur", state: "Rajasthan", fees: 132000, rating: 4.0, description: "NIT in the Pink City" },
      { name: "NIT Bhopal", location: "Bhopal", state: "Madhya Pradesh", fees: 128000, rating: 4.0, description: "NIT in the City of Lakes" },
      { name: "NIT Patna", location: "Patna", state: "Bihar", fees: 125000, rating: 3.9, description: "NIT serving Bihar and Jharkhand" },
      { name: "NIT Surat", location: "Surat", state: "Gujarat", fees: 130000, rating: 4.0, description: "NIT in the Diamond City" },
      { name: "BITS Pilani", location: "Pilani", state: "Rajasthan", fees: 450000, rating: 4.7, description: "Top private engineering college in India" },
      { name: "BITS Goa", location: "Goa", state: "Goa", fees: 460000, rating: 4.5, description: "BITS campus in scenic Goa" },
      { name: "BITS Hyderabad", location: "Hyderabad", state: "Telangana", fees: 455000, rating: 4.5, description: "BITS campus in tech hub Hyderabad" },
      { name: "VIT Vellore", location: "Vellore", state: "Tamil Nadu", fees: 180000, rating: 4.2, description: "Top private university in South India" },
      { name: "VIT Chennai", location: "Chennai", state: "Tamil Nadu", fees: 185000, rating: 4.1, description: "VIT campus in Chennai" },
      { name: "Manipal Institute of Technology", location: "Manipal", state: "Karnataka", fees: 200000, rating: 4.1, description: "Top private engineering college in Karnataka" },
      { name: "SRM Institute of Science and Technology", location: "Chennai", state: "Tamil Nadu", fees: 170000, rating: 3.9, description: "Large private university in Chennai" },
      { name: "Thapar Institute of Engineering", location: "Patiala", state: "Punjab", fees: 210000, rating: 4.2, description: "Top private engineering college in North India" },
      { name: "Delhi Technological University", location: "New Delhi", state: "Delhi", fees: 80000, rating: 4.1, description: "Premier state technical university in Delhi" },
      { name: "Jadavpur University", location: "Kolkata", state: "West Bengal", fees: 10000, rating: 4.3, description: "Top government university in West Bengal" },
      { name: "Anna University", location: "Chennai", state: "Tamil Nadu", fees: 50000, rating: 4.0, description: "Premier technical university in Tamil Nadu" },
      { name: "PSG College of Technology", location: "Coimbatore", state: "Tamil Nadu", fees: 95000, rating: 4.0, description: "Top private engineering college in Coimbatore" },
      { name: "Amity University", location: "Noida", state: "Uttar Pradesh", fees: 300000, rating: 3.7, description: "Large private university in NCR" },
      { name: "Symbiosis Institute of Technology", location: "Pune", state: "Maharashtra", fees: 250000, rating: 3.8, description: "Private engineering college in Pune" },
      { name: "PES University", location: "Bengaluru", state: "Karnataka", fees: 220000, rating: 4.0, description: "Top private engineering college in Bangalore" },
      { name: "RV College of Engineering", location: "Bengaluru", state: "Karnataka", fees: 100000, rating: 4.1, description: "Reputed engineering college in Bangalore" },
      { name: "BMS College of Engineering", location: "Bengaluru", state: "Karnataka", fees: 95000, rating: 4.0, description: "One of the oldest private colleges in Karnataka" },
      { name: "Coimbatore Institute of Technology", location: "Coimbatore", state: "Tamil Nadu", fees: 80000, rating: 3.8, description: "Reputed engineering college in Coimbatore" },
      { name: "College of Engineering Pune", location: "Pune", state: "Maharashtra", fees: 70000, rating: 4.1, description: "One of the oldest engineering colleges in Asia" },
      { name: "IIIT Hyderabad", location: "Hyderabad", state: "Telangana", fees: 250000, rating: 4.5, description: "Top IIIT focused on research and innovation" },
      { name: "IIIT Delhi", location: "New Delhi", state: "Delhi", fees: 230000, rating: 4.3, description: "Premier IIIT in the capital" },
      { name: "IIIT Bangalore", location: "Bengaluru", state: "Karnataka", fees: 400000, rating: 4.4, description: "Top IIIT for software and research" },
      { name: "IIT BHU Varanasi", location: "Varanasi", state: "Uttar Pradesh", fees: 196000, rating: 4.4, description: "IIT located in the holy city of Varanasi" },
      { name: "IIT Dhanbad (ISM)", location: "Dhanbad", state: "Jharkhand", fees: 194000, rating: 4.3, description: "Known for mining and engineering" },
      { name: "NIT Kurukshetra", location: "Kurukshetra", state: "Haryana", fees: 132000, rating: 4.0, description: "NIT in the historical city of Kurukshetra" },
    ],
    skipDuplicates: true
  })

  await prisma.cutoff.createMany({
    data: [
      { exam: "JEE", category: "General", openingRank: 1, closingRank: 100, collegeId: 1 },
      { exam: "JEE", category: "General", openingRank: 1, closingRank: 50, collegeId: 2 },
      { exam: "JEE", category: "General", openingRank: 1, closingRank: 80, collegeId: 3 },
      { exam: "JEE", category: "General", openingRank: 100, closingRank: 500, collegeId: 4 },
      { exam: "JEE", category: "General", openingRank: 150, closingRank: 800, collegeId: 5 },
      { exam: "JEE", category: "General", openingRank: 200, closingRank: 1000, collegeId: 6 },
      { exam: "JEE", category: "General", openingRank: 500, closingRank: 2000, collegeId: 7 },
      { exam: "JEE", category: "General", openingRank: 800, closingRank: 3000, collegeId: 8 },
      { exam: "JEE", category: "General", openingRank: 1000, closingRank: 5000, collegeId: 9 },
      { exam: "JEE", category: "General", openingRank: 2000, closingRank: 8000, collegeId: 10 },
      { exam: "JEE", category: "General", openingRank: 500, closingRank: 3000, collegeId: 11 },
      { exam: "JEE", category: "General", openingRank: 800, closingRank: 4000, collegeId: 12 },
      { exam: "JEE", category: "General", openingRank: 1000, closingRank: 5000, collegeId: 13 },
      { exam: "JEE", category: "General", openingRank: 1500, closingRank: 6000, collegeId: 14 },
      { exam: "JEE", category: "General", openingRank: 2000, closingRank: 7000, collegeId: 15 },
      { exam: "JEE", category: "OBC", openingRank: 100, closingRank: 500, collegeId: 1 },
      { exam: "JEE", category: "OBC", openingRank: 50, closingRank: 200, collegeId: 2 },
      { exam: "JEE", category: "OBC", openingRank: 80, closingRank: 300, collegeId: 3 },
      { exam: "JEE", category: "SC", openingRank: 200, closingRank: 1000, collegeId: 1 },
      { exam: "JEE", category: "SC", openingRank: 100, closingRank: 500, collegeId: 2 },
      { exam: "JEE", category: "ST", openingRank: 500, closingRank: 2000, collegeId: 1 },
    ],
    skipDuplicates: true
  })

  console.log("Seeded successfully!")
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())