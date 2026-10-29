export const catalogRoutes = [
  { path: '/checks/layout', component: () => import('./pages/LayoutCheck.vue') },
  { path: '/', component: () => import('./pages/Catalog.vue') },
  { path: '/components/:id', component: () => import('./pages/Component.vue'), props: true },
  { path: '/showcase', component: () => import('./pages/Showcase.vue') },
  { path: '/showcase/focus', component: () => import('./pages/Focus.vue') },
  { path: '/showcase/vehicle', component: () => import('./pages/Vehicle.vue') },
  { path: '/showcase/vehicle/details', component: () => import('./pages/VehicleDetails.vue') },
]
