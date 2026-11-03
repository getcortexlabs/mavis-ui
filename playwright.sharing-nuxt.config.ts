import { sharingConfig } from './test/sharing/config'
export default sharingConfig(process.env.MAVIS_CREATOR_CASE ?? 'both-nuxt')
