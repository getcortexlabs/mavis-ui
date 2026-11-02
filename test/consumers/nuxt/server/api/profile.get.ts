export default defineEventHandler((event) => {
  const query = getQuery(event)
  const name = query.name === 'Marina' ? 'Marina' : 'Rafa'
  return { name, email: `${name.toLowerCase()}@example.com` }
})
