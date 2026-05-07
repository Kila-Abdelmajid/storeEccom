import postgres from 'postgres'

const connectionString = process.env.DATABASE_URL!
const sql = postgres(connectionString, {
  ssl: 'require',
  max: 10, // Max connections f l-pool
})

export default sql