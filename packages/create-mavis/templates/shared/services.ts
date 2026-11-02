import { inject, type InjectionKey } from 'vue'

export interface ProjectService {
  save(name: string): Promise<void>
}
export const projectServiceKey: InjectionKey<ProjectService> = Symbol('project-service')
export function useProjectService() {
  const service = inject(projectServiceKey)
  if (!service) throw new Error('Provide a ProjectService from the application host.')
  return service
}
